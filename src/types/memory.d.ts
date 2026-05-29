import { RoleType } from "creeps/roleType";
import { ControllerLevel } from "./isValidControllerLevel";

export {};

declare global {
  interface Memory {
    initialized: boolean;
    generatePixels: boolean;
    wasteCollection: number;
  }

  interface CreepMemory {
    role: RoleType;
    task: string | undefined;
    homeRoom: Room["name"];
    controllerLevelAtBirth: ControllerLevel;
    numRenews: number
  }
}
