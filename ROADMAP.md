# Garden City Worship Scheduler Roadmap

This document is the canonical plan for V2. It is also the boundary between the
currently usable V1 application and deliberate V2 development.

## Product tracks

### V1 — current and usable

V1 remains the production application. It may receive focused features, bug
fixes, and workflow improvements based on real scheduling use. V1 work should
remain stable, reversible, and independently releasable. V1 should not be
refactored merely to resemble V2.

Observations from real V1 scheduling belong in `V2_LEARNINGS.md`. An observation
does not automatically authorize either a V1 change or V2 implementation.

### V2 — deliberate next-generation scheduler

V2 will be built incrementally beside V1. Each sprint must be independently
reviewable and testable. V2 does not replace a V1 workflow until the replacement
is demonstrably better, approved, and ready for real use.

## Status

Allowed sprint statuses:

- `NOT STARTED`
- `IN PROGRESS`
- `BLOCKED`
- `READY FOR REVIEW`
- `COMPLETE`

Current sprint: none; the revised roadmap is awaiting review.

Recommended next sprint after approval: **Sprint 0 — Coexistence and test
foundation**.

| Sprint | Name | Status |
| --- | --- | --- |
| 0 | Coexistence and test foundation | NOT STARTED |
| 1 | Scheduling domain snapshot | NOT STARTED |
| 2 | Planning Center read normalization | NOT STARTED |
| 3 | Role-specific musician intelligence | NOT STARTED |
| 4 | Band templates and balance policy | NOT STARTED |
| 5 | Deterministic band evaluator | NOT STARTED |
| 6 | Human calibration workbench | NOT STARTED |
| 7 | Single-week candidate generation | NOT STARTED |
| 8 | Single-week Build My Band workflow | NOT STARTED |
| 9 | Global optimizer bake-off | NOT STARTED |
| 10 | Multi-week optimization | NOT STARTED |
| 11 | Multi-week scheduling workspace | NOT STARTED |
| 12 | Availability-message import | NOT STARTED |
| 13 | Rich scheduling constraints from messages | NOT STARTED |
| 14 | Reviewed Planning Center blockout write-back | NOT STARTED |
| 15 | Reviewed schedule publishing | NOT STARTED |
| 16 | Replacement workflow | NOT STARTED |
| 17 | Natural-language scheduling assistant | NOT STARTED |

## Technical coexistence strategy

Use one repository and keep `main` as the stable, deployable V1 line. Develop
each V1 fix or V2 sprint on a short-lived, focused feature branch and merge only
after its acceptance criteria pass. Do not maintain a long-lived V2 branch:
ongoing V1 changes would make it expensive and risky to reconcile.

V2 should be isolated using these boundaries:

- V1 routes remain `/people`, `/bands`, and `/schedule` until an approved
  migration changes them.
- V2 user interfaces live under `/v2/...` and are hidden behind an explicit
  owner-only feature flag while incomplete.
- V2 domain code lives under `src/lib/v2/`; it must not depend on page DOM or
  browser globals.
- V2 persistence uses additive migrations and explicitly named V2 tables or
  versioned records. Do not reinterpret V1 data in place.
- Planning Center transport remains a server-side responsibility. Both versions
  may share a hardened transport client, but they should consume normalized
  application-domain data rather than raw API responses.
- A V2 feature may read V1 data through a documented adapter. It must not mutate
  V1 drafts or settings until the relevant write sprint is approved.

Commits and pull requests should be labeled in their subject or description as
`V1`, `V2`, `shared`, or `docs`. Avoid mixing categories unless a shared change
is necessary and explicitly described.

## Current architecture assessment

V1 is a static Astro application deployed to GitHub Pages. Pages contain a
substantial amount of browser-side orchestration. Supabase supplies authentication,
row-level-secured application tables, and an Edge Function that proxies an
allowlisted subset of the Planning Center API. Scheduling is performed in the
browser by deterministic TypeScript in `src/lib/scheduler`.

