import SavingThrowManager from "../applications/apps/saving-throw-manager.mjs";
import { systemID } from "../constants.mjs";
import BaseEffectModel from "../data/effect/base.mjs";
import DSRoll from "../rolls/base.mjs";

/**
 * @import ActiveEffectData from "@common/documents/_types.mjs";
 * @import { MaliceModel } from "../data/settings/malice.mjs";
 * @import { DrawSteelActor, DrawSteelCombatant, DrawSteelCombatantGroup } from "./_module.mjs";
 */

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Combat.documentClass.
 */
export default class DrawSteelCombat extends foundry.documents.Combat {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    Hooks.callAll("ds.prepareCombatData", this);
  }

  /* -------------------------------------------------- */

  /**
   * Roll a d10 to determine who goes first. On a 6+, heroes do.
   */
  async rollFirst() {
    const roll = new DSRoll("1d10");
    await roll.evaluate();

    const resultMessage = roll.total >= 6 ? "DRAW_STEEL.Combat.Initiative.Actions.RollFirst.Heroes" : "DRAW_STEEL.Combat.Initiative.Actions.RollFirst.Enemies";

    roll.toMessage({
      flavor: game.i18n.localize(resultMessage),
    }, { rollMode: CONST.DICE_ROLL_MODES.PUBLIC });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async startCombat() {
    for (const combatant of this.combatants) {
      await combatant.actor?.system.startCombat(combatant);
    }

    /** @type {MaliceModel} */
    const malice = game.actors.malice;
    const heroes = this.combatants.filter(c => (c.actor?.type === "character") && c.hasPlayerOwner).map(c => c.actor);
    await malice.startCombat(heroes);

    return super.startCombat();
  }

  /* -------------------------------------------------- */

  /**
   * @inheritdoc In Draw Steel's default initiative, non-GM users cannot change the round
   * @param {User} user The user attempting to change the round.
   * @returns {boolean} Is the user allowed to change the round?
   */
  _canChangeRound(user) {
    if (game.settings.get(systemID, "initiativeMode") !== "default") return super._canChangeRound(user);
    return user.isGM;
  }

  /* -------------------------------------------------- */

  /**
   * End the current turn without starting a new one.
   * @returns {DrawSteelCombat}
   */
  async endTurn() {
    const updateData = { round: this.round, turn: null };
    const updateOptions = { direction: 1, worldTime: { delta: null }, endTurn: true };
    Hooks.callAll("combatTurn", this, updateData, updateOptions);
    await this.update(updateData, updateOptions);
    return this;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async nextRound() {
    // In memory adjustment that will get committed during the super call
    this.turn = null;
    await super.nextRound();

    if (game.settings.get(systemID, "initiativeMode") !== "default") return;
    const combatantUpdates = this.combatants.map(c => ({ _id: c.id, initiative: c.actor?.system.combat.turns ?? 1 }));
    await this.updateEmbeddedDocuments("Combatant", combatantUpdates);
    return this;
  }

  /* -------------------------------------------------- */

  /**
   * @param {DrawSteelCombatant | DrawSteelCombatantGroup} a Some combatant.
   * @param {DrawSteelCombatant | DrawSteelCombatantGroup} b Some other combatant.
   * @returns {number} The sort for an {@linkcode Array.sort | Array#sort} callback.
   * @protected
   * @inheritdoc
   */
  _sortCombatants(a, b) {
    let dc = 0;
    // Sort by Players then Neutrals then Hostiles
    if (game.settings.get(systemID, "initiativeMode") === "default") {
      dc = b.disposition - a.disposition;
      if (!dc && a.active) return -1;
      else if (!dc && b.active) return 1;
      if (!dc && (a.group === b.group) && (a.group?.type === "squad")) {
        if (!a.actor?.isMinion) return -1;
        else if (!b.actor?.isMinion) return 1;
      }
    }
    if (dc) return dc;
    return super._sortCombatants(a, b);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);

    ui.players.render();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    // Need to special case endTurn setting the turn to null but still triggering end of turn events
    if (options.endTurn && game.user.isActiveGM) {
      const prev = this.previous;
      const combatant = this.combatants.get(prev.combatantId);
      if (combatant && (this.current.turn === null)) {
        if (CONFIG.debug.combat) console.debug(` | Combat End Turn: ${combatant.name}`);
        const context = { round: prev.round, turn: prev.turn, skipped: false };
        await this._onEndTurn(combatant, context);
        const token = combatant.token;
        if (token) {
          const regionEvents = token.regions.map(r => r._triggerEvent(CONST.REGION_EVENTS.TOKEN_TURN_END, { token, combatant, combat: this, ...context }));
          await Promise.allSettled(regionEvents);
        }
      }
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDelete(options, userId) {
    super._onDelete(options, userId);

    if (!game.user.isActiveGM || !this.round) return;

    /** @type {MaliceModel} */
    const malice = game.actors.malice;
    await malice.resetMalice();

    /** If malice is already 0, the {@linkcode MaliceModel.onChange} won't fire at the end of combat to render the player UI. */
    await ui.players.render();

    for (const combatant of this.combatants) {
      const actor = combatant.actor;
      if (!actor) continue;
      /** @type {ActiveEffectData[]} */
      const updates = [];
      for (const effect of actor.appliedEffects) {
        if (!(effect.system instanceof BaseEffectModel)) continue;
        if (["turn", "save", "encounter"].includes(effect.system.end.type)) updates.push({ _id: effect.id, disabled: true });
      }
      actor.updateEmbeddedDocuments("ActiveEffect", updates);
    }

    await this.completeEncounter();
  }

  /* -------------------------------------------------- */

  /**
     * Actions taken after descendant documents have been created and changes have been applied to client data.
     * @param {DrawSteelCombat} parent         The direct parent of the created Documents, may be this Document or a child.
     * @param {string} collection       The collection within which documents were created.
     * @param {DrawSteelCombatant[] | DrawSteelCombatantGroup[]} documents    The array of created Documents.
     * @param {object[]} data           The source data for new documents that were created.
     * @param {object} options          Options which modified the creation operation.
     * @param {string} userId           The ID of the User who triggered the operation.
     * @protected
     * @override
     */
  _onCreateDescendantDocuments(parent, collection, documents, data, options, userId) {
    super._onCreateDescendantDocuments(parent, collection, documents, data, options, userId);
    if (collection === "groups") this.#onModifyCombatantGroups(parent, documents, options);
  }

  /* -------------------------------------------------- */

  /**
     * Actions taken after descendant documents have been updated and changes have been applied to client data.
     * @param {DrawSteelCombat} parent         The direct parent of the updated Documents, may be this Document or a child.
     * @param {string} collection       The collection within which documents were updated.
     * @param {DrawSteelCombatant[] | DrawSteelCombatantGroup[]} documents    The array of updated Documents.
     * @param {object[]} changes        The array of differential Document updates which were applied.
     * @param {object} options          Options which modified the update operation.
     * @param {string} userId           The ID of the User who triggered the operation.
     * @protected
     * @override
     */
  _onUpdateDescendantDocuments(parent, collection, documents, data, options, userId) {
    super._onUpdateDescendantDocuments(parent, collection, documents, data, options, userId);
    if (collection === "groups") this.#onModifyCombatantGroups(parent, documents, options);
  }

  /* -------------------------------------------------- */

  /**
     * Actions taken after descendant documents have been deleted and those deletions have been applied to client data.
     * @param {Document} parent         The direct parent of the deleted Documents, may be this Document or a child.
     * @param {string} collection       The collection within which documents were deleted.
     * @param {Document[]} documents    The array of Documents which were deleted.
     * @param {string[]} ids            The array of document IDs which were deleted.
     * @param {object} options          Options which modified the deletion operation.
     * @param {string} userId           The ID of the User who triggered the operation.
     * @protected
     * @override
     */
  _onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId) {
    super._onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId);
    if (collection === "groups") this.#onModifyCombatantGroups(parent, documents, options);
  }

  /* -------------------------------------------------- */

  /**
   * Shared actions taken when CombatantGroups are modified within this Combat document.
   * @param {DrawSteelCombat} parent              The direct parent of the created Documents, may be this Document or a child.
   * @param {DrawSteelCombatantGroup[]} documents The array of created Documents.
   * @param {object} options                      Options which modified the operation.
   */
  #onModifyCombatantGroups(parent, documents, options) {
    if ((ui.combat.viewed === parent) && (options.render !== false)) ui.combat.render();
  }

  /* -------------------------------------------------- */

  /**
   * Handle Draw Steel effect expiration logic.
   * @inheritdoc
   */
  async _onEndTurn(combatant, context) {
    /** @type {DrawSteelActor} */
    const actor = combatant.actor;
    if (!actor || context.skipped) return;
    /** @type {ActiveEffectData[]} */
    const updates = [];
    for (const effect of actor.appliedEffects) {
      if (!(effect.system instanceof BaseEffectModel)) continue;
      switch (effect.system.end.type) {
        case "turn":
          updates.push({ _id: effect.id, disabled: true });
          break;
        case "save":
          SavingThrowManager.delegateSavingThrow(effect);
          break;
      }
    }
    actor.updateEmbeddedDocuments("ActiveEffect", updates);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onStartRound() {
    /** @type {MaliceModel} */
    const malice = game.actors.malice;
    const aliveHeroes = this.combatants
      .filter(c => (c.actor?.type === "character") && c.hasPlayerOwner && !c.actor.statuses.has("dead"))
      .map(c => c.actor);
    await malice._onStartRound(this, aliveHeroes);
  }

  /* -------------------------------------------------- */

  /**
   * Prompt the GM for end of encounter adjustments.
   */
  async completeEncounter() {
    const content = document.createElement("div");

    const victoryGroup = foundry.applications.fields.createFormGroup({
      label: "DRAW_STEEL.Combat.CompleteEncounter.AwardVictories.label",
      hint: "DRAW_STEEL.Combat.CompleteEncounter.AwardVictories.hint",
      // TODO: Once encounter difficulty math is implemented, default victory value to the victories for that difficulty
      input: foundry.applications.fields.createNumberInput({ name: "victories", value: 1 }),
      localize: true,
    });

    const resetTempStamina = foundry.applications.fields.createFormGroup({
      label: "DRAW_STEEL.Combat.CompleteEncounter.ResetTempStamina.label",
      input: foundry.applications.fields.createCheckboxInput({ name: "resetTempStamina", value: true }),
      classes: ["slim"],
      localize: true,
    });

    const resetHeroicResources = foundry.applications.fields.createFormGroup({
      label: "DRAW_STEEL.Combat.CompleteEncounter.ResetHeroicResources.label",
      input: foundry.applications.fields.createCheckboxInput({ name: "resetHeroicResources", value: true }),
      classes: ["slim"],
      localize: true,
    });

    content.append(victoryGroup, resetTempStamina, resetHeroicResources);
    const fd = await ds.applications.api.DSDialog.input({
      content,
      classes: ["complete-encounter"],
      window: {
        title: "DRAW_STEEL.Combat.CompleteEncounter.Title",
      },
    });

    if (fd) {
      for (const combatant of this.combatants) {
        const actor = combatant.actor;
        if (!actor) continue;
        const updates = { system: { } };
        if (actor.type === "character") {
          updates.system.hero = { victories: actor.system.hero.victories + fd.victories };
          if (fd.resetHeroicResources) updates.system.hero.primary = { value: 0 };
        }
        if (fd.resetTempStamina) updates.system.stamina = { temporary: 0 };

        await actor.update(updates);
      }
    }
  }
}
