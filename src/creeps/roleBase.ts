export class RoleBase {
  creep: Creep;
  memory: CreepMemory;
  constructor(creep: Creep) {
    this.creep = creep;
    this.memory = creep.memory;
  }

  run(): void {
    this._findTask();
    this._doTask();
  }

  _findTask(): void {
    throw new Error("_findTask() must be implemented by subclass");
  }

  _doTask(): void {
    throw new Error("_doTask() must be implemented by subclass");
  }
}