The V1 scheduler processes Sundays in date order and chooses the lowest-penalty
eligible person or required group for the currently open positions. Earlier
weeks affect later scoring, but completed choices are never reconsidered. It
does not generate complete candidate bands or optimize the requested window as
a whole. Its hard-coded score emphasizes prior use, minimum gaps, same-tier
counts, and an every-Sunday worship-leader exception. It is useful V1 behavior
and a learning baseline, not the V2 balance model.

### Components worth sharing or evolving

- Supabase authentication, owner restriction, and row-level-security pattern.
- Planning Center credential isolation, endpoint allowlist, and notification-safe
  write policy.
- Planning Center person, team, position, plan, assignment, and blockout retrieval
  once moved behind typed normalization adapters.
- Existing stable Planning Center identifiers stored in application data.
- Pure eligibility concepts and the A/B/C terminology, after versioned domain
  types make their semantics explicit.
- Blockout reasons, serving-frequency preferences, required pairs, visible teams,
  weekly position requirements, and draft/publish audit fields as source concepts.
- Global visual language and accessible status treatments where they serve both
  versions.

### V1 architecture not to carry forward

- Greedy, irreversible, Sunday-by-Sunday schedule generation.
- A single opaque scalar with hard-coded weights as the definition of balance.
- Assuming one global talent rating accurately describes every role.
- Mixing Planning Center response parsing, UI state, persistence, and scheduling
  orchestration inside page scripts.
- Letting raw Planning Center payload shapes become optimizer-domain models.
- Client-only optimization for workloads that need bounded runtime, solver status,
  auditability, or private configuration.
- Explanation strings assembled as incidental side effects of greedy selection.
- Broad page files as the primary home for reusable scheduling behavior.
- Treating AI output as authoritative data or allowing it to initiate writes.

## Resolved architecture and product decisions

These decisions govern the roadmap and should be changed only through an explicit
roadmap revision:

1. **Parallel tracks:** V1 remains the continuously deployable production tool
   and learning source. V2 work stays isolated and does not freeze or covertly
   refactor V1. Learnings are recorded before they influence V2 behavior.
2. **Repository strategy:** use one repository, stable `main`, short-lived feature
   branches, `/v2` route and module boundaries, and additive persistence changes.
3. **Planning Center sequencing:** normalize Planning Center reads early in Sprint
   2. Keep every Planning Center write late, reviewed, deterministic, verified,
   and audited.
4. **Talent source of truth:** V2 uses private `musician + role -> A/B/C` ratings.
   A means Strong, B means Solid, and C means Developing—not unschedulable. Only
   roles the musician actually serves require ratings. V1 global ratings may seed
   V2 data but remain authoritative only for V1.
5. **Scheduling unit:** initially treat one service date and Planning Center plan
   as one scheduling unit. Preserve room for multiple service-time constraints
   without implementing them until actual workflow evidence requires it.
6. **Locks and exclusions:** both are first-class domain inputs from Sprint 1.
   Locks identify person, service/date, and role. Exclusions identify person,
   service/date, and an optional role.
7. **Balance configuration:** early policies are internal and versioned (for
   example v0.1, v0.2). Do not build a broad settings UI until calibration proves
   which parameters are useful.
8. **Complete-band philosophy:** a C musician may be well supported in one lineup
   and risky in another. Evaluation must model role context, anchors, and
   complementary groups rather than maximizing individual talent.
9. **Chemistry extensibility:** domain identifiers and policy inputs must leave a
   narrow path for preferred, strong-chemistry, required, avoid, complementary,
   and group relationships. Do not implement speculative chemistry scoring before
   calibration evidence supports it.
10. **Explainability:** deterministic reason codes must explain both selection and
    non-selection, including global opportunity costs across weeks. OpenAI may
    later phrase these facts but may never invent them.
