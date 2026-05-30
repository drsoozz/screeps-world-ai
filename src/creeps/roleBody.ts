import { ControllerLevel } from "types/isValidControllerLevel";
import { RoleType } from "./roleType";

export type ScreepBodyPart = (typeof BODYPARTS_ALL)[number];
export type ScreepBody = ScreepBodyPart[];
export type RoleBodies = Record<
  RoleType,
  {
    setBody: ScreepBody;
    fillBody?: ScreepBodyPart | ScreepBody;
  }
>;

export const RoleBody: Partial<Record<ControllerLevel, RoleBodies>> = {
  1: {
    [RoleType.Harvester]: {
      setBody: [CARRY, MOVE, WORK, WORK],
      fillBody: WORK
    },
    [RoleType.Upgrader]: {
      setBody: [CARRY, MOVE, WORK],
      fillBody: undefined
    },
    [RoleType.Constructor]: {
      setBody: [CARRY, MOVE, WORK],
      fillBody: WORK
    },
    [RoleType.Repairer]: {
      setBody: [CARRY, MOVE, WORK],
      fillBody: undefined
    },
    [RoleType.Charter]: {
      setBody: [MOVE, MOVE, MOVE, MOVE, MOVE],
      fillBody: undefined
    }
  },
  2: {
    [RoleType.Harvester]: {
      setBody: [CARRY, CARRY, MOVE, MOVE, WORK],
      fillBody: WORK
    },
    [RoleType.Upgrader]: {
      setBody: [CARRY, CARRY, MOVE, WORK],
      fillBody: WORK
    },
    [RoleType.Constructor]: {
      setBody: [CARRY, CARRY, MOVE, MOVE, WORK],
      fillBody: WORK
    },
    [RoleType.Repairer]: {
      setBody: [CARRY, CARRY, CARRY, MOVE, MOVE, WORK, WORK],
      fillBody: undefined
    },
    [RoleType.Charter]: {
      setBody: [MOVE, MOVE, MOVE, MOVE, MOVE],
      fillBody: undefined
    }
  },
  3: {
    [RoleType.Harvester]: {
      setBody: [CARRY, CARRY, MOVE, MOVE, WORK],
      fillBody: WORK
    },
    [RoleType.Upgrader]: {
      setBody: [WORK, WORK, CARRY, CARRY, CARRY, MOVE, WORK],
      fillBody: WORK
    },
    [RoleType.Constructor]: {
      setBody: [CARRY, CARRY, CARRY, MOVE, WORK, WORK],
      fillBody: WORK
    },
    [RoleType.Repairer]: {
      setBody: [CARRY, CARRY, CARRY, MOVE, WORK, WORK],
      fillBody: CARRY
    },
    [RoleType.Charter]: {
      setBody: [MOVE, MOVE, MOVE, MOVE, MOVE],
      fillBody: undefined
    }
  }
};

export function isScreepBodyPart(value: any): value is ScreepBodyPart {
  return BODYPARTS_ALL.includes(value);
}

export function isScreepBody(value: any): value is ScreepBody {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(p => isScreepBodyPart(p));
}
