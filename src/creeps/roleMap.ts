import { RoleBase } from "./roleBase";
import { Charter } from "./roles/Charter";
import { Constructor } from "./roles/Constructor";
import { Harvester } from "./roles/Harvester";
import { Repairer } from "./roles/Repairer";
import { Upgrader } from "./roles/Upgrader";
import { RoleType } from "./roleType";

export const RoleMap: Record<RoleType, typeof RoleBase> = {
  [RoleType.Harvester]: Harvester,
  [RoleType.Upgrader]: Upgrader,
  [RoleType.Constructor]: Constructor,
  [RoleType.Repairer]: Repairer,
  [RoleType.Charter]: Charter
};
