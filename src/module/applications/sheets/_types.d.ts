import * as documents from "../../documents/_module.mjs";
import * as data from "../../data/_module.mjs";
import * as sheets from "@client/applications/sheets/_module.mjs";

// TODO: Remove the extends if/when Foundry updates HBSMixin to use @template

declare module "./actor-sheet.mjs" {
  export default interface DrawSteelActorSheet extends sheets.ActorSheet {
    actor: documents.DrawSteelActor;
  }
}
declare module "./character.mjs" {
  export default interface DrawSteelActorSheet {
    actor: documents.DrawSteelActor & { system: data.Actor.characterModel };
  }
}
declare module "./npc.mjs" {
  export default interface DrawSteelActorSheet {
    actor: documents.DrawSteelActor & { system: data.Actor.npcModel };
  }
}

declare module "./combatant-group-config.mjs" {
  export default interface DrawSteelCombatantGroupConfig extends foundry.applications.api.DocumentSheet {
    document: documents.DrawSteelCombatantGroup;
  }
}

declare module "./item-sheet.mjs" {
  export default interface DrawSteelItemSheet extends sheets.ItemSheet {
    item: documents.DrawSteelItem;
  }
}

export interface ActorSheetItemContext {
  item: documents.DrawSteelItem;
  expanded: boolean;
  embed?: HTMLDivElement;
}

interface ActorSheetAbilityContext extends ActorSheetItemContext {
  formattedLabels: Record<"keywords" | "distance" | "target", string>;
  order?: number;
}

export interface ActorSheetAbilitiesContext {
  label: string;
  abilities: ActorSheetAbilityContext[];
  showAdd: boolean;
  showHeader: boolean;
}

export interface ActorSheetEquipmentContext {
  label: string;
  equipment: ActorSheetItemContext[];
  showAdd: boolean;
}
