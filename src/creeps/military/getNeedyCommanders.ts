import { RoleType } from "creeps/roleType";
import { getCommanderPrioritySortWeight } from "utils/getSortWeights";

export function getNeedyCommanders() {
  const commanders = Object.values(Game.creeps)
    .filter(s => {
      return s.memory.role === RoleType.Commander;
    })
    .sort((a, b) => {
      return getCommanderPrioritySortWeight(a) - getCommanderPrioritySortWeight(b);
    });
  return commanders;
}
