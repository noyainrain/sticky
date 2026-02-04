/** ... */

import p5 from "p5";
import {
  // eslint-disable-next-line no-unused-vars
  AUTO, Ellipse, Rectangle, Shape, Text, Triangle, add, assert, body, e, ease, easeOn, easeOut,
  // eslint-disable-next-line no-unused-vars
  edge, h, linear, multiply, px, repeated, scalar, tween, w,
} from "#sticky";

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

// call("POST", "/models/{id}/renames", ...);
/**
 * @param {Model} model
 * @param {string} name
 * @returns {Model}
 */
function renameModel(model, name) {
  /** @type {string[]} */
  const names = JSON.parse(localStorage.models ?? "[]");
  if (names.includes(name)) {
    throw new Error(`Existing model ${name}`);
  }
  const i = names.findIndex(name => name === model.name);
  names[i] = name;
  localStorage.models = JSON.stringify(names);
  delete localStorage[`model:${model.name}`];
  return updateModel({ ...model, name });
}

/**
 * @typedef Line
 * @property {number} offset
 * @property {string} content
 */

/**
 * @param {string} text
 * @param {number} [start]
 * @param {number} [end]
 * @returns {Line[]}
 */
function getLines(text, start = 0, end = -0) {
  if (end < 0 || Object.is(end, -0)) {
    end = text.length + end;
  }
  const lines = text.split("\n");
  let offset = 0;
  /** @type {Line[]} */
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const content = lines[i];
    assert(content !== undefined);
    const nextOffset = offset + content.length + 1;
    if (start < nextOffset) {
      result.push({ offset, content });
    }
    if (end < nextOffset) {
      break;
    }
    offset = nextOffset;
  }
  return result;
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

class RenameDialog extends HTMLElement {
  #dialog;
  #input;

  constructor() {
    super();

    /** @type {?HTMLElement} */
    let element = this.querySelector("dialog");
    assert(element instanceof HTMLDialogElement);
    this.#dialog = element;

    element = this.querySelector("input");
    assert(element instanceof HTMLInputElement);
    this.#input = element;

    const button = this.querySelector("button");
    assert(button instanceof HTMLButtonElement);
    button.addEventListener("click", () => {
      const name = this.#input.value.trim();
      // TODO form validation
      if (name) {
        try {
          app.rename(name);
          this.#dialog.close();
        } catch (e) {
          console.log("error should be form validation", e);
        }
      }
    });
  }

  /** ... */
  open() {
    this.#input.value = app.currentModel.name;
    this.#dialog.showModal();
  }
}
customElements.define("studio-rename-dialog", RenameDialog);

/** @type {App} */
let app;

/** ... */
class App extends HTMLElement {
  /** @type {?Shape} */
  #model = null;
  #catchError = false;

  /** @type {Model} */
  #currentModel = { name: "", text: "" };
  // TODO refactor ^
  get currentModel() {
    return this.#currentModel;
  }

  /**
   * ...
   * @param {string} name
   */
  rename(name) {
    this.#currentModel = renameModel(this.#currentModel, name);
    location.hash = `#${name}`;
  }

  #p;

  #nameH1;
  #textarea;
  #errorP;

