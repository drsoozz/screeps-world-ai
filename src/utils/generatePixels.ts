export function generatePixels(): void {
  if (Memory.generatePixels) {
    if (Game.cpu.bucket >= 10000) {
      Game.cpu.generatePixel();
      console.log(`Converting cpu bucket into a Pixel. CURRENT PIXEL COUNT: ${Game.resources.pixel + 1}`);
    }
  }
}
