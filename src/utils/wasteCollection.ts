export function wasteCollection(): void {
  if (Memory.wasteCollection >= 1000) {
    console.log("Waste collection has begun.");
    for (const name in Memory.creeps) {
      if (!Game.creeps[name]) {
        delete Memory.creeps[name];
        console.log(`  Cleared non-existing creep memory: ${name}`);
      }
    }
    Memory.wasteCollection = 0;
  } else {
    Memory.wasteCollection++;
  }
}
