import { DEFAULT_RAIDING_RANGE } from "consts";
import { DehydratedRoomPosition } from "types/DehydratedRoomPosition";
import { EnvironmentType } from "utils/initializeEnvironment";

export function getRaidPos(room: Room, range: number = DEFAULT_RAIDING_RANGE): DehydratedRoomPosition | undefined {
  if (Memory.environment === EnvironmentType.Sim) {
    return undefined;
  }

  let target;
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
        });

      let targets = exits.filter(r => {
        const roomData = Memory.roomData?.[r];
        if (!roomData) {
          return false;
        } else if ((roomData.controllerLevel ?? 0) > (room.controller?.level ?? 0)) {
          return false;
        } else if (roomData.owner === undefined && roomData.reserver === undefined) {
          return false;
        }
        return true;
      });
      if (targets.length > 0) {
        return { x: 25, y: 25, roomName: targets[0] };
      }
      exits.forEach(r => {
        loop_candidates.add(r);
      });
      stack.push(...loop_candidates);
    }
  }
  return undefined;
}