  constructor() {
    super();

    app = this;

    let element = document.querySelector("header h1");
    assert(element instanceof HTMLHeadingElement);
    this.#nameH1 = element;

    addEventListener("error", (event) => {
      if (!this.#catchError) {
        return;
      }
      this.#catchError = false;
      event.stopImmediatePropagation();

      let loc = "?";
      // ff: "play.js" (*), chrome: "play.html" (syntax), "" (*)
      // (#sourceURL not useful, ff uses only in stack, not in filename)
      if (!event.filename || event.filename.search(/play.(js|html)/) !== -1) {
        const lines = getLines(this.#textarea.value);
        const line = lines[event.lineno - 1];
        assert(line !== undefined);
        const i = line.offset + event.colno - 1;
        // const i = this.#textarea.value.split("\n").slice(0, event.lineno - 1).reduce(
        //   (offset, line) => offset + line.length + 1, 0,
        // )
        //  + event.colno - 1;
        // .match(/.+?\b/);
        // maybe don't guess token and just match single character or complete line?
        // maybe at end of line error (produce with ") match last character or complete line?
        const match = this.#textarea.value.slice(i).match(/\w+|./);
        loc = `${match} in line ${event.lineno}, column ${event.colno}`;
      }
      this.#errorP.textContent = `${event.error} (${loc})`;

      //      ::highlight(error) {
      //          background: red;
      //      }
      // if (line) {
      //   const range = new Range();
      //   range.setStart(this.#textarea, line.offset);
      //   range.setEnd(this.#textarea, line.offset + line.content.length - 1);
      //   const highlight = new Highlight(range);
      //   CSS.highlights.set("error", highlight);
      // }
    });

    addEventListener("hashchange", () => {
      this.#loadModel();
    });

    element = document.querySelector("textarea");
    if (!(element instanceof HTMLTextAreaElement)) {
      throw new Error("Assertion failed");
    }
    this.#textarea = element;

    this.#textarea.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        event.preventDefault();

        /** @type {[number, number]} */
        const range = [this.#textarea.selectionStart, this.#textarea.selectionEnd];
        const lines = getLines(this.#textarea.value, range[0], range[1]);

        if (event.shiftKey) {
          let deletions = 0;
          for (const line of lines) {
            if (!line.content.startsWith("\t")) {
              continue;
            }
            const offset = line.offset - deletions;
            this.#textarea.selectionStart = offset;
            this.#textarea.selectionEnd = offset;
            document.execCommand("forwardDelete", false);
            deletions++;
            if (range[0] > offset) {
              range[0]--;
            }
            if (range[1] > offset) {
              range[1]--;
            }
          }
          this.#textarea.selectionStart = range[0];
          this.#textarea.selectionEnd = range[1];
          // textarea.selectionStart = range[0] - (range[0] > firstLine.offset ? 1 : 0);
          // textarea.selectionEnd
          //   = range[1] - (lines.length - 1) - (range[1] > lastLine.offset ? 1 : 0);
        } else {
          for (const [i, line] of lines.entries()) {
            this.#textarea.selectionStart = line.offset + i;
            this.#textarea.selectionEnd = line.offset + i;
            document.execCommand("insertText", false, "\t");
          }
          this.#textarea.selectionStart = range[0] + 1;
          this.#textarea.selectionEnd = range[1] + lines.length;
        }
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const lines = getLines(this.#textarea.value, this.#textarea.selectionStart, this.#textarea.selectionEnd);
        assert(lines[0]);
        // enter terminates line at cursor
        const line = lines[0].content.slice(0, this.#textarea.selectionEnd - lines[0].offset);
        const match = line.match(/^\t*/);
        assert(match);
        const indent = match[0].length;
        const tabs = "\t".repeat(indent);
        document.execCommand("insertText", false, `\n${tabs}`);
      }
    });
    this.#textarea.addEventListener("input", () => {
      // localStorage.text = textarea.value;
      this.#currentModel = updateModel({ ...this.#currentModel, text: this.#textarea.value });
      this.#update();
    });

    element = document.querySelector("footer p");
    assert(element instanceof HTMLParagraphElement);
    this.#errorP = element;

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

    const openRenameDialogItem = document.querySelector("#open-rename-dialog");
    assert(openRenameDialogItem instanceof HTMLLIElement);
    openRenameDialogItem.addEventListener("click", () => {
      const renameDialog = document.querySelector("studio-rename-dialog");
      assert(renameDialog instanceof RenameDialog);
      renameDialog.open();
    });

    const downloadButton = document.querySelector("#download");
    assert(downloadButton instanceof HTMLLIElement);
    downloadButton.addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = `data:text/plain,${encodeURIComponent(this.#textarea.value)}`;
      a.download = this.#currentModel.name;
      a.click();
    });

    const openRecordDialogButton = document.querySelector("#open-record-dialog");
    assert(openRecordDialogButton instanceof HTMLLIElement);
    openRecordDialogButton.addEventListener("click", () => {
      recordDialog.showModal();
      // resetRecordP(true);
      this.#p.noLoop();
      recordP.loop();
    });

    element = document.querySelector("#record-dialog");
    assert(element instanceof HTMLDialogElement);
    const recordDialog = element;
    recordDialog.addEventListener("close", () => {
      recordP.noLoop();
      this.#p.loop();
    });

    const recordButton = document.querySelector("#record");
    assert(recordButton instanceof HTMLButtonElement);
    recordButton.addEventListener("click", () => {
      // resetRecordP(true);
      // no way to reset millis yet, maybe in future https://github.com/processing/p5.js/issues/4264
      // @ts-ignore
      recordP._millisStart = performance.now();
      recordP.saveGif(`${this.#currentModel.name}.gif`, 1);
    });

    element = document.querySelector("#record-canvas");
    assert(element instanceof HTMLDivElement);
    const recordCanvas = element;
    const recordP = new p5((p) => {
      p.setup = () => {
        p.createCanvas(640, 360);
        p.noLoop();
      };

      p.draw = () => {
        p.background(0);
        if (this.#model) {
          this.#model.render(p);
        }
      };
    }, recordCanvas);

    const container = document.querySelector("#canvas");
    if (!(container instanceof HTMLDivElement)) {
      throw new Error("Assertion failed");
    }

    this.#p = new p5((p) => {
      p.setup = () => {
        p.createCanvas(640, 360);
        // this.#update();
      };

      p.draw = () => {
        p.background(0);
        if (this.#model) {
          try {
            this.#model.render(p);
          } catch (e) {
            this.#errorP.textContent = `${e} (?)`;
          }
        }
      };
    }, container);
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
    this.#update();
  }

  #update() {
    // error contains position only via stack
    // stack of SyntaxError does not contain position inside eval code
    // -> use global error handler as hack to get error position
    setTimeout(
      () => {
        this.#catchError = true;
        // let func = new Function(`return ${text};`);
        // model = eval("//# sourceURL=stickyeval.js\n" + textarea.value);
        this.#model = eval(this.#textarea.value);
        this.#catchError = false;
        this.#errorP.textContent = "";
      },
      0,
    );
  }
}
customElements.define("studio-app", App);
