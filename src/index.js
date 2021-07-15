class EventEmitter {
  constructor() {
    const delegate = document.createDocumentFragment();
    for (const f of [
      "addEventListener",
      "dispatchEvent",
      "removeEventListener",
    ]) {
      this[f] = (...xs) => delegate[f](...xs);
    }
  }
}

class Component extends EventEmitter {
  render(tagName = undefined) {
    let element = this.element;
    if (!element) {
      element = this.element = document.createElement(
        tagName ? tagName : "div"
      );
      element.className = "md-component";
      element.component = this;
    } else {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    }

    return element;
  }

  onChange() {
    this.dispatchEvent(new CustomEvent("change", { detail: this }));
  }

  get previousComponent() {
    if (this.element.previousSibling)
      return this.element.previousSibling.component;
    return null;
  }

  get nextComponent() {
    if (this.element.nextSibling) return this.element.nextSibling.component;
    return null;
  }
}

class Header extends Component {
  constructor(level, text) {
    super();
    this._level = level;
    this._text = text;

    this.placeholder = "Hello, World!";
  }

  set level(value) {
    this._level = value;
    this.onChange();
  }

  get level() {
    return this._level;
  }

  set text(value) {
    this._text = value;
    this.onChange();
  }

  get text() {
    return this._text;
  }

  render() {
    const element = super.render();

    const header = (this.header = document.createElement(`h${this.level}`));
    header.className = "md-header";

    const input = (this.input = document.createElement("input"));
    input.value = this.text;
    input.placeholder = this.placeholder;
    input.oninput = (e) => {
      e.preventDefault();
      this.text = e.target.value;
    };
    input.onkeypress = (e) => {
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          let nextComponent = this.nextComponent;
          if (!nextComponent) {
            nextComponent = new Paragraph("");
            this.dispatchEvent(
              new CustomEvent("create", {
                detail: {
                  newComponent: nextComponent,
                  referenceComponent: this,
                  callback: (newComponent) => newComponent.focus(),
                },
              })
            );
          }
          if (nextComponent.focus) {
            nextComponent.focus();
          }
          break;
      }
    };

    header.appendChild(input);
    element.appendChild(header);

    return element;
  }

  onChange() {
    if (this.header.tagName.toLowerCase() != `h${this.level}`) {
      while (this.element.firstChild) {
        this.element.removeChild(this.element.firstChild);
      }
      this.render();
    }
    this.input.value = this.text;
    super.onChange();
  }

  focus() {
    if (this.input) this.input.focus();
  }
}

class Paragraph extends Component {
  constructor(text) {
    super();
    this._text = text;

    this.placeholder =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
    this.columns = 90;
  }

  set text(value) {
    this._text = value;
    this.onChange();
  }

  get text() {
    return this._text;
  }

  render() {
    const element = super.render();

    const paragraph = (this.paragraph = document.createElement("p"));
    paragraph.className = "md-paragraph";

    const input = (this.input = document.createElement("textarea"));
    input.value = this.text;
    input.placeholder = this.placeholder;
    input.oninput = (e) => {
      e.preventDefault();
      this.text = e.target.value;
    };
    input.onkeypress = (e) => {
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          let nextComponent = this.nextComponent;
          if (!nextComponent) {
            nextComponent = new Paragraph("");
            this.dispatchEvent(
              new CustomEvent("create", {
                detail: {
                  newComponent: nextComponent,
                  referenceComponent: this,
                  callback: (newComponent) => newComponent.focus(),
                },
              })
            );
          }
          if (nextComponent.focus) {
            nextComponent.focus();
          }
          break;
      }
    };

    paragraph.appendChild(input);
    element.appendChild(paragraph);

    this.resize();

    return element;
  }

  onChange() {
    this.input.value = this.text;
    this.resize();
    super.onChange();
  }

  resize() {
    if (this.resizeTask) {
      this.resizeTask = cancelIdleCallback(this.resizeTask);
    }

    const callback = () => {
      this.input.rows = Math.ceil(
        (this.input.value ? this.input.value : this.input.placeholder).length /
          this.columns
      );
      this.resizeTask = null;
    };

    this.resizeTask = requestIdleCallback(callback, { timeout: 250 });
  }

  focus() {
    if (this.input) {
      this.input.focus();
    }
  }
}

