import { systemPath } from "../../constants.mjs";

/** @import { FormFooterButton } from "@client/applications/_types.mjs" */

const { HandlebarsApplicationMixin, DocumentSheet } = foundry.applications.api;

/**
 * Basic sheet for Combatant Groups.
 */
export default class DrawSteelCombatantGroupConfig extends HandlebarsApplicationMixin(DocumentSheet) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel", "combatant-group-config", "standard-form"],
    position: { width: 420 },
    form: {
      closeOnSubmit: true,
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemPath("templates/sheets/combatant-group/header.hbs"),
    },
    body: {
      template: systemPath("templates/sheets/combatant-group/body.hbs"),
    },
    footer: {
      // Core template
      template: "templates/generic/form-footer.hbs",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const systemModel = this.document.system;
    return Object.assign(context, {
      system: systemModel,
      systemFields: systemModel.schema.fields,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, option) {
    context = await super._preparePartContext(partId, context, option);
    switch (partId) {
      case "body": this._prepareBodyContext(context); break;
      case "footer": this._prepareFooterContext(context); break;
    }
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Mutates the context object to add properties for the `body` part.
   * @param {object} context
   */
  _prepareBodyContext(context) {}

  /* -------------------------------------------------- */

  /**
   *  Mutates the context object to add properties for the `footer` part.
   * @param {object} context
   */
  _prepareFooterContext(context) {
    /** @type {FormFooterButton[]} */
    const buttons = [
      {
        type: "submit",
        label: game.i18n.format("DOCUMENT.Update", { type: game.i18n.localize("DOCUMENT.CombatantGroup") }),
        icon: "fa-solid fa-save",
      },
    ];

    context.buttons = buttons;
  }
}
