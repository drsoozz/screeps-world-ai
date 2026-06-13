export const MilitaryType = {
  RAID: "RAID",
  DEFENSE: "DEFENSE"
} as const;

export type MilitaryType = (typeof MilitaryType)[keyof typeof MilitaryType];
