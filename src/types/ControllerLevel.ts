export const VALID_CONTROL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
export type ControllerLevel = (typeof VALID_CONTROL_LEVELS)[number];

export function isControllerLevel(level?: number): level is ControllerLevel {
  if (level === undefined) {
    return false;
  }
  return VALID_CONTROL_LEVELS.includes(level as any);
}
