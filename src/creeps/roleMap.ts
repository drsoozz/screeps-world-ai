import { RoleBase } from "./roleBase";
import { Charter } from "./roles/Charter";
import { Commander } from "./roles/Commander";
import { Constructor } from "./roles/Constructor";
import { Harvester } from "./roles/Harvester";
import { Repairer } from "./roles/Repairer";
import { Soldier } from "./roles/Soldier";
import { Upgrader } from "./roles/Upgrader";
import { RoleType } from "./roleType";

export const RoleMap: Record<RoleType, typeof RoleBase> = {
  [RoleType.Harvester]: Harvester,
  [RoleType.Upgrader]: Upgrader,
  [RoleType.Constructor]: Constructor,
  [RoleType.Repairer]: Repairer,
  [RoleType.Charter]: Charter,
  [RoleType.Commander]: Commander,
  [RoleType.Soldier]: Soldier
};