11. **Global objective:** use lexicographic priorities: satisfy hard constraints/
    minimize required-role gaps; maximize the weakest Sunday; minimize quality
    variance; improve rotation and preferences; then minimize disruption. Raising
    the floor is more important than producing one exceptional week.
12. **Optimizer freedom:** Sprint 9 must compare TypeScript bounded search,
    OR-Tools CP-SAT, and exhaustive tiny-case verification. A private Python
    service is allowed if evidence justifies its complexity.
13. **Calibration:** human Band A/B comparisons and replay across policy versions
    are required before candidate generation and optimization are treated as
    trustworthy.
14. **Message import:** retain the reviewed text-message availability and rich
    constraint workflows. AI interprets language; deterministic code validates
    and schedules; a human confirms.
15. **Write safety:** OpenAI never initiates a Planning Center mutation. All writes
    follow interpretation -> structured proposal -> deterministic validation ->
    visible diff -> human confirmation -> write -> verification/audit.
16. **Retention:** keep policy versions, calibration fixtures, solver snapshots,
    and audit history indefinitely unless storage becomes material. Prefer
    structured scheduling facts and minimal useful source context over indefinite
    retention of unrelated raw message conversation.

Sprint 0 still needs to choose the concrete feature-flag mechanism and document
the exact V2 data namespace. Those are Sprint 0 deliverables, not blockers to
starting it.

## Sprint plan

### Sprint 0 — Coexistence and test foundation

**Status:** NOT STARTED

**Goal:** Establish safe V1/V2 boundaries, repeatable tests, and recorded
architecture decisions without adding user-facing V2 behavior.

**Why:** Every later sprint needs protection against destabilizing the V1 app and
a common way to verify scheduling behavior.

**Scope:** Add architecture decision records; establish `/v2` route and module
conventions without a functional scheduler; choose a feature-flag design; add a
unit-test runner and fixtures; capture current V1 behavior as characterization
tests; document branch, migration, and release practices.

**Out of Scope:** New scheduling logic, schema changes for talent or optimization,
and user-visible V2 workflows.

**Technical Work:** Add test tooling compatible with Astro/TypeScript; make only
the smallest extractions needed to test V1 pure functions; define versioned
domain boundaries and migration rules; document the internal V2 data namespace;
and record that the optimizer deployment decision is intentionally deferred to
Sprint 9's evidence-based bake-off.

**Acceptance Criteria:** V1 builds and its principal routes still work; V1
scheduler fixtures pass; unfinished V2 code cannot appear to ordinary users;
the decisions above are recorded; contributors can run one documented check.

**Testing:** Production build, auth smoke test, People/Bands/Schedule smoke tests,
V1 generation fixtures, and feature-flag access tests.

**Dependencies:** Roadmap approval.

**V1 Impact:** Testability extractions only; no intentional behavior change.

### Sprint 1 — Scheduling domain snapshot

**Status:** NOT STARTED

**Goal:** Define one typed, versioned input snapshot for deterministic evaluation
and future optimization.

**Why:** Scoring and solvers must operate on stable application concepts rather
than UI state or raw Planning Center payloads.

**Scope:** Model musicians, roles, one service date/Planning Center plan as the
initial scheduling unit, requested slots, assignments, availability states,
blockouts, source provenance, locks, exclusions, relationship-extension records,
and rule configuration. A locked assignment identifies person, service/date, and
role. An exclusion identifies person, service/date, and an optional role. Create
fixture builders and validation.

**Out of Scope:** Scoring, schedule generation, API sync, and UI editing.

**Technical Work:** Pure TypeScript domain types, runtime validation, date/time
rules, normalized IDs, snapshot versioning, deterministic constraint reason-code
shapes, and representative sanitized fixtures. Reserve typed, versionable space
for required/preferred/avoid/complementary person or group relationships without
implementing chemistry scoring.

**Acceptance Criteria:** Valid snapshots round-trip deterministically; invalid or
ambiguous inputs produce useful errors; fixtures represent existing assignments,
missing data, and multiple Sundays.

