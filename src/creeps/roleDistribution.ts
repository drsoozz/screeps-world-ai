import { HARVESTERS_PER_SOURCE } from "consts";
import { RoleType } from "creeps/roleType";
import { ControllerLevel, isControllerLevel } from "types/ControllerLevel";
import { findSafeSources } from "utils/findSafeSources";

type RoleCounts = Record<RoleType, number>;

const _defaultRoleDist: RoleCounts = {
  [RoleType.Harvester]: 0,
  [RoleType.Upgrader]: 0,
  [RoleType.Constructor]: 0,
  [RoleType.Repairer]: 0,
  [RoleType.Charter]: 0,
  [RoleType.Commander]: 0,
  [RoleType.Soldier]: 0 // rewritten by getRoleDist
};

const _roleDist: Partial<Record<ControllerLevel, RoleCounts>> = {
  0: _defaultRoleDist,
  1: {
    [RoleType.Harvester]: -1, // rewritten by getRoleDist
    [RoleType.Upgrader]: 2,
    [RoleType.Constructor]: 0,
    [RoleType.Repairer]: 0,
    [RoleType.Charter]: 0,
    [RoleType.Commander]: 0,
    [RoleType.Soldier]: -1 // rewritten by getRoleDist
  },
  2: {
    [RoleType.Harvester]: -1,
    [RoleType.Upgrader]: 2,
    [RoleType.Constructor]: 2,
    [RoleType.Repairer]: 1,
    [RoleType.Charter]: 1,
    [RoleType.Commander]: 0,
    [RoleType.Soldier]: -1 // rewritten by getRoleDist
  },
  3: {
    [RoleType.Harvester]: -1,
    [RoleType.Upgrader]: 2,
    [RoleType.Constructor]: 2,
    [RoleType.Repairer]: 1,
    [RoleType.Charter]: 1,
    [RoleType.Commander]: 1,
    [RoleType.Soldier]: -1 // rewritten by getRoleDist
  },
  4: {
    [RoleType.Harvester]: -1,
    [RoleType.Upgrader]: 2,
    [RoleType.Constructor]: 2,
    [RoleType.Repairer]: 1,
    [RoleType.Charter]: 1,
    [RoleType.Commander]: 1,
    [RoleType.Soldier]: -1 // rewritten by getRoleDist
  }
};

export function getRoleDist(room: Room, cLevel?: number): RoleCounts {
  if (cLevel === undefined) {
    cLevel = room.controller?.level;
  }
  if (!isControllerLevel(cLevel)) {
    return _defaultRoleDist;
  }

  const base = _roleDist[cLevel];
  if (!base) {
    return _defaultRoleDist;
  }
  const result: RoleCounts = { ...base };

  const numSafeSources = findSafeSources(room).length;
  
  result[RoleType.Harvester] = numSafeSources * HARVESTERS_PER_SOURCE[cLevel];
  return result;
}
