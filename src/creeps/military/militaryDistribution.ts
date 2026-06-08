import { MilitaryType } from "creeps/roles/MilitaryType";
import { ControllerLevel, isControllerLevel } from "types/ControllerLevel";

type MilitaryCounts = Record<MilitaryType, number>;

const _defaultMilitaryDist: MilitaryCounts = {
  [MilitaryType.DEFENSE]: 0,
  [MilitaryType.RAID]: 0
};

const _militaryDist: Partial<Record<ControllerLevel, MilitaryCounts>> = {
  0: _defaultMilitaryDist,
  1: _defaultMilitaryDist,
  2: { [MilitaryType.DEFENSE]: 1, [MilitaryType.RAID]: 0 },
  3: { [MilitaryType.DEFENSE]: 1, [MilitaryType.RAID]: 1 },
  4: { [MilitaryType.DEFENSE]: 1, [MilitaryType.RAID]: 1 },
  5: { [MilitaryType.DEFENSE]: 1, [MilitaryType.RAID]: 1 }
};

export function getMilitaryDist(room: Room, cLevel?: number): MilitaryCounts {
  if (cLevel === undefined) {
    cLevel = room.controller?.level;
  }
  if (!isControllerLevel(cLevel)) {
    return _defaultMilitaryDist;
  }

  const base = _militaryDist[cLevel];
  if (!base) {
    return getMilitaryDist(room, cLevel - 1);
  }
  const result: MilitaryCounts = { ...base };
  return result;
}