**Testing:** Validation boundaries, duplicate identities, timezone/date cases,
unknown availability, lock/exclusion conflicts, role-scoped exclusions, relationship
references, and snapshot-version failures.

**Dependencies:** Sprint 0.

**V1 Impact:** None; a read adapter may later reuse V1 data.

### Sprint 2 — Planning Center read normalization

**Status:** NOT STARTED

**Goal:** Make real Planning Center scheduling data a reliable, observable input
to the V2 domain model early.

**Why:** Talent modeling, evaluation, and fixtures should be exercised against
the identities and plan structures V2 will actually consume. Optimization is
only trustworthy when existing assignments, statuses, roles, and blockouts are
correct and fresh.

**Scope:** Normalize people, teams, positions, plans, service dates, existing
assignments, Confirmed/Unconfirmed/Declined status, blockouts/reasons, and stable
Planning Center IDs into Sprint 1 snapshots. Record source and freshness metadata.

**Out of Scope:** Planning Center writes, schedule generation, balance scoring,
and support for independently optimizing multiple service times.

**Technical Work:** Typed server-side read client and domain adapters, pagination,
rate/error handling, conservative caching policy, identity mapping, sync metadata,
sanitized real-payload fixtures, and contract tests. Reuse the hardened transport
where safe without coupling V2 to V1 page orchestration.

**Acceptance Criteria:** V2 can construct and validate a domain snapshot from the
selected real Planning Center plan; every imported fact has source/freshness;
assignment status and blockouts map correctly; partial sync failure cannot appear
as availability; no mutation endpoint is added.

**Testing:** Pagination, missing relationships, duplicate names, stable ID mapping,
archived records, status variants, blockout ranges/reasons, rate limits, partial
failures, stale cache, and sanitized-real-payload replay.

**Dependencies:** Sprint 1.

**V1 Impact:** None. A hardened shared read adapter may benefit V1 later only
through a separate reviewed V1 change.

### Sprint 3 — Role-specific musician intelligence

**Status:** NOT STARTED

**Goal:** Represent private A/B/C ability by musician and role with manageable
administration.

**Why:** Complete-band quality cannot be assessed accurately from one global
tier when a musician's ability varies by instrument.

**Scope:** Make `musician + served role -> A/B/C` the V2 source of truth. Add
primary/secondary role metadata, provenance, and missing/inherited states; build
an owner-only V2 editor; seed ratings for actual served roles from the V1 global
tier without changing V1. A means Strong, B Solid, and C Developing.

**Out of Scope:** Band scoring, automatic inference, and exposing ratings to
musicians or Planning Center.

**Technical Work:** Additive V2 schema and RLS, import/seed preview, typed CRUD,
private admin UI, and audit timestamps.

**Acceptance Criteria:** Each role a musician actually serves can have an explicit
A/B/C rating; unrelated roles require no rating; inheritance is visible; missing
data is never silently invented; ratings remain private and are never written to
Planning Center; V1 continues to use its existing tier.

**Testing:** RLS/privacy, imports, overrides, deleted Planning Center roles,
missing ratings, and V1 regression smoke tests.

**Dependencies:** Sprints 1–2.

**V1 Impact:** Read-only seeding from V1 settings.

### Sprint 4 — Band templates and balance policy

**Status:** NOT STARTED

**Goal:** Express what a viable and well-supported band means before assigning
numeric scores.

**Why:** Anchor roles and developing-musician support are product policy, not
solver implementation details.

**Scope:** Define required roles/counts, anchor roles, complementary groups (such
as rhythm section), maximum recommended C count, contextual C-support rules, hard
versus soft constraints, and internal versioned policy presets. Include a reserved
policy representation for evidence-backed pair/group modifiers without assigning
speculative chemistry weights.

**Out of Scope:** Candidate generation, optimization, and final weight tuning.

**Technical Work:** Internal policy schema, validation, immutable policy versions
referenced by evaluations, and defaults based on accepted V1 learnings. Provide
developer/calibration inspection only; do not build a broad settings UI.

