import { ControllerLevel } from "types/isValidControllerLevel";
import { RoleType } from "creeps/roleType";

export const ROOM_SIZE = 50;
export const EXTENSION_COORD_LIMITS = {
  min: 5,
  max: ROOM_SIZE - 5
};
export const LIFE_RENEW_BOUNDS = {
  min: 250,
  max: 1400
};
export const DEFAULT_REPAIR_BOUNDS = {
  min: 0.7,
  max: 0.95
};
export const NUM_RENEWS: Record<ControllerLevel, number> = {
  0: 3,
  1: 5,
  2: 7,
  3: 9,
  4: 11,
  5: 13,
  6: 15,
  7: 17,
  8: 19
};

export const DEFAULT_OPACITY = 0.75;
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
