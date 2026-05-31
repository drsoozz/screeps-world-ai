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
  [RoleType.Charter]: 0
};

const _roleDist: Partial<Record<ControllerLevel, RoleCounts>> = {
  0: _defaultRoleDist,
  1: {
    [RoleType.Harvester]: -1, // rewriten by getRoleDist
    [RoleType.Upgrader]: 2,
    [RoleType.Constructor]: 0,
    [RoleType.Repairer]: 0,
    [RoleType.Charter]: 0
  },
  2: {
    [RoleType.Harvester]: -1,
    [RoleType.Upgrader]: 2,
    [RoleType.Constructor]: 2,
    [RoleType.Repairer]: 1,
    [RoleType.Charter]: 1
  },
  3: {
    [RoleType.Harvester]: -1,
    [RoleType.Upgrader]: 2,
    [RoleType.Constructor]: 2,
    [RoleType.Repairer]: 1,
    [RoleType.Charter]: 1
  }
};

export function getRoleDist(room: Room, cLevel?: number): RoleCounts {
  if (cLevel === undefined) {
    cLevel = room.controller?.level;
  }
  if (!isControllerLevel(cLevel)) {
    return _defaultRoleDist;
  }

  const numSafeSources = findSafeSources(room).length;
  const base = _roleDist[cLevel];
  if (!base) {
    return _defaultRoleDist;
  }
  const result: RoleCounts = { ...base };

  result[RoleType.Harvester] = numSafeSources * HARVESTERS_PER_SOURCE[cLevel];
  return result;
}
