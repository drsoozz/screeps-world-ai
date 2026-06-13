import { MilitaryType } from "creeps/roles/MilitaryType";
import { TaskType } from "creeps/taskType";

export const MilitaryTypeToTaskMap: Record<MilitaryType, TaskType> = {
  [MilitaryType.DEFENSE]: TaskType.Attack,
  [MilitaryType.RAID]: TaskType.Raid
};
