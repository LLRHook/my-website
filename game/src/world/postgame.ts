import type { SaveV1 } from "../engine/storage.js";
import { POSTGAME_TEXT as T } from "../data/text.js";
import type { Species } from "../data/species.js";
import type { Script } from "./script.js";

export type RematchId = "rhea" | "otto" | "mira" | "prof";
export type QuestId = "keyboard" | "evolved" | "milestones";

export function localDate(now: Date): string {
  return `${String(now.getFullYear()).padStart(4, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${
    String(now.getDate()).padStart(2, "0")}`;
}

export function postGame(flags: readonly string[]): boolean {
  return flags.includes("champion");
}

export function rematchAvailable(flags: readonly string[], id: RematchId, today: string): boolean {
  return postGame(flags) && !flags.includes(`rematch:${id}:${today}`);
}

function replaceFlag(flags: string[], prefix: string, value: string): void {
  for (let index = flags.length - 1; index >= 0; index--) {
    if (flags[index].startsWith(prefix)) {
      flags.splice(index, 1);
    }
  }
  flags.push(prefix + value);
}

export function markRematch(flags: string[], id: RematchId, today: string): void {
  replaceFlag(flags, `rematch:${id}:`, today);
}

export function questState(flags: readonly string[], id: QuestId): string | null {
  const prefix = `quest:${id}:`;
  return flags.find((flag) => flag.startsWith(prefix))?.slice(prefix.length) ?? null;
}

export function setQuestState(flags: string[], id: QuestId, state: string): void {
  replaceFlag(flags, `quest:${id}:`, state);
}

export function nextMilestone(caught: number, total: number, claimed: 0 | 1 | 2 | 3): 1 | 2 | 3 | null {
  if (total <= 0 || claimed === 3) {
    return null;
  }
  const tier = (claimed + 1) as 1 | 2 | 3;
  const target = [Math.ceil(total * 0.25), Math.ceil(total * 0.5), total][tier - 1];
  return caught >= target ? tier : null;
}

export function rematchId(id: string): RematchId | null {
  return id === "rhea" || id === "otto" || id === "mira" || id === "prof" ? id : null;
}

export function rematchScript(flags: readonly string[], id: RematchId, today: string): Script {
  if (!postGame(flags)) {
    return [];
  }
  return rematchAvailable(flags, id, today)
    ? [{ ask: T.rematch[id], yes: [{ battle: id }], no: [{ say: T.decline }] }]
    : [{ say: T.cooldown[id] }];
}

export function repositoryCaught(species: readonly Species[], caught: readonly number[]): number {
  return species.filter((entry) => entry.dex > 0 && caught.includes(entry.id)).length;
}

export function diplomaComplete(species: readonly Species[], caught: readonly number[]): boolean {
  const total = species.filter((entry) => entry.dex > 0).length;
  return total > 0 && repositoryCaught(species, caught) === total;
}

type QuestProgress = Pick<SaveV1, "flags" | "party" | "caught">;

export function questScript(state: QuestProgress, id: QuestId, species: readonly Species[]): Script {
  if (!postGame(state.flags)) {
    return [];
  }
  const progress = questState(state.flags, id);
  if (id === "keyboard") {
    if (progress === "found") {
      return [{ say: T.keyboardReward }, { coins: 1000 }, { give: "hotfix", qty: 3 },
        { quest: id, state: "done" }];
    }
    return progress === "done" ? [{ say: T.keyboardDone }]
      : [{ say: progress === "started" ? T.keyboardHint : T.keyboardStart }, { quest: id, state: "started" }];
  }
  if (id === "evolved") {
    if (progress === "done") {
      return [{ say: T.evolvedDone }];
    }
    return state.party.some((mon) => mon.stage >= 2)
      ? [{ say: T.evolvedReward }, { give: "greatFork", qty: 5 }, { quest: id, state: "done" }]
      : [{ say: T.evolvedStart }, { quest: id, state: "started" }];
  }
  const claimed = progress === "1" ? 1 : progress === "2" ? 2 : progress === "3" ? 3 : 0;
  const tier = nextMilestone(repositoryCaught(species, state.caught),
    species.filter((entry) => entry.dex > 0).length, claimed);
  if (tier === null) {
    return [{ say: claimed === 3 ? T.milestonesDone : T.milestonesStart }];
  }
  const reward: Script = tier === 1 ? [{ give: "greatFork", qty: 5 }]
    : tier === 2 ? [{ give: "fullRebuild", qty: 3 }] : [{ coins: 3000 }, { give: "rollback", qty: 3 }];
  return [{ say: T.milestones[tier - 1] }, ...reward, { quest: id, state: String(tier) }];
}

export function keyboardSpot(flags: readonly string[]): Script {
  return postGame(flags) && questState(flags, "keyboard") === "started"
    ? [{ say: T.keyboardFound }, { quest: "keyboard", state: "found" }] : [];
}
