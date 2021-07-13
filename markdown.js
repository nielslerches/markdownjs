const Markdown = (() => {
  // Import stylesheets

// Write Javascript code!
const container = document.getElementById('container');

class EventEmitter {
  constructor() {
    const delegate = document.createDocumentFragment();
    for (const f of [
      'addEventListener',
      'dispatchEvent',
      'removeEventListener'
    ]) {
      this[f] = (...xs) => delegate[f](...xs);
    }
  }
}

class Component extends EventEmitter {
  render() {
    let element = this.element;
    if (!element) {
      element = this.element = document.createElement('div');
      element.className = 'md-component';
      element.component = this;
    }

    return element;
  }

  onChange() {
    this.dispatchEvent(new CustomEvent('change', { detail: this }));
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

    this.placeholder = 'Hello, World!';
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
    header.className = 'md-header';

    const input = (this.input = document.createElement('input'));
    input.value = this.text;
    input.placeholder = this.placeholder;
    input.oninput = e => {
      e.preventDefault();
      this.text = e.target.value;
    };
    input.onkeypress = e => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          let nextComponent = this.nextComponent;
          if (nextComponent && nextComponent.focus) {
            nextComponent.focus();
          }
          break;
        default:
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
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
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

    const paragraph = (this.paragraph = document.createElement('p'));
    paragraph.className = 'md-paragraph';

    const input = (this.input = document.createElement('textarea'));
    input.value = this.text;
    input.placeholder = this.placeholder;
    input.oninput = e => {
      e.preventDefault();
      this.text = e.target.value;
    };
    input.onkeypress = e => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          let nextComponent = this.nextComponent;
          if (!nextComponent) {
            nextComponent = new Paragraph('');
            this.dispatchEvent(
              new CustomEvent('create', { detail: nextComponent })
            );
            if (nextComponent.focus) {
              nextComponent.focus();
            }
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

class Editor {
  constructor(container) {
    this.container = container;

    this._render = false;
    this.components = [new Header(1, ''), new Paragraph('')];
    this.addEventListeners();
    this.render();
  }

  addEventListeners() {
    for (const component of this.components) {
      this.addComponentEventListeners(component);
    }
  }

  addComponentEventListeners(component) {
    component.addEventListener('create', this.onComponentCreate);
  }

  onComponentCreate = ({ detail }) => {
    this.appendComponent(detail);
  };

  appendComponent(component) {
    this.components.push(component);
    if (this._render) {
      this.container.appendChild(component.render());
      this.addComponentEventListeners(component);
    }
  }

  render() {
    this._render = true;

    for (const component of this.components) {
      this.container.appendChild(component.render());
    }
  }
}

return {
  Editor
};

})();
