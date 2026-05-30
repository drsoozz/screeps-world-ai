export const TaskType = {
  Harvest: "HARVEST",
  Deposit: "DEPOSIT",
  Withdraw: "WITHDRAW",
  Construct: "CONSTRUCT",
  Repair: "REPAIR",
  Upgrade: "UPGRADE",
  Renew: "RENEW",
  Wait: "WAIT",
  Chart: "CHART"
} as const;

export type TaskType = (typeof TaskType)[keyof typeof TaskType];
