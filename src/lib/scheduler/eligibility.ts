export type SkillLevel = 'A' | 'B' | 'C';

export interface MemberSchedulingSettings {
	active: boolean;
	skill_level: SkillLevel | null;
}

export interface RequiredPairRule {
	person_one_id: string;
	person_two_id: string;
}

/** This is the first gate for every generated schedule. */
export function isEligibleForScheduling(settings: MemberSchedulingSettings | undefined): boolean {
	return settings?.active === true && settings.skill_level !== null;
}

/** Returns the full group that must accompany a musician, including chained pairs. */
export function requiredGroupFor(personId: string, rules: RequiredPairRule[]): Set<string> {
	const group = new Set([personId]);
	let changed = true;
	while (changed) {
		changed = false;
		for (const pair of rules) {
			if (group.has(pair.person_one_id) && !group.has(pair.person_two_id)) {
				group.add(pair.person_two_id);
				changed = true;
			}
			if (group.has(pair.person_two_id) && !group.has(pair.person_one_id)) {
				group.add(pair.person_one_id);
				changed = true;
			}
		}
	}
	return group;
}

export function missingRequiredPartners(scheduledPersonIds: Iterable<string>, rules: RequiredPairRule[]): string[] {
	const scheduled = new Set(scheduledPersonIds);
	const missing = new Set<string>();
	for (const personId of scheduled) {
		for (const requiredId of requiredGroupFor(personId, rules)) {
			if (!scheduled.has(requiredId)) missing.add(requiredId);
		}
	}
	return [...missing];
}
