import { ControllerLevel } from "types/isValidControllerLevel";
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
  1: 3,
  2: 5,
  3: 7,
  4: 10,
  5: 13,
  6: 16,
  7: 20,
  8: 25
};

export const DEFAULT_PATH_OPACITY = 0.75;
export const DEFAULT_EXPLORATION_RANGE = 4;
export const DEFAULT_EXPLOITATION_RANGE = 3;
export const DEFAULT_REUSE_PATH = 10;
export const DEFAULT_LONG_JOURNEY_PATH = 100;

export const HARVESTERS_PER_SOURCE: Record<ControllerLevel, number> = {
  0: 1,
  1: 2,
  2: 2,
  3: 2,
  4: 2,
  5: 2,
  6: 2,
  7: 2,
  8: 2
};

export const ROLE_PRIORITY: RoleType[] = [...Object.values(RoleType)];

export const TASK_TARGET_AGE_LIMIT = 150;
