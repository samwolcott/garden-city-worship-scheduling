import { isEligibleForScheduling, requiredGroupFor, type RequiredPairRule, type SkillLevel } from './eligibility';

export interface Candidate {
	id: string;
	name: string;
	active: boolean;
	skill_level: SkillLevel | null;
	positionIds: string[];
	blockedDates: string[];
	preferencesByPosition?: Record<string, string>;
	scheduleEverySunday?: boolean;
}

export interface Slot { positionId: string; positionName: string; }
export interface SuggestedAssignment extends Slot { personId: string; personName: string; tier: SkillLevel; reasons: string[]; }
export interface UnfilledSlot extends Slot { reasons: string[]; }
export interface WeekSuggestion { date: string; assignments: SuggestedAssignment[]; unfilled: UnfilledSlot[]; }
export interface ExistingAssignment { personId: string; tier: SkillLevel | null; positionId?: string; countsTowardHistory?: boolean; }

export const preferenceGap = (preference = '') => {
	const value = preference.toLowerCase();
	const weekCount = value.match(/every\s+(\d+)(?:st|nd|rd|th)?\s+weeks?/);
	if (weekCount) return Number(weekCount[1]) * 7;
	if (value.includes('other') || value.includes('2 week') || value.includes('two week') || value.includes('twice') && value.includes('month')) return 14;
	if (value.includes('quarter')) return 91;
	if (value.includes('three times') && value.includes('month')) return 9;
	const monthCount = value.match(/every\s+(\d+)\s+months?/);
	if (monthCount) return Number(monthCount[1]) * 28;
	if (value.includes('month')) return 28;
	if (value.includes('week')) return 7;
	return 0;
};

const isWorshipLeader = (positionName: string) => positionName.toLowerCase().includes('worship leader');
const positionPreference = (person: Candidate, positionId: string) => person.preferencesByPosition?.[positionId] ?? '';
const previousAssignment = (assignedDates: string[], date: string) => assignedDates.filter((assignedDate) => assignedDate < date).sort().at(-1);