**Acceptance Criteria:** A versioned internal policy can describe current required
positions and explain each rule in plain language; it treats C as contextual
development rather than disqualification; invalid or contradictory configurations
are rejected; theoretical weights are not exposed as user settings.

**Testing:** Missing anchors, alternative harmonic roles, multiple required slots,
contradictory rules, and policy-version replay.

**Dependencies:** Sprints 1–3.

**V1 Impact:** None.

### Sprint 5 — Deterministic band evaluator

**Status:** NOT STARTED

**Goal:** Evaluate a manually supplied complete band without generating one.

**Why:** The product must prove that it can recognize a balanced band before it
attempts to build schedules.

**Scope:** Calculate coverage, anchor strength, tier composition, weakest critical
area, complementary-group strength, developing-musician support, warnings, and
a normalized presentation score with a detailed breakdown. Produce deterministic
selection, rejection, and alternative reason codes suitable for later “Why?” and
“Why wasn't X selected?” explanations.

**Out of Scope:** Searching for musicians, multi-week fairness, AI explanations,
and Planning Center writes.

**Technical Work:** Pure deterministic evaluator; structured positive, negative,
and counterfactual reason codes; versioned scoring configuration; golden fixtures;
and optional exhaustive enumeration for tiny test cases. Reasons must originate
in deterministic evaluation, never generated inference.

**Acceptance Criteria:** Identical inputs produce identical results; every score
change is traceable to named factors; hard failures cannot be hidden by a high
aggregate score; the result can state why a person/role substitution is invalid
or changes band quality without relying on OpenAI.

**Testing:** Strong/weak rhythm sections, unsupported C musicians, missing anchors,
role-specific tiers, equivalent lineups, and incomplete-rating confidence.

**Dependencies:** Sprints 1–4.

**V1 Impact:** None.

### Sprint 6 — Human calibration workbench

**Status:** NOT STARTED

**Goal:** Compare algorithm judgments with real human band judgments and record
tuning evidence.

**Why:** Balance rules are not finalized and real V1 use is a deliberate source
of product learning.

**Scope:** Owner-only Band A versus Band B comparison; score breakdown differences;
human preference and notes; explicit feedback on anchors, A/B/C combinations,
developing-musician support, and possible chemistry effects; fixture export; and
policy-version comparison.

**Out of Scope:** Automatic schedule generation and changing weights without
review.

**Technical Work:** Comparison UI, calibration dataset, deterministic replay, and
documented tuning workflow connected to `V2_LEARNINGS.md`.

**Acceptance Criteria:** A reviewer can select a preferred band, explain why, and
replay the same comparison after a rule change without overwriting old evidence.
The workbench can inspect “Why not this musician?” reason codes and record when
the deterministic explanation disagrees with human judgment.

**Testing:** Ties, contradictory human judgments, policy revisions, incomplete
data, and export/import replay.

**Dependencies:** Sprint 5.

**V1 Impact:** None; V1 observations supply examples.

### Sprint 7 — Single-week candidate generation

**Status:** NOT STARTED

**Goal:** Generate and rank valid complete bands for one service date.

**Why:** Complete-band comparison avoids V1's incremental-assignment blind spots
and provides a bounded proving ground before global optimization.

**Scope:** Apply hard eligibility constraints; enumerate or intelligently search
complete candidates; score them with Sprint 5; return ranked, deduplicated
alternatives and rejection diagnostics.

**Out of Scope:** Multi-week allocation, polished end-user workflow, and writes.

**Technical Work:** Candidate search with deterministic tie-breaking and limits;
constraint reason codes; performance instrumentation; exhaustive oracle for small
fixtures.

**Acceptance Criteria:** Top candidates are complete, valid, reproducible, and
match exhaustive results on small scenarios; limits and truncation are disclosed.

**Testing:** Scarce roles, required pairs, dual-role musicians, blocks, existing
assignments, locks, exclusions, no feasible band, and large-roster performance.

