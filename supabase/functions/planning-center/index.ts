import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedReads = [
  /^\/services\/v2\/people(?:\/[^/?]+\/(?:blockouts|person_team_position_assignments|schedules|scheduling_preferences))?(?:\?.*)?$/,
  /^\/services\/v2\/service_types(?:\/[^/?]+\/(?:plans|teams|team_positions)(?:\/[^/?]+(?:\/plan_times|\/team_members)?)?)?(?:\?.*)?$/,
  /^\/services\/v2\/teams(?:\/[^/?]+\/(?:people|person_team_position_assignments|team_positions))?(?:\?.*)?$/,
];
const publishPath = /^\/services\/v2\/service_types\/[^/?]+\/plans\/[^/?]+\/team_members$/;

function cors(origin: string) {
  const allowedOrigin = Deno.env.get('APP_ORIGIN') ?? '';
  return {
    'Access-Control-Allow-Origin': origin === allowedOrigin ? origin : allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin') ?? '';
  const headers = cors(origin);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST' || origin !== Deno.env.get('APP_ORIGIN')) return Response.json({ error: 'Not allowed' }, { status: 403, headers });
  const authorization = request.headers.get('authorization');
  if (!authorization) return Response.json({ error: 'Sign in required' }, { status: 401, headers });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== Deno.env.get('ALLOWED_EMAIL')?.toLowerCase()) return Response.json({ error: 'Not authorized' }, { status: 403, headers });

  const input = await request.json() as { method?: string; path?: string; body?: Record<string, unknown> };
  const method = input.method?.toUpperCase() ?? 'GET';
  const path = input.path ?? '';
  const isRead = method === 'GET' && allowedReads.some((pattern) => pattern.test(path));
  const isPublish = method === 'POST' && publishPath.test(path);
  if (!isRead && !isPublish) return Response.json({ error: 'Planning Center operation is not allowed' }, { status: 400, headers });
  if (isPublish) {
    const data = input.body?.data as { type?: string; attributes?: Record<string, unknown> } | undefined;
    if (!data || data.type !== 'PlanPerson' || !data.attributes) return Response.json({ error: 'Invalid assignment' }, { status: 400, headers });
    data.attributes.prepare_notification = false;
    delete data.attributes.notification_prepared_at;
  }

  const appId = Deno.env.get('PLANNING_CENTER_APP_ID');
  const secret = Deno.env.get('PLANNING_CENTER_SECRET');
  if (!appId || !secret) return Response.json({ error: 'Planning Center is not configured' }, { status: 503, headers });
  const response = await fetch(`https://api.planningcenteronline.com${path}`, {
    method,
    headers: { Authorization: `Basic ${btoa(`${appId}:${secret}`)}`, 'Content-Type': 'application/json', 'User-Agent': 'Garden City Worship Scheduler' },
    body: isPublish ? JSON.stringify(input.body) : undefined,
  });
  return new Response(await response.text(), { status: response.status, headers: { ...headers, 'Content-Type': 'application/json' } });
});
