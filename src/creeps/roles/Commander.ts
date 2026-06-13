import { COMMANDER_TROOPS_WANTED } from "consts";
import { RoleBase } from "creeps/roleBase";
import { TaskType } from "creeps/taskType";
import { ControllerLevel } from "types/ControllerLevel";
import { getNumBlockedSquares } from "utils/getNumBlockedSquares";
import { spiralPath } from "utils/spiralPath";

export class Commander extends RoleBase {
  constructor(creep: Creep) {
    super(creep);
  }
  _findTask(): void {
    switch (this.memory.task) {
      case TaskType.Rally: {
        const numSoldiers = this.taskActions.getAllNearbySoldiers().length;
        if (numSoldiers >= COMMANDER_TROOPS_WANTED[(this.creep.room?.controller?.level ?? 0) as ControllerLevel]) {
          this.memory.task = TaskType.Command;
        }
        break;
      }
      case TaskType.Command: {
        this.memory.task = TaskType.Command; // has to be changed by other means
        break;
      }
      default: {
        this.memory.task = TaskType.Rally;
        break;
      }
    }
  }
  _doTask(): void {
    switch (this.memory.task) {
      default:
      case TaskType.Rally: {
        const _pos = spiralPath(this.creep.pos);
        let pos: RoomPosition | void;
        while (true) {
          pos = _pos.next().value;
          if (!pos) {
            return;
          }
          if (
            pos.lookFor(LOOK_STRUCTURES).filter(s => {
              return s.structureType === STRUCTURE_ROAD;
            }).length > 0
          ) {
            continue;
          }
          if (this.creep.room.find(FIND_MY_SPAWNS)[0].pos.getRangeTo(pos) < 7) {
            continue;
          }
          const numBlockedSquares = getNumBlockedSquares(pos);
          if (numBlockedSquares == undefined || numBlockedSquares > 0) {
            continue;
          } else {
            break;
          }
        }
        this.taskActions.executeNormalMoveTo(pos, "#63c07a", 0);
        break;
      }
      case TaskType.Command: {
        // currently just uses TaskActions.command()
        break;
      }
    }
  }
}
