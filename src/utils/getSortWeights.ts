import { BUILD_PRIORITY_OWNER, SORT_BUILD_PRIORITY, SORT_DEPOSIT_PRIORITY } from "consts";

export function getDepositPrioritySortWeight(s: AnyStructure): number {
  let key = s.structureType;
  if (key in SORT_DEPOSIT_PRIORITY) {
    return 1 / (1 + SORT_DEPOSIT_PRIORITY[key as keyof typeof SORT_DEPOSIT_PRIORITY]);
  } else {
    return 1 / Object.keys(SORT_DEPOSIT_PRIORITY).length;
  }
}

export function getConstructPrioritySortWeight(s: ConstructionSite): number {
  let key = s.structureType;
  if (key in SORT_BUILD_PRIORITY) {
    return 1 / (1 + SORT_BUILD_PRIORITY[key as keyof typeof SORT_BUILD_PRIORITY]);
  } else {
    return 1 / Object.keys(SORT_BUILD_PRIORITY).length;
  }
}
