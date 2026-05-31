import {
  DehydratedRoomPosition,
  getRehydratedRoomPosition,
  isDehydratedRoomPosition
} from "types/DehydratedRoomPosition";

export function hasStructureOrSite(
  _pos: RoomPosition | DehydratedRoomPosition,
  excludeWalkable: boolean = true
): boolean {
  const pos = isDehydratedRoomPosition(_pos) ? getRehydratedRoomPosition(_pos) : _pos;

  const structures = pos.lookFor(LOOK_STRUCTURES).filter(s => {
    return excludeWalkable
      ? s.structureType !== STRUCTURE_ROAD &&
          s.structureType !== STRUCTURE_RAMPART &&
          s.structureType !== STRUCTURE_CONTAINER
      : true;
  });

  const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);

  return structures.length + sites.length !== 0;
}
