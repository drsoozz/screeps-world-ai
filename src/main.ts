import { ErrorMapper } from "utils/ErrorMapper";
import { wasteCollection } from "utils/wasteCollection";
import { generatePixels } from "utils/generatePixels";
import { initializeMemory } from "utils/initializeMemory";

declare global {}
// Syntax for adding properties to `global` (ex "global.log")
declare const global: {
  log: any;
};

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  // console.log(`Current game tick is ${Game.time}`);

  // memory initialization
  initializeMemory();

  // waste collection for memory to minimize spent memory
  wasteCollection();

  // create pixels with free CPU bucket
  // can be turned off with `Memory.generatePixels`
  generatePixels();

  for (const name in Game.spawns) {
    const spawn = Game.spawns[name];
  }
});
