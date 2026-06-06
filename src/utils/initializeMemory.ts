import { initializeEnvironment } from "./initializeEnvironment";

export function initializeMemory(): void {
  if (!!Memory.initialized) {
    return;
  } else {
    Memory.initialized = true;
    Memory.generatePixels = typeof Game.cpu?.generatePixel === "function" ? true : false;
    Memory.wasteCollection = 0;
    Memory.structurePlanning = {};
    Memory.creepPlanning = {};
    Memory.roomData = {};
    Memory.environment = initializeEnvironment();
  }
}
