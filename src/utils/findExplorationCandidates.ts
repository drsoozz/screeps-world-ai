import { DEFAULT_EXPLORATION_RANGE } from "consts";

export function findExplorationCandidates(room: Room, range: number = DEFAULT_EXPLORATION_RANGE): Room["name"][] {
  let candidates = new Set<Room["name"]>();
  let stack = [room.name];
  let searched = new Set<Room["name"]>();
  let wantedRoomStatus = Game.map.getRoomStatus(room.name).status;
  for (let i = 0; i < range; i++) {
    let loop_candidates = new Set<Room["name"]>();
    while (stack.length > 0) {
      let targetRoom = stack.pop();
      if (!targetRoom) {
        continue;
      }
      if (searched.has(targetRoom)) {
        continue;
      } else {
        searched.add(targetRoom);
      }
      // find all rooms conneted to this current room that are not in `searched` and are not owned by anyone
      let exits = Object.values(Game.map.describeExits(targetRoom) ?? {})
        .filter(r => {
          return !searched.has(r) && Game.map.getRoomStatus(r).status === wantedRoomStatus;
        })
        .filter(r => {
          /**
           * this is the biggest CPU expense in this code.
           * i opted against using Game.map.findRoute()
           * because walls could potentialy cause findRoute
           * to be incorrect.
           * other parts of the code have absolute reliance
           * that all rooms hat this function returns are reachable
           * from the given room parameter.
           */
          return !PathFinder.search(
            new RoomPosition(25, 25, room.name),
            { pos: new RoomPosition(25, 25, r), range: 23 },
            {
              swampCost: 1,
              plainCost: 1
            }
          ).incomplete;
        })
        .filter(r => {
          const roomData = Memory.roomData[r];
          if (!roomData) {
            return true;
          } else if (roomData.controllerLevel === 0) {
            return true;
          } else {
            searched.add(r);
            return false;
          }
        });
      exits.forEach(r => {
        loop_candidates.add(r);
        candidates.add(r);
      });
    }
    stack.push(...loop_candidates);
  }

  return [...candidates];
}