**Dependencies:** Sprints 5–6.

**V1 Impact:** None.

### Sprint 8 — Single-week Build My Band workflow

**Status:** NOT STARTED

**Goal:** Make single-week V2 recommendations usable and reviewable.

**Why:** Real interaction reveals scoring and workflow problems before global
optimization increases complexity.

**Scope:** Suggest Band; recommended lineup; score, strengths, warnings, and
alternatives; accept/edit/try another; locks and exclusions; draft persistence.

**Out of Scope:** Multi-week optimization and Planning Center writes.

**Technical Work:** `/v2` UI, accessible comparison treatments, V2 draft schema,
rerun inputs, and audit history.

**Acceptance Criteria:** An owner can build, inspect, alter, save, and restore a
single-week draft without affecting a V1 draft or Planning Center.

**Testing:** Mobile/desktop UI, stale inputs, reloads, lock conflicts, no feasible
result, and V1 isolation.

**Dependencies:** Sprint 7.

**V1 Impact:** None.

### Sprint 9 — Global optimizer bake-off

**Status:** NOT STARTED

**Goal:** Select the multi-week optimization technique using measured evidence.

**Why:** The primary V2 goal requires global allocation, but the best solver also
depends on deployment, runtime, explainability, and operational cost.

**Scope:** Specify Boolean assignment variables and lexicographic objectives;
genuinely prototype OR-Tools CP-SAT and a bounded TypeScript/beam search against
identical fixtures, with exhaustive enumeration as the correctness oracle for
tiny cases; benchmark solution quality, correctness, proof/status, runtime,
future constraint flexibility, and deployment complexity; record the decision.

**Out of Scope:** Production UI and Planning Center writes.

**Technical Work:** Maximize minimum weekly viability first, then reduce quality
variance, then improve rotation/preferences and minimize disruption. Include an
exhaustive oracle for tiny problems and realistic timeout behavior.

**Acceptance Criteria:** An architecture decision record names the selected
solver, deployment boundary, time limits, solver statuses, and fallback behavior,
supported by reproducible benchmarks.

**Testing:** Greedy counterexamples, scarce A musicians, uneven availability,
pair constraints, infeasible windows, timeout results, and deterministic replay.

**Dependencies:** Sprints 1–8 and sufficient calibration evidence.

**V1 Impact:** None.

### Sprint 10 — Multi-week optimization

**Status:** NOT STARTED

**Goal:** Produce the best complete allocation across a requested date range.

**Why:** Running the single-week generator repeatedly cannot distribute strength
and opportunity globally.

**Scope:** Implement the chosen solver; hard coverage and eligibility; maximize
the weakest week; balance strong-musician distribution; support developing
musicians; rotation, frequency, consecutive-week, availability, locks, and
minimal-change objectives; structured selection, rejection, alternative, and
cross-week opportunity-cost explanations.

**Out of Scope:** Polished workspace, AI control, and external writes.

**Technical Work:** Production solver boundary, snapshot/result persistence,
lexicographic solve passes or proven-safe priorities, timeouts, feasible/optimal/
infeasible status, objective breakdowns, and audit metadata.

**Acceptance Criteria:** The system considers the entire range simultaneously,
beats documented V1 greedy counterexamples, respects hard constraints, and never
labels an unproven result optimal. It can deterministically explain why an
eligible musician was not selected when another placement raised the weakest-week
score.

**Testing:** All optimizer scenario fixtures, property tests for hard constraints,
performance budgets, failure recovery, and policy-version replay.

**Dependencies:** Sprint 9.

**V1 Impact:** None.

### Sprint 11 — Multi-week scheduling workspace

**Status:** NOT STARTED

**Goal:** Make global optimization understandable and controllable.

**Why:** Users need to guide the optimizer without losing visibility into its
tradeoffs.

