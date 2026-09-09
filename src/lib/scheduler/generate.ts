import { isEligibleForScheduling, requiredGroupFor, type RequiredPairRule, type SkillLevel } from './eligibility';

export interface Candidate {
	id: string;
	name: string;
	active: boolean;
	skill_level: SkillLevel | null;
	positionIds: string[];
	blockedDates: string[];
	preference?: string;
}

export interface Slot { positionId: string; positionName: string; }
export interface SuggestedAssignment extends Slot { personId: string; personName: string; tier: SkillLevel; }
export interface WeekSuggestion { date: string; assignments: SuggestedAssignment[]; unfilled: Slot[]; }
export interface ExistingAssignment { personId: string; tier: SkillLevel | null; }

const preferenceGap = (preference = '') => {
	const value = preference.toLowerCase();
	if (value.includes('month')) return 21;
	if (value.includes('other') || value.includes('2 week') || value.includes('two week')) return 12;
	return 0;
};

export function suggestWeeks(dates: string[], slotsByDate: Map<string, Slot[]>, candidates: Candidate[], pairRules: RequiredPairRule[], existingByDate = new Map<string, ExistingAssignment[]>()): WeekSuggestion[] {
	const eligible = new Map(candidates.filter((person) => isEligibleForScheduling(person)).map((person) => [person.id, person]));
	const history = new Map<string, string[]>();
	const results: WeekSuggestion[] = [];
	for (const date of [...dates].sort()) {
		const open = [...(slotsByDate.get(date) ?? [])];
		const assignments: SuggestedAssignment[] = [];
		const existing = existingByDate.get(date) ?? [];
		const scheduled = new Set(existing.map((assignment) => assignment.personId));
		const tierCounts = new Map<SkillLevel, number>([['A', 0], ['B', 0], ['C', 0]]);
		for (const assignment of existing) {
			history.set(assignment.personId, [...(history.get(assignment.personId) ?? []), date]);
			if (assignment.tier) tierCounts.set(assignment.tier, (tierCounts.get(assignment.tier) ?? 0) + 1);
		}
		while (open.length) {
			let best: { people: Candidate[]; slotIndexes: number[]; score: number } | undefined;
			for (const person of eligible.values()) {
				if (scheduled.has(person.id) || person.blockedDates.includes(date)) continue;
				const groupIds = [...requiredGroupFor(person.id, pairRules)].filter((id) => !scheduled.has(id));
				const group = groupIds.map((id) => eligible.get(id));
				if (group.some((member) => !member || member.blockedDates.includes(date) || scheduled.has(member.id))) continue;
				const slotIndexes: number[] = [];
				for (const member of group as Candidate[]) {
					const index = open.findIndex((slot, i) => !slotIndexes.includes(i) && member.positionIds.includes(slot.positionId));
					if (index < 0) { slotIndexes.length = 0; break; }
					slotIndexes.push(index);
				}
				if (!slotIndexes.length) continue;
				const score = (group as Candidate[]).reduce((total, member) => {
					const prior = history.get(member.id) ?? [];
					const last = prior.at(-1);
					const gapDays = last ? (Date.parse(date) - Date.parse(last)) / 86400000 : Infinity;
					return total + prior.length * 100 + (gapDays < 7 ? 1000 : 0) + (gapDays < preferenceGap(member.preference) ? 500 : 0) + (tierCounts.get(member.skill_level!) ?? 0) * 12;
				}, 0);
				if (!best || score < best.score) best = { people: group as Candidate[], slotIndexes, score };
			}
			if (!best) break;
			const chosenSlots = best.slotIndexes.map((index) => open[index]);
			best.people.forEach((person, index) => {
				const slot = chosenSlots[index];
				assignments.push({ ...slot, personId: person.id, personName: person.name, tier: person.skill_level! });
				scheduled.add(person.id);
				history.set(person.id, [...(history.get(person.id) ?? []), date]);
				tierCounts.set(person.skill_level!, (tierCounts.get(person.skill_level!) ?? 0) + 1);
			});
			best.slotIndexes.sort((a, b) => b - a).forEach((index) => open.splice(index, 1));
		}
		results.push({ date, assignments, unfilled: open });
	}
	return results;
}