export function suggestWeeks(dates: string[], slotsByDate: Map<string, Slot[]>, candidates: Candidate[], pairRules: RequiredPairRule[], existingByDate = new Map<string, ExistingAssignment[]>(), initialHistory = new Map<string, string[]>(), monthlyCap = 2): WeekSuggestion[] {
	const eligible = new Map(candidates.filter((person) => isEligibleForScheduling(person)).map((person) => [person.id, person]));
	const history = new Map([...initialHistory].map(([personId, assignedDates]) => [personId, [...assignedDates].sort()]));
	const positionUseCounts = new Map<string, number>();
	const results: WeekSuggestion[] = [];
	for (const date of [...dates].sort()) {
		const open = [...(slotsByDate.get(date) ?? [])];
		const assignments: SuggestedAssignment[] = [];
		let unfilled: UnfilledSlot[] = [];
		const existing = existingByDate.get(date) ?? [];
		const scheduled = new Set(existing.map((assignment) => assignment.personId));
		const tierCounts = new Map<SkillLevel, number>([['A', 0], ['B', 0], ['C', 0]]);
		const countedExisting = new Set<string>();
		for (const assignment of existing) {
			if (assignment.countsTowardHistory === false) continue;
			if (assignment.positionId) { const key = `${assignment.personId}:${assignment.positionId}`; positionUseCounts.set(key, (positionUseCounts.get(key) ?? 0) + 1); }
			if (countedExisting.has(assignment.personId)) continue;
			countedExisting.add(assignment.personId);
			history.set(assignment.personId, [...(history.get(assignment.personId) ?? []), date]);
			if (assignment.tier) tierCounts.set(assignment.tier, (tierCounts.get(assignment.tier) ?? 0) + 1);
		}
		while (open.length) {
			let best: { people: Candidate[]; placements: { person: Candidate; slotIndex: number }[]; score: number } | undefined;
			for (const person of eligible.values()) {
				if (scheduled.has(person.id) || person.blockedDates.includes(date)) continue;
				const groupIds = [...requiredGroupFor(person.id, pairRules)].filter((id) => !scheduled.has(id));
				const group = groupIds.map((id) => eligible.get(id));
				if (group.some((member) => !member || member.blockedDates.includes(date) || scheduled.has(member.id))) continue;
				if ((group as Candidate[]).some((member) => !member.scheduleEverySunday && (history.get(member.id) ?? []).some((assignedDate) => Math.abs(Date.parse(date) - Date.parse(assignedDate)) / 86400000 < 14))) continue;
				if ((group as Candidate[]).some((member) => !member.scheduleEverySunday && new Set((history.get(member.id) ?? []).filter((assignedDate) => assignedDate.slice(0, 7) === date.slice(0, 7))).size >= monthlyCap)) continue;
				const placements: { person: Candidate; slotIndex: number }[] = [];
				for (const member of group as Candidate[]) {
					const weeklyLeaderIndex = member.scheduleEverySunday ? open.findIndex((slot, i) => !placements.some((placement) => placement.slotIndex === i) && member.positionIds.includes(slot.positionId) && isWorshipLeader(slot.positionName)) : -1;
					const index = weeklyLeaderIndex >= 0 ? weeklyLeaderIndex : open.findIndex((slot, i) => !placements.some((placement) => placement.slotIndex === i) && member.positionIds.includes(slot.positionId));
					if (index < 0) { placements.length = 0; break; }
					placements.push({ person: member, slotIndex: index });
					const firstSlot = open[index];
					const secondIndex = open.map((slot, i) => ({ slot, i })).filter(({ slot, i }) => !placements.some((placement) => placement.slotIndex === i) && member.positionIds.includes(slot.positionId) && isWorshipLeader(slot.positionName) !== isWorshipLeader(firstSlot.positionName)).sort((a, b) => (positionUseCounts.get(`${member.id}:${a.slot.positionId}`) ?? 0) - (positionUseCounts.get(`${member.id}:${b.slot.positionId}`) ?? 0))[0]?.i ?? -1;
					if (secondIndex >= 0) placements.push({ person: member, slotIndex: secondIndex });
				}
				if (!placements.length) continue;
				if (placements.some(({ person: member, slotIndex }) => { const preference = positionPreference(member, open[slotIndex].positionId); if (preference.toLowerCase() === 'unavailable') return true; const gap = preferenceGap(preference); return gap > 0 && (history.get(member.id) ?? []).some((assignedDate) => Math.abs(Date.parse(date) - Date.parse(assignedDate)) / 86400000 < gap); })) continue;
				const score = (group as Candidate[]).reduce((total, member) => {
					const prior = history.get(member.id) ?? [];
					const last = previousAssignment(prior, date);
					const gapDays = last ? (Date.parse(date) - Date.parse(last)) / 86400000 : Infinity;
					const fillsWorshipLeader = placements.some((placement) => placement.person.id === member.id && isWorshipLeader(open[placement.slotIndex].positionName));
					return total + prior.length * 100 + (gapDays < 7 ? 1000 : 0) + (tierCounts.get(member.skill_level!) ?? 0) * 12 - (member.scheduleEverySunday && fillsWorshipLeader ? 100000 : 0);
				}, 0);
				if (!best || score < best.score) best = { people: group as Candidate[], placements, score };
			}
			if (!best) {
				unfilled = open.map((slot) => {
					const qualified = [...eligible.values()].filter((candidate) => candidate.positionIds.includes(slot.positionId));
					if (!qualified.length) return { ...slot, reasons: ['No active musician with a Band tier is assigned to this Planning Center position.'] };
					const categories = new Map<string, string[]>(); const add = (reason: string, name: string) => categories.set(reason, [...(categories.get(reason) ?? []), name]);
					for (const candidate of qualified) {
						const assignedDates = history.get(candidate.id) ?? []; const preference = positionPreference(candidate, slot.positionId); const gap = preferenceGap(preference);
						if (scheduled.has(candidate.id)) add('Already present on this Planning Center plan', candidate.name);
						else if (candidate.blockedDates.includes(date)) add('Planning Center blockout', candidate.name);
						else if (preference.toLowerCase() === 'unavailable') add(`Planning Center ${slot.positionName} preference is Unavailable`, candidate.name);
						else if (gap > 0 && assignedDates.some((assignedDate) => Math.abs(Date.parse(date) - Date.parse(assignedDate)) / 86400000 < gap)) add(`Planning Center cadence (${preference})`, candidate.name);
						else if (!candidate.scheduleEverySunday && assignedDates.some((assignedDate) => Math.abs(Date.parse(date) - Date.parse(assignedDate)) / 86400000 < 14)) add('Would create back-to-back Sundays', candidate.name);
						else if (!candidate.scheduleEverySunday && new Set(assignedDates.filter((assignedDate) => assignedDate.slice(0, 7) === date.slice(0, 7))).size >= monthlyCap) add(`Reached the ${monthlyCap}-Sunday monthly maximum`, candidate.name);
						else if ([...requiredGroupFor(candidate.id, pairRules)].some((partnerId) => partnerId !== candidate.id && !scheduled.has(partnerId))) add('Required scheduling partner could not also be placed', candidate.name);
						else add('Could not fit alongside the remaining position and pairing requirements', candidate.name);
					}
					return { ...slot, reasons: [...categories].map(([reason, names]) => `${reason}: ${names.join(', ')}`) };
				});
				break;
			}
			for (const { person, slotIndex } of best.placements) {
				const slot = open[slotIndex];
				const positionKey = `${person.id}:${slot.positionId}`;
				const prior = history.get(person.id) ?? [];
				const last = previousAssignment(prior, date);
				const gapDays = last ? Math.round((Date.parse(date) - Date.parse(last)) / 86400000) : undefined;
				const reasons = [`Assigned to ${slot.positionName} in Planning Center`, 'No Planning Center blockout on this date'];
				if (person.scheduleEverySunday && isWorshipLeader(slot.positionName)) reasons.push('Marked Every Sunday for Worship Leader');
				const preference = positionPreference(person, slot.positionId); const preferredGap = preferenceGap(preference);
				if (preference) reasons.push(`Planning Center ${slot.positionName} preference: ${preference}${preferredGap ? ` (${preferredGap}-day minimum)` : ''}`);
				else reasons.push('No Planning Center serving-frequency preference set');
				if (last) reasons.push(`Previous assignment considered: ${last}${gapDays !== undefined ? ` (${gapDays} days earlier)` : ''}`); else reasons.push('No earlier assignment found in the lookback period');
				if (!person.scheduleEverySunday) reasons.push(`${new Set(prior.filter((assignedDate) => assignedDate.slice(0, 7) === date.slice(0, 7))).size} of ${monthlyCap} allowed Sundays already used that month`);
				const lowestTierCount = Math.min(...tierCounts.values());
				if ((tierCounts.get(person.skill_level!) ?? 0) === lowestTierCount) reasons.push(`Tier ${person.skill_level} supported the week’s tier balance`);
				if (prior.length === 0) reasons.push('Had no other assignment in the scheduling history'); else reasons.push(`${new Set(prior).size} other assignment date${new Set(prior).size === 1 ? '' : 's'} considered for rotation fairness`);
				if (best.people.length > 1) reasons.push('Placed with a required scheduling partner');
				if (best.placements.filter((placement) => placement.person.id === person.id).length > 1) reasons.push('Also covers Worship Leader or a secondary instrument; the least-used eligible secondary role was favored');
				assignments.push({ ...slot, personId: person.id, personName: person.name, tier: person.skill_level!, reasons });
				positionUseCounts.set(positionKey, (positionUseCounts.get(positionKey) ?? 0) + 1);
			}
			for (const person of best.people) {
				scheduled.add(person.id);
				history.set(person.id, [...(history.get(person.id) ?? []), date]);
				tierCounts.set(person.skill_level!, (tierCounts.get(person.skill_level!) ?? 0) + 1);
			}
			best.placements.map((placement) => placement.slotIndex).sort((a, b) => b - a).forEach((index) => open.splice(index, 1));
		}
		results.push({ date, assignments, unfilled });
	}
	return results;
}
