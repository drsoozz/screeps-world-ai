export const RoleType = {
  Harvester: "HARVESTER",
  Upgrader: "UPGRADER",
  Constructor: "CONSTRUCTOR",
  Repairer: "REPAIRER",
  Charter: "CHARTER"
} as const;

export type RoleType = (typeof RoleType)[keyof typeof RoleType];
