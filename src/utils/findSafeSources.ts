export function findSafeSources(room: Room): Source[] {
  const sources = room.find(FIND_SOURCES);
  const safeSources = sources.filter(source => {
    const hostilesCreeps = source.pos.findInRange(FIND_HOSTILE_CREEPS, 5);
    const hostileStructures = source.pos.findInRange(FIND_HOSTILE_STRUCTURES, 5);
    const alliesNearby = source.pos.findInRange(FIND_MY_CREEPS, 5);
    return hostilesCreeps.length + hostileStructures.length === 0 || hostilesCreeps.length <= alliesNearby.length;
  });
  return safeSources;
}