**Scope:** Build Next N Weeks; per-week and whole-window scores; alternatives;
lock week/person/role; exclude; swap; regenerate unlocked scope; compare changes;
undo; and ask why a person was or was not selected on a date.

**Out of Scope:** Planning Center writes and natural-language control.

**Technical Work:** Workspace state, optimistic concurrency, change diffing,
manual-override audit records, and solver rerun orchestration.

**Acceptance Criteria:** Locks survive reruns; only approved scope changes; users
can explain why an alternative won; original and previous results are recoverable.

**Testing:** Conflicting locks, partial reruns, concurrent/stale drafts, timeout,
infeasibility explanations, undo, and responsive UI.

**Dependencies:** Sprint 10.

**V1 Impact:** None.

### Sprint 12 — Availability-message import

**Status:** NOT STARTED

**Goal:** Convert pasted messages into reviewed availability facts.

**Why:** Availability collection is valuable, but uncertain language must not
silently become a hard scheduling fact.

**Scope:** Paste text; OpenAI structured extraction of available/unavailable/maybe/
unknown dates; source text and uncertainty preservation; mandatory human review;
save locally.

**Out of Scope:** Rich frequency/role constraints and Planning Center writes.

**Technical Work:** Strict schema output, date-context handling, prompt/version
audit, privacy/retention controls, deterministic validation, and review UI. Retain
confirmed structured facts and only the minimum useful source excerpt by default;
do not indefinitely preserve unrelated conversation.

**Acceptance Criteria:** Nothing is saved without confirmation; ambiguous dates
remain flagged; parser output never directly invokes scheduling or external writes.

**Testing:** Relative dates, ranges, negation, corrections, year boundaries,
ambiguous wording, malformed output, and unavailable OpenAI service.

**Dependencies:** Sprints 1–2.

**V1 Impact:** None unless separately requested as a V1 feature.

### Sprint 13 — Rich scheduling constraints from messages

**Status:** NOT STARTED

**Goal:** Extract temporary, role-specific, and frequency constraints through a
reviewed workflow.

**Why:** Real replies express more than binary availability.

**Scope:** Role-specific dates, “either but not both,” temporary frequency caps,
preferences, maybe/unknown, notes, expiration, and conflict presentation.

**Out of Scope:** Free-form autonomous scheduling and external writes.

**Technical Work:** Constraint schema and validator, contradiction detection,
human-editable review, provenance, expiry, and optimizer adapter.

**Acceptance Criteria:** Every accepted constraint is structured, attributable,
editable, scoped in time, and explainable to the solver.

**Testing:** Cross-sentence dependencies, multiple people, conflicting statements,
role aliases, expired constraints, and edits after parsing.

**Dependencies:** Sprint 12 and optimizer domain model.

**V1 Impact:** None.

### Sprint 14 — Reviewed Planning Center blockout write-back

**Status:** NOT STARTED

**Goal:** Safely convert confirmed unavailability into Planning Center blockouts.

**Why:** Reducing duplicate entry is valuable only if retries and conflicts cannot
create incorrect or duplicate data.

**Scope:** Preview, explicit confirmation, local transaction record, blockout
creation, idempotency, retry, conflict detection, sync status, and audit trail.

**Out of Scope:** Schedule publishing and AI-triggered writes.

**Technical Work:** Narrow Edge Function allowlist expansion, idempotency keys,
write ledger/state machine, reconciliation, and recoverable failure UI.

**Acceptance Criteria:** Repeating a request cannot duplicate a blockout; every
write has an actor and reviewed source; failures are retryable; OpenAI cannot call
the write path.

**Testing:** Duplicate submission, timeout after remote success, changed remote
data, revoked authorization, partial failure, and audit replay.

**Dependencies:** Sprints 2, 12, and 13.

**V1 Impact:** Shared proxy changes require independent V1 regression and security
review; V1 UI remains unchanged.

### Sprint 15 — Reviewed schedule publishing

**Status:** NOT STARTED

**Goal:** Publish an approved V2 schedule through an exact, reviewed change set.

