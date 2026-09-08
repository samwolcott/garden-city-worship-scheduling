export type SkillLevel = 'A' | 'B' | 'C';

export interface MemberSchedulingSettings {
	active: boolean;
	skill_level: SkillLevel | null;
}

/** This is the first gate for every generated schedule. */
export function isEligibleForScheduling(settings: MemberSchedulingSettings | undefined): boolean {
	return settings?.active === true && settings.skill_level !== null;
}