class UnorderedList extends Component {
  constructor(items = []) {
    super();

    this._items = items;

    // Bind items to list
    for (const item of items) {
      item.list = this;
      this.addComponentEventListeners(item);
    }
  }

  set items(value) {
    this._items = value;
    this.onChange();
  }

  get items() {
    return this._items;
  }

  render() {
    const element = super.render();

    const list = (this.list = document.createElement("ul"));
    list.className = "md-unordered-list";

    for (const item of this.items) {
      list.appendChild(item.render());
    }

    element.appendChild(list);

    return element;
  }

  onChange() {
    while (this.list.firstChild) {
      this.list.removeChild(this.list.firstChild);
    }
    super.onChange();
  }

  focus() {
    if (this.items.length > 0) {
      this.items[0].focus();
    }
  }

  addComponentEventListeners(component) {
    component.addEventListener("create", this.onComponentCreate);
  }

  onComponentCreate = ({
    detail: { referenceComponent, newComponent, callback },
  }) => {
    this.insertComponentAfter(referenceComponent, newComponent, callback);
  };

  insertComponentAfter(referenceComponent, newComponent, callback = undefined) {
    const refenceComponentIndex = this.items.findIndex(
      (component) => component === referenceComponent
    );
    this.items.splice(refenceComponentIndex + 1, 0, newComponent);
    newComponent.list = referenceComponent.list;
    this.addComponentEventListeners(newComponent);
    referenceComponent.element.parentNode.insertBefore(
      newComponent.render(),
      referenceComponent.element.nextSibling
    );
    callback && callback(newComponent);
  }
}

class ListItem extends Component {
  constructor(text = "") {
    super();

    this._text = text;
  }

  set text(value) {
    this._text = value;
    this.onChange();
  }

  get text() {
    return this._text;
  }

  get placeholder() {
    return `Item ${this.list.items.findIndex((item) => item === this) + 1}`;
  }

  render() {
    const element = super.render("li");
    element.classList.add("md-list-item");

    const input = (this.input = document.createElement("input"));
    input.value = this.text;
    input.placeholder = this.placeholder;
    input.oninput = (e) => {
      e.preventDefault();
      this.text = e.target.value;
    };
    input.onkeypress = (e) => {
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          let nextComponent = this.nextComponent;
          if (!nextComponent) {
            nextComponent = new ListItem();
            this.dispatchEvent(
              new CustomEvent("create", {
                detail: {
                  newComponent: nextComponent,
                  referenceComponent: this,
                  callback: (newComponent) => newComponent.focus(),
                },
              })
            );
          }
          break;
      }
    };

    element.appendChild(input);

    return element;
  }

  onChange() {
    if (this.input) this.input.value = this.text;
    super.onChange();
  }

  focus() {
    if (this.input) this.input.focus();
  }
}

export class Editor {
  constructor(container) {
    this.container = container;
    container.editor = this;

    this.components = [];

    this.appendComponent(new Header(1, ""));
    this.appendComponent(new UnorderedList([new ListItem()]));
  }

  addComponentEventListeners(component) {
    component.addEventListener("create", this.onComponentCreate);
  }

  onComponentCreate = ({
    detail: { referenceComponent, newComponent, callback },
  }) => {
    this.insertComponentAfter(referenceComponent, newComponent, callback);
  };

  appendComponent(component) {
    this.components.push(component);
    this.addComponentEventListeners(component);
    this.container.appendChild(component.render());
  }

  insertComponentAfter(referenceComponent, newComponent, callback = undefined) {
    const refenceComponentIndex = this.components.findIndex(
      (component) => component === referenceComponent
    );
    this.components.splice(refenceComponentIndex + 1, 0, newComponent);
    this.addComponentEventListeners(newComponent);
    referenceComponent.element.parentNode.insertBefore(
      newComponent.render(),
      referenceComponent.element.nextSibling
    );
    callback && callback(newComponent);
  }
}
