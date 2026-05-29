export {};

declare global {
  interface Memory {
    initialized: boolean;
    generatePixels: boolean;
    wasteCollection: number;
  }

  interface CreepMemory {
    role: string;
    task: string | null;
    homeRoom: string;
  }
}
