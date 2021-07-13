const Markdown = (() => {
  class Event {
    constructor() {
      this.listeners = [];
    }

    addListener(listener) {
      this.listeners.push(listener);
    }

    trigger(params) {
      this.listeners.forEach((listener) => {
        listener(params);
      });
    }
  }

  class MdDocument {
    constructor() {
      this.elements = [];
      this.nextId = 0;

      this.headerElementAdded = new Event();
      this.paragraphElementAdded = new Event();

      this.paragraphElementChanged = new Event();
    }

    getNextId() {
      return `md-element-${this.nextId++}`;
    }

    addHeaderElement(level) {
      const id = this.getNextId();
      const element = {
        id,
        type: "header",
        text: "",
        level,
      };
      this.elements.push(element);
      this.headerElementAdded.trigger(element);
    }

    addParagraphElement(after) {
      const id = this.getNextId();
      const element = {
        id,
        type: "paragraph",
        text: "",
      };

      if (after === undefined) {
        this.elements.push(element);
      } else {
        const index = this.elements.findIndex(
          (element) => element.id === after
        );
        this.elements.splice(index + 1, 0, element);
      }

      this.paragraphElementAdded.trigger({ after, ...element });
    }

    changeParagraphElement({ id, text }) {
      const element = this.elements.find((element) => element.id === id);
      element.text = text;
      this.paragraphElementChanged.trigger(text);
    }
  }

  class MdView {
    constructor(container) {
      this.container = container;

      this.headerButtonClick = new Event();
      this.headerElementChanged = new Event();

      this.paragraphButtonClick = new Event();
      this.paragraphElementChanged = new Event();
      this.paragraphElementEnterPressed = new Event();
    }

    render() {
      this.buttons = document.createElement("div");

      // Header H1
      this.headerButton = document.createElement("button");
      this.headerButton.innerText = "H1";
      this.headerButton.onclick = (e) => {
        this.headerButtonClick.trigger(1);
      };
      this.buttons.appendChild(this.headerButton);

      // Paragraph
      this.paragraphButton = document.createElement("button");
      this.paragraphButton.innerText = "P";
      this.paragraphButton.onclick = (e) => {
        this.paragraphButtonClick.trigger();
      };
      this.buttons.appendChild(this.paragraphButton);

      this.container.appendChild(this.buttons);

      this.display = document.createElement("div");
      this.container.appendChild(this.display);
    }

    headerElementAdded({ id, text, level }) {
      const element = document.createElement(`h${level}`);
      element.id = id;
      element.className = "md-element";
      const input = document.createElement("input");
      input.value = text;
      input.placeholder = "# Header H1";
      input.oninput = (e) => {
        this.headerElementChanged.trigger({ id, text: e.target.value });
      };
      element.appendChild(input);

      this.display.appendChild(element);
      input.focus();

      return element;
    }

    paragraphElementAdded({ id, text, after }) {
      function resize(text) {
        input.rows = Math.ceil(text.length / cols);
      }

      const cols = 80;
      const placeholder =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

      const element = document.createElement(`p`);
      element.id = id;
      element.className = "md-element";

      const input = document.createElement("textarea");
      input.style.width = `${cols}ch`;
      input.value = text;
      input.placeholder = placeholder;
      resize(input.placeholder);

      input.oninput = (e) => {
        const text = e.target.value;
        resize(text);
        if (!text) {
          input.placeholder = placeholder;
          resize(placeholder);
        }

        this.paragraphElementChanged.trigger({ id, text });
      };
      input.onkeypress = (e) => {
        switch (e.key) {
          case "Enter":
            e.preventDefault();
            this.paragraphElementEnterPressed.trigger({ id });
            break;
        }
      };
      element.appendChild(input);

      if (after === undefined) {
        this.display.appendChild(element);
      } else {
        this.display.insertBefore(
          element,
          this.display.querySelector(`#${after}`).nextSibling
        );
      }

      input.focus();

      return element;
    }
  }

  class MdController {
    constructor(container) {
      this.document = new MdDocument();
      this.view = new MdView(container);

      this.view.headerButtonClick.addListener((level) => {
        this.document.addHeaderElement(level);
      });
      this.document.headerElementAdded.addListener((element) => {
        this.view.headerElementAdded(element);
      });

      this.view.paragraphButtonClick.addListener(() => {
        this.document.addParagraphElement();
      });
      this.document.paragraphElementAdded.addListener((element) => {
        this.view.paragraphElementAdded(element);
      });

      this.view.paragraphElementEnterPressed.addListener(({ id }) => {
        this.document.addParagraphElement(id);
      });
    }

    run() {
      this.view.render();
    }
  }

  class MdEditor {
    constructor(container) {
      const controller = new MdController(container);
      controller.run();
    }
  }

  return {
    MdEditor,
  };
})();
