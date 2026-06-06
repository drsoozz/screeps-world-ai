import { TOWERDATA_TARGET_TIMESTAMP_LIMIT, TOWERDATA_TIMESTAMP_LIMIT } from "consts";

export function runTowers() {
  const timePassed = Game.time - Memory.towerData.timestamp;
  if (timePassed > TOWERDATA_TIMESTAMP_LIMIT) {
    // find towers
    Memory.towerData.timestamp = Game.time;
    const allTowers = Object.values(Game.structures).filter(
      s => s.structureType === STRUCTURE_TOWER
    ) as StructureTower[];
    for (const tower of allTowers) {
      if (!Memory.towerData.towers.map(t => t.id).includes(tower.id)) {
        Memory.towerData.towers.push({ id: tower.id, currentTarget: undefined, timestamp: 0 });
      }
    }
  }

  for (const towerData of Memory.towerData.towers) {
    // run each tower
    // check if target is too old. if so, try to find new target
    const tower = Game.getObjectById(towerData.id);
    if (tower === null) {
      continue;
    }
    let target;
    if (towerData.currentTarget) {
      target = Game.getObjectById(towerData.currentTarget);
    } else {
      target = null;
    }

    const targetTimePassed = Game.time - towerData.timestamp;
    if (!target || targetTimePassed > TOWERDATA_TARGET_TIMESTAMP_LIMIT) {
      const hostileCreeps = tower.room.find(FIND_HOSTILE_CREEPS);
      const hostilePowerCreeps = tower.room.find(FIND_HOSTILE_POWER_CREEPS);
      const allTargets = [...hostileCreeps, ...hostilePowerCreeps].sort((a, b) => {
        if (a instanceof Creep) {
          if (a.body.map(bp => bp.type).includes(HEAL)) {
            return tower.pos.getRangeTo(a.pos) / 2 - tower.pos.getRangeTo(b.pos);
          }
        }
        return tower.pos.getRangeTo(a.pos) - tower.pos.getRangeTo(b.pos);
      });
      // does this update Memory.towerData.towers ?
      towerData.currentTarget = allTargets.length > 0 ? allTargets[0].id : undefined;
      towerData.timestamp = Game.time;
    }

    if (towerData.currentTarget) {
      target = Game.getObjectById(towerData.currentTarget);
      if (!target) {
        continue;
      }
      tower.attack(target);
    } else {
      // if there are no hostile targets, look to repair creeps
      const friendlyCreeps = tower.room.find(FIND_MY_CREEPS);
      const friendlyPowerCreeps = tower.room.find(FIND_MY_POWER_CREEPS);
      const allTargets = [...friendlyCreeps, ...friendlyPowerCreeps]
        .filter(c => {
          return c.hits != c.hitsMax;
        })
        .sort((a, b) => {
          if (a instanceof PowerCreep) {
            return a.hits / a.hitsMax / 5 - b.hits / b.hitsMax;
          }
          return a.hits / a.hitsMax - b.hits / b.hitsMax;
        });
      towerData.currentTarget = allTargets.length > 0 ? allTargets[0].id : undefined;
      towerData.timestamp = Game.time;

      if (towerData.currentTarget) {
        target = Game.getObjectById(towerData.currentTarget);
        if (!target) {
          continue;
        }
        tower.heal(target);
      }
    }
  }
}
