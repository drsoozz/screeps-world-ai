import { TASK_TARGET_AGE_LIMIT } from "consts";
import { TaskType } from "creeps/taskType";
import { TaskTargetData } from "types/memory";

export function isTaskTargetValid(
  _taskData: TaskTargetData,
  task: TaskType,
  timeLimit: number = TASK_TARGET_AGE_LIMIT
): boolean {
  const taskData = _taskData?.[task];
  const tooOld = Game.time - (taskData?.timestamp ?? timeLimit) < timeLimit;
  return !!taskData && !tooOld;
}
