/** ... */

import { assert } from "#sticky";

/**
 * @typedef Model
 * @property {string} name
 * @property {string} text
 */

// call("GET", "/models");
/**
 * @returns {Model[]}
 */
function getModels() {
  const names = JSON.parse(localStorage.models ?? "[]");
  assert(names instanceof Array);
  return names.map((name) => {
    const model = getModel(name);
    assert(model);
    return model;
  });
}

/**
 * @param {string} name
 * @returns {Model | undefined}
 */
function getModel(name) {
  const data = localStorage[`model:${name}`];
  return data ? JSON.parse(data) : undefined;
}

// call("POST", "/models/{id}", ...);
/**
 * @param {Model} model
 */
function updateModel(model) {
  localStorage[`model:${model.name}`] = JSON.stringify(model);
  return model;
}

// call("POST", "/models", {});
/**
 * @param {Model} model
 */
function createModel(model) {
  const names = JSON.parse(localStorage.models ?? "[]");
  // XXX better algoritm, what if name is already taken
  model = { ...model, name: `new-${names.length + 1}.sticky` };
  names.push(model.name);
  localStorage.models = JSON.stringify(names);
  updateModel(model);
  return model;
}

/**
 * ...
 */
class OpenModelDialog extends HTMLElement {
  /**
   * ...
   */
  open() {
    const dialog = this.querySelector("dialog");
    assert(dialog instanceof HTMLDialogElement);
    const ul = dialog.querySelector("ul");
    assert(ul instanceof HTMLUListElement);

    ul.replaceChildren(
      ...getModels().map((model) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `#${model.name}`;
        a.textContent = model.name;
        a.addEventListener("click", () => dialog.close());
        li.append(a);
        return li;
      }),
    );

    dialog.showModal();
  }
}
customElements.define("studio-open-model-dialog", OpenModelDialog);

/** ... */
class App extends HTMLElement {
  /** @type {Model} */
  #currentModel = { name: "", text: "" };

  #nameH1;
  #textarea;

  constructor() {
    super();

    let element = document.querySelector("header h1");
    assert(element instanceof HTMLHeadingElement);
    this.#nameH1 = element;

    addEventListener("hashchange", () => {
      this.#loadModel();
    });

    element = document.querySelector("textarea");
    if (!(element instanceof HTMLTextAreaElement)) {
      throw new Error("Assertion failed");
    }
    this.#textarea = element;
    this.#textarea.addEventListener("input", () => {
      // localStorage.text = textarea.value;
      this.#currentModel = updateModel({ ...this.#currentModel, text: this.#textarea.value });
    });

    const createModelLi = document.querySelector("#create-model");
    assert(createModelLi instanceof HTMLLIElement);
    createModelLi.addEventListener("click", () => {
      blur();
      const model = createModel({ name: "", text: "" });
      location.hash = `#${model.name}`;
      this.#loadModel();
    });

    const openModelDialogButton = document.querySelector("#open-model-dialog");
    assert(openModelDialogButton instanceof HTMLLIElement);
    openModelDialogButton.addEventListener("click", () => {
      const openModelDialog = document.querySelector("studio-open-model-dialog");
      assert(openModelDialog instanceof OpenModelDialog);
      openModelDialog.open();
    });
  }

  connectedCallback() {
    this.#loadModel();
  }

  #loadModel() {
    const name = location.hash.slice(1);

    if (!name) {
      let model = getModels()[0] ?? createModel({ name: "", text: "" });
      location.hash = `#${model.name}`;
      this.#loadModel();
      return;
    }

    const model = getModel(name);
    if (!model) {
      alert(`Unknown model ${name}`);
      return;
    }
    this.#currentModel = model;
    this.#nameH1.textContent = model.name;
    this.#textarea.value = model.text;
  }
}
customElements.define("studio-app", App);
