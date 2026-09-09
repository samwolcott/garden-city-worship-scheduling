import { isEligibleForScheduling, requiredGroupFor, type RequiredPairRule, type SkillLevel } from './eligibility';

export interface Candidate {
	id: string;
	name: string;
	active: boolean;
	skill_level: SkillLevel | null;
	positionIds: string[];
	blockedDates: string[];
	preference?: string;
	scheduleEverySunday?: boolean;
}

export interface Slot { positionId: string; positionName: string; }
export interface SuggestedAssignment extends Slot { personId: string; personName: string; tier: SkillLevel; reasons: string[]; }
export interface WeekSuggestion { date: string; assignments: SuggestedAssignment[]; unfilled: Slot[]; }
export interface ExistingAssignment { personId: string; tier: SkillLevel | null; }

const preferenceGap = (preference = '') => {
	const value = preference.toLowerCase();
	if (value.includes('month')) return 21;
	if (value.includes('other') || value.includes('2 week') || value.includes('two week')) return 12;
	return 0;
};

const isWorshipLeader = (positionName: string) => positionName.toLowerCase().includes('worship leader');

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
		const countedExisting = new Set<string>();
		for (const assignment of existing) {
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
				const placements: { person: Candidate; slotIndex: number }[] = [];
				for (const member of group as Candidate[]) {
					const weeklyLeaderIndex = member.scheduleEverySunday ? open.findIndex((slot, i) => !placements.some((placement) => placement.slotIndex === i) && member.positionIds.includes(slot.positionId) && isWorshipLeader(slot.positionName)) : -1;
					const index = weeklyLeaderIndex >= 0 ? weeklyLeaderIndex : open.findIndex((slot, i) => !placements.some((placement) => placement.slotIndex === i) && member.positionIds.includes(slot.positionId));
					if (index < 0) { placements.length = 0; break; }
					placements.push({ person: member, slotIndex: index });
					const firstSlot = open[index];
					const secondIndex = open.findIndex((slot, i) => !placements.some((placement) => placement.slotIndex === i) && member.positionIds.includes(slot.positionId) && isWorshipLeader(slot.positionName) !== isWorshipLeader(firstSlot.positionName));
					if (secondIndex >= 0) placements.push({ person: member, slotIndex: secondIndex });
				}
				if (!placements.length) continue;
				const score = (group as Candidate[]).reduce((total, member) => {
					const prior = history.get(member.id) ?? [];
					const last = prior.at(-1);
					const gapDays = last ? (Date.parse(date) - Date.parse(last)) / 86400000 : Infinity;
					const fillsWorshipLeader = placements.some((placement) => placement.person.id === member.id && isWorshipLeader(open[placement.slotIndex].positionName));
					return total + prior.length * 100 + (gapDays < 7 ? 1000 : 0) + (gapDays < preferenceGap(member.preference) ? 500 : 0) + (tierCounts.get(member.skill_level!) ?? 0) * 12 - (member.scheduleEverySunday && fillsWorshipLeader ? 100000 : 0);
				}, 0);
				if (!best || score < best.score) best = { people: group as Candidate[], placements, score };
			}
			if (!best) break;
			for (const { person, slotIndex } of best.placements) {
				const slot = open[slotIndex];
				const prior = history.get(person.id) ?? [];
				const last = prior.at(-1);
				const gapDays = last ? Math.round((Date.parse(date) - Date.parse(last)) / 86400000) : undefined;
				const reasons = [`Assigned to ${slot.positionName} in Planning Center`, 'No Planning Center blockout on this date'];
				if (person.scheduleEverySunday && isWorshipLeader(slot.positionName)) reasons.push('Marked Every Sunday for Worship Leader');
				if (person.preference) reasons.push(`Planning Center preference: ${person.preference}${gapDays ? `; ${gapDays} days since the prior assignment` : ''}`);
				else reasons.push('No Planning Center cadence preference set');
				const lowestTierCount = Math.min(...tierCounts.values());
				if ((tierCounts.get(person.skill_level!) ?? 0) === lowestTierCount) reasons.push(`Tier ${person.skill_level} supported the week’s tier balance`);
				if (prior.length === 0) reasons.push('Had no earlier assignment in this suggested range'); else reasons.push(`${prior.length} earlier assignment${prior.length === 1 ? '' : 's'} in this suggested range`);
				if (best.people.length > 1) reasons.push('Placed with a required scheduling partner');
				if (best.placements.filter((placement) => placement.person.id === person.id).length > 1) reasons.push('Also covers Worship Leader or a secondary instrument');
				assignments.push({ ...slot, personId: person.id, personName: person.name, tier: person.skill_level!, reasons });
			}
			for (const person of best.people) {
				scheduled.add(person.id);
				history.set(person.id, [...(history.get(person.id) ?? []), date]);
				tierCounts.set(person.skill_level!, (tierCounts.get(person.skill_level!) ?? 0) + 1);
			}
			best.placements.map((placement) => placement.slotIndex).sort((a, b) => b - a).forEach((index) => open.splice(index, 1));
		}
		results.push({ date, assignments, unfilled: open });
	}
	return results;
}
