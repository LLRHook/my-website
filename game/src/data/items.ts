import type { ItemId } from "./ids.js";
import type { Codeling } from "../engine/storage.js";
export interface Item { name: string; price: number; description: string }
export const ITEMS: Readonly<Record<ItemId, Item>> = {
  forkBall: { name: "Fork Ball", price: 200, description: "Invite a wild Codeling to your team." },
  greatFork: { name: "Great Fork", price: 600, description: "A stronger fork. Catch power x1.5." },
  patch: { name: "Patch", price: 300, description: "Mend 20 HP. Small fix, big relief." },
  hotfix: { name: "Hotfix", price: 700, description: "Restore 60 HP before the next deploy." },
  fullRebuild: { name: "Full Rebuild", price: 1500, description: "Restore all HP and clear status." },
  rollback: { name: "Rollback", price: 1200, description: "Revive a fainted friend at half HP." },
  linter: { name: "Linter", price: 250, description: "Clear a status. Leave the quirks." },
};
export function applyItem(id: ItemId, mon: Codeling, maxHp: number): boolean {
  if (id === "forkBall" || id === "greatFork") {
    return false;
  }
  if (id === "rollback") {
    if (mon.hp !== 0) {
      return false;
    }
    mon.hp = Math.max(1, Math.floor(maxHp / 2));
    mon.status = null;
    return true;
  }
  if (!mon.hp || (mon.hp === maxHp && (!mon.status || !["linter", "fullRebuild"].includes(id)))) {
    return false;
  }
  if (id === "linter" && !mon.status) {
    return false;
  }
  if (id === "linter" || id === "fullRebuild") {
    mon.status = null;
  }
  if (id !== "linter") {
    mon.hp = Math.min(maxHp, mon.hp + (id === "patch" ? 20 : id === "hotfix" ? 60 : maxHp));
  }
  return true;
}
