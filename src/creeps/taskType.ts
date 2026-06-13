export const TaskType = {
  Harvest: "HARVEST",
  Deposit: "DEPOSIT",
  Withdraw: "WITHDRAW",
  Construct: "CONSTRUCT",
  Command: "COMMAND",
  Repair: "REPAIR",
  Upgrade: "UPGRADE",
  Renew: "RENEW",
  Wait: "WAIT",
  Chart: "CHART",
  Rally: "RALLY",
  Raid: "RAID",
  Attack: "ATTACK"
} as const;

export type TaskType = (typeof TaskType)[keyof typeof TaskType];