**Why:** External writes are the highest-risk boundary and must be deliberate,
minimal, and auditable.

**Scope:** Planning Center diff preview; additions/updates/removals supported by
the API; explicit confirmation; notifications off by default; idempotency,
reconciliation, conflicts, and audit history.

**Out of Scope:** Automatic acceptance, automatic notification, and AI writes.

**Technical Work:** Versioned publish plan, capability-aware API commands, stale
snapshot checks, write ledger, retry/recovery, and post-write verification.

**Acceptance Criteria:** Only displayed and confirmed changes are attempted;
stale plans block safely; repeat submission is safe; remote results reconcile to
the local draft.

**Testing:** No-op publish, additions, supported changes/removals, stale remote
state, partial success, retry, permissions, and notification safeguards.

**Dependencies:** Sprints 2 and 11 and the write-safety pattern from Sprint 14.

**V1 Impact:** Shared proxy changes only; no automatic migration of V1 drafts.

### Sprint 16 — Replacement workflow

**Status:** NOT STARTED

**Goal:** Resolve a cancellation with the smallest high-quality reviewed change.

**Why:** Replacement is a common real-world workflow and requires evaluating the
remaining band, not merely finding an available person in the same role.

**Scope:** Identify assignment and role; rank replacements by resulting balance,
availability, and disruption; preview blockout plus assignment changes; reviewed
transaction and rerun options.

**Out of Scope:** Autonomous communication or automatic replacement.

**Technical Work:** Minimal-change optimization objective, current-state refresh,
ranked explanations, combined local transaction, and coordinated write preview.

**Acceptance Criteria:** Existing confirmed assignments remain stable unless
explicitly unlocked; candidates include resulting band scores and rejection
reasons; no remote mutation occurs before confirmation.

**Testing:** No replacement, required pairs, role-specific tiers, simultaneous
cancellations, stale Planning Center state, and partial write recovery.

**Dependencies:** Sprints 10–11 and 14–15.

**V1 Impact:** None.

### Sprint 17 — Natural-language scheduling assistant

**Status:** NOT STARTED

**Goal:** Let users query and prepare actions in natural language while keeping
the deterministic engine authoritative.

**Why:** Conversation can reduce workflow friction after rules, explanations, and
reviewed actions are trustworthy.

**Scope:** Interpret requests such as building a month, locking a musician,
explaining exclusions, strengthening a date, or preparing a replacement; show
the structured proposed action and require review.

**Out of Scope:** AI-authored scores, hidden rule changes, autonomous publishing,
or direct Planning Center access.

**Technical Work:** Limited action schema, read/query tools, authorization,
confirmation boundaries, prompt/version audit, deterministic execution, and safe
failure behavior.

**Acceptance Criteria:** Every mutation is represented as a visible deterministic
command before execution; unsupported requests fail clearly; AI cannot bypass
locks, constraints, authorization, or publishing confirmation.

**Testing:** Ambiguity, prompt injection in imported content, unauthorized actions,
stale drafts, multi-step requests, cancellation, and provider outage.

**Dependencies:** Stable completion and real use of Sprints 11, 15, and 16.

**V1 Impact:** None.

## Roadmap operating rules

- Approve a sprint before implementation begins.
- At sprint start, mark only that sprint `IN PROGRESS`.
- A sprint becomes `READY FOR REVIEW` only when its acceptance criteria and tests
  pass and its docs are current.
- Mark it `COMPLETE` after review; update this roadmap before starting the next.
- A newly discovered rule first becomes a learning or explicit roadmap change.
  It does not silently alter an in-progress sprint.
- V1 production fixes may interrupt V2 work. Keep their commits and releases
  separate.
- Do not expose private talent ratings in Planning Center, musician-facing UI,
  logs, AI prompts beyond the approved need, or client payloads unnecessarily.
- Do not let AI initiate external writes. Planning Center changes always require
  a deterministic preview and explicit human confirmation.
