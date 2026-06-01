import { structurePlanningData, structurePlanningDataRoads, structurePlanningDataTowers } from "types/memory";

export function structurePlanningFactory(): structurePlanningData {
  return { roads: structurePlanningFactoryRoads(), towers: structurePlanningFactoryTower() };
}

export function structurePlanningFactoryRoads(): structurePlanningDataRoads {
  return { coords: [], index: 0 };
}

export function structurePlanningFactoryTower(): structurePlanningDataTowers {
  return {};
}
