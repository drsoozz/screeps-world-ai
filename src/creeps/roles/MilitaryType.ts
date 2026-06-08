export const MilitaryType = {
  RAID: "Raid",
  DEFENSE: "Defense"
} as const;

export type MilitaryType = (typeof MilitaryType)[keyof typeof MilitaryType];
