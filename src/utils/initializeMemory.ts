export function initializeMemory(): void {
  if (!!Memory.initialized) {
    return;
  } else {
    Memory.initialized = true;
    Memory.generatePixels = true;
    Memory.wasteCollection = 0;
    Memory.explorationCandidates = {
      rooms: [],
      index: 0
    };
    Memory.structurePlanning = {
      roads: {}
    };
  }
}
