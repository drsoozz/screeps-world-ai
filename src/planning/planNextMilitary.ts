import { MILITARY_PRIORITY } from "consts";
import { getMilitaryDist } from "creeps/military/militaryDistribution";
import { MilitaryType } from "creeps/roles/MilitaryType";
import { RoleType } from "creeps/roleType";
import { isControllerLevel } from "types/ControllerLevel";

export function planNextMilitary(room: Room): MilitaryType {
  const cLevel = room.controller?.level;
  if (!isControllerLevel(cLevel) || cLevel === 0) {
    return MilitaryType.DEFENSE; // default
  }

  const commandersNeeded = getMilitaryDist(room, cLevel);
  const numCommandersNeeded = { ...commandersNeeded };
  const numCommandersPresent = Object.values(Game.creeps)
    .filter(c => {
      return c.memory.parentRoom === room.name && c.memory.role === RoleType.Commander;
    })
    .map(c => {
      return c.memory.militaryMemory?.military ?? MilitaryType.DEFENSE;
    });
  for (const role of numCommandersPresent) {
    numCommandersNeeded[role]--;
  }

  for (const role of MILITARY_PRIORITY) {
    if (numCommandersNeeded[role] > 0) {
      return role;
    }
  }

  return MilitaryType.DEFENSE;
}
