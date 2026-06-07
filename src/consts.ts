import { ControllerLevel } from "types/ControllerLevel";
import { RoleType } from "creeps/roleType";

export const ROOM_SIZE = 50;
export const EXTENSION_COORD_LIMITS = {
  min: 5,
  max: ROOM_SIZE - 5
};
export const LIFE_RENEW_BOUNDS = {
  start: 250,
  stop: 1400
};
export const DEFAULT_REPAIR_BOUNDS = {
  start: 0.7,
  stop: 0.95
};
export const NUM_RENEWS: Record<ControllerLevel, number> = {
  0: 1,
  1: 5,
  2: 9,
  3: 13,
  4: 17,
  5: 21,
  6: 25,
  7: 29,
  8: 33
};

export const DEFAULT_PATH_OPACITY = 0.75;
export const DEFAULT_EXPLORATION_RANGE = 4;
export const DEFAULT_EXPLOITATION_RANGE = 3;
export const DEFAULT_REUSE_PATH = 15;
export const DEFAULT_LONG_JOURNEY_PATH = 100;

export const HARVESTERS_PER_SOURCE: Record<ControllerLevel, number> = {
  0: 1,
  1: 3,
  2: 3,
  3: 3,
  4: 3,
  5: 2,
  6: 2,
  7: 2,
  8: 2
};

export const ROLE_PRIORITY: RoleType[] = [...Object.values(RoleType)];
export const TASK_TARGET_AGE_LIMIT = 150;
export const CHART_TIMESTAMP_LIMIT = 10000;
export const BUILD_PRIORITY_OWNER = [
  STRUCTURE_EXTENSION,
  STRUCTURE_SPAWN,
  STRUCTURE_TOWER,
  STRUCTURE_CONTAINER,
  STRUCTURE_ROAD,
  STRUCTURE_WALL,
  STRUCTURE_RAMPART
];

export const BUILD_PRIORITY_NOT_OWNER = [];

export const SORT_BUILD_PRIORITY = {
  STRUCTURE_EXTENSION: 0,
  STRUCTURE_SPAWN: 1,
  STRUCTURE_TOWER: 2,
  STRUCTURE_CONTAINER: 3,
  STRUCTURE_ROAD: 4,
  STRUCTURE_WALL: 5,
  STRUCTURE_RAMPART: 6
};
export const SORT_DEPOSIT_PRIORITY = {
  [STRUCTURE_TOWER]: 0,
  [STRUCTURE_EXTENSION]: 1,
  [STRUCTURE_SPAWN]: 2,
  [STRUCTURE_CONTAINER]: 3
};

export const CREEP_PLANNING_FAILURE_COOLDOWN = 5;

export const TOWERDATA_TIMESTAMP_LIMIT = 1000;
export const TOWERDATA_TARGET_TIMESTAMP_LIMIT = 10;

export const ROAD_CSITE_MAX = 90;
export const EXPLOITATION_CSITE_MAX = 50;

