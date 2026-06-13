export const RoleType = {
  Harvester: "HARVESTER",
  Upgrader: "UPGRADER",
  Constructor: "CONSTRUCTOR",
  Repairer: "REPAIRER",
  Charter: "CHARTER",
  Commander: "COMMANDER",
  Soldier: "SOLDIER"
} as const;

export type RoleType = (typeof RoleType)[keyof typeof RoleType];
