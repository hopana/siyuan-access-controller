import "@/index.scss";
import {
  adaptHotkey,
  confirm,
  Constants,
  Dialog,
  getBackend,
  getFrontend,
  ICard,
  ICardData,
  IModel,
  IOperation,
  lockScreen,
  Menu,
  openMobileFileById,
  openTab,
  openWindow,
  Plugin,
  Protyle,
  showMessage,
} from "siyuan";

import HelloExample from "@/hello.svelte";
import SettingExample from "@/setting-example.svelte";

import { svelteDialog } from "./libs/dialog";
import { SettingUtils } from "./libs/setting-utils";

const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

export default class PluginVeil extends Plugin {
  customTab: () => IModel;
  private isMobile: boolean;
  private blockIconEventBindThis = this.blockIconEvent.bind(this);
  private settingUtils: SettingUtils;

  async onload() {
    this.data[STORAGE_NAME] = { readonlyText: "Readonly" };

    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

    // 图标的制作参见帮助文档
    this.addIcons(`<symbol id="iconFace" viewBox="0 0 32 32">
<path d="M13.667 17.333c0 0.92-0.747 1.667-1.667 1.667s-1.667-0.747-1.667-1.667 0.747-1.667 1.667-1.667 1.667 0.747 1.667 1.667zM20 15.667c-0.92 0-1.667 0.747-1.667 1.667s0.747 1.667 1.667 1.667 1.667-0.747 1.667-1.667-0.747-1.667-1.667-1.667zM29.333 16c0 7.36-5.973 13.333-13.333 13.333s-13.333-5.973-13.333-13.333 5.973-13.333 13.333-13.333 13.333 5.973 13.333 13.333zM14.213 5.493c1.867 3.093 5.253 5.173 9.12 5.173 0.613 0 1.213-0.067 1.787-0.16-1.867-3.093-5.253-5.173-9.12-5.173-0.613 0-1.213 0.067-1.787 0.16zM5.893 12.627c2.28-1.293 4.040-3.4 4.88-5.92-2.28 1.293-4.040 3.4-4.88 5.92zM26.667 16c0-1.040-0.16-2.040-0.44-2.987-0.933 0.2-1.893 0.32-2.893 0.32-4.173 0-7.893-1.92-10.347-4.92-1.4 3.413-4.187 6.093-7.653 7.4 0.013 0.053 0 0.12 0 0.187 0 5.88 4.787 10.667 10.667 10.667s10.667-4.787 10.667-10.667z"></path>
</symbol>
<symbol id="iconSaving" viewBox="0 0 32 32">
<path d="M20 13.333c0-0.733 0.6-1.333 1.333-1.333s1.333 0.6 1.333 1.333c0 0.733-0.6 1.333-1.333 1.333s-1.333-0.6-1.333-1.333zM10.667 12h6.667v-2.667h-6.667v2.667zM29.333 10v9.293l-3.76 1.253-2.24 7.453h-7.333v-2.667h-2.667v2.667h-7.333c0 0-3.333-11.28-3.333-15.333s3.28-7.333 7.333-7.333h6.667c1.213-1.613 3.147-2.667 5.333-2.667 1.107 0 2 0.893 2 2 0 0.28-0.053 0.533-0.16 0.773-0.187 0.453-0.347 0.973-0.427 1.533l3.027 3.027h2.893zM26.667 12.667h-1.333l-4.667-4.667c0-0.867 0.12-1.72 0.347-2.547-1.293 0.333-2.347 1.293-2.787 2.547h-8.227c-2.573 0-4.667 2.093-4.667 4.667 0 2.507 1.627 8.867 2.68 12.667h2.653v-2.667h8v2.667h2.68l2.067-6.867 3.253-1.093v-4.707z"></path>
</symbol>`);

    const topBarElement = this.addTopBar({
      icon: "iconFace",
      title: this.i18n.addTopBarIcon,
      position: "right",
      callback: () => {
        if (this.isMobile) {
          this.addMenu();
        } else {
          let rect = topBarElement.getBoundingClientRect();
          // 如果被隐藏，则使用更多按钮
          if (rect.width === 0) {
            rect = document.querySelector("#barMore").getBoundingClientRect();
          }
          if (rect.width === 0) {
            rect = document
              .querySelector("#barPlugins")
              .getBoundingClientRect();
          }
          this.addMenu(rect);
        }
      },
    });

    const statusIconTemp = document.createElement("template");
    statusIconTemp.innerHTML = `
			<div class="toolbar__item ariaLabel" aria-label="Remove plugin-sample Data">
				<svg>
						<use xlink:href="#iconTrashcan"></use>
				</svg>
			</div>`;
    statusIconTemp.content.firstElementChild.addEventListener("click", () => {
      confirm(
        "⚠️",
        this.i18n.confirmRemove.replace("${name}", this.name),
        () => {
          this.removeData(STORAGE_NAME).then(() => {
            this.data[STORAGE_NAME] = { readonlyText: "Readonly" };
            showMessage(`[${this.name}]: ${this.i18n.removedData}`);
          });
        }
      );
    });
    this.addStatusBar({
      element: statusIconTemp.content.firstElementChild as HTMLElement,
    });

    this.addCommand({
      langKey: "showDialog",
      hotkey: "⇧⌘O",
      callback: () => {
        this.showDialog();
      },
      fileTreeCallback: (file: any) => {
        console.log(file, "fileTreeCallback");
      },
      editorCallback: (protyle: any) => {
        console.log(protyle, "editorCallback");
      },
      dockCallback: (element: HTMLElement) => {
        console.log(element, "dockCallback");
      },
    });
    this.addCommand({
      langKey: "getTab",
      hotkey: "⇧⌘M",
      globalCallback: () => {
        console.log(this.getOpenedTab());
      },
    });

    this.addDock({
      config: {
        position: "LeftBottom",
        size: { width: 200, height: 0 },
        icon: "iconSaving",
        title: "Custom Dock",
        hotkey: "⌥⌘W",
      },
      data: {
        text: "This is my custom dock",
      },
      type: DOCK_TYPE,
      resize() {
        console.log(DOCK_TYPE + " resize");
      },
      update() {
        console.log(DOCK_TYPE + " update");
      },
      init: (dock) => {
        if (this.isMobile) {
          dock.element.innerHTML = `
						<div class="toolbar toolbar--border toolbar--dark">
							<svg class="toolbar__icon"><use xlink:href="#iconEmoji"></use></svg>
									<div class="toolbar__text">Custom Dock</div>
							</div>
							<div class="fn__flex-1 plugin-sample__custom-dock">
									${dock.data.text}
							</div>
						</div>`;
        } else {
          dock.element.innerHTML = `
					<div class="fn__flex-1 fn__flex-column">
						<div class="block__icons">
								<div class="block__logo">
										<svg class="block__logoicon"><use xlink:href="#iconEmoji"></use></svg>
										Custom Dock
								</div>
								<span class="fn__flex-1 fn__space"></span>
								<span data-type="min" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="Min ${adaptHotkey(
                  "⌘W"
                )}"><svg class="block__logoicon"><use xlink:href="#iconMin"></use></svg></span>
						</div>
						<div class="fn__flex-1 plugin-sample__custom-dock">
								${dock.data.text}
						</div>
					</div>`;
        }
      },
      destroy() {
        console.log("destroy dock:", DOCK_TYPE);
      },
    });

    this.settingUtils = new SettingUtils({
      plugin: this,
      name: STORAGE_NAME,
    });
    this.settingUtils.addItem({
      key: "Input",
      value: "",
      type: "textinput",
      title: "Readonly text",
      description: "Input description",
      action: {
        // Called when focus is lost and content changes
        callback: () => {
          // Return data and save it in real time
          let value = this.settingUtils.takeAndSave("Input");
          console.log(value);
        },
      },
    });
    this.settingUtils.addItem({
      key: "InputArea",
      value: "",
      type: "textarea",
      title: "Readonly text",
      description: "Input description",
      // Called when focus is lost and content changes
      action: {
        callback: () => {
          // Read data in real time
          let value = this.settingUtils.take("InputArea");
          console.log(value);
        },
      },
    });
    this.settingUtils.addItem({
      key: "Check",
      value: true,
      type: "checkbox",
      title: "Checkbox text",
      description: "Check description",
      action: {
        callback: () => {
          // Return data and save it in real time
          let value = !this.settingUtils.get("Check");
          this.settingUtils.set("Check", value);
          console.log(value);
        },
      },
    });
    this.settingUtils.addItem({
      key: "Select",
      value: 1,
      type: "select",
      title: "Select",
      description: "Select description",
      options: {
        1: "Option 1",
        2: "Option 2",
      },
      action: {
        callback: () => {
          // Read data in real time
          let value = this.settingUtils.take("Select");
          console.log(value);
        },
      },
    });
    this.settingUtils.addItem({
      key: "Slider",
      value: 50,
      type: "slider",
      title: "Slider text",
      description: "Slider description",
      direction: "column",
      slider: {
        min: 0,
        max: 100,
        step: 1,
      },
      action: {
        callback: () => {
          // Read data in real time
          let value = this.settingUtils.take("Slider");
          console.log(value);
        },
      },
    });
    this.settingUtils.addItem({
      key: "Btn",
      value: "",
      type: "button",
      title: "Button",
      description: "Button description",
      button: {
        label: "Button",
        callback: () => {
          showMessage("Button clicked");
        },
      },
    });
    this.settingUtils.addItem({
      key: "Custom Element",
      value: "",
      type: "custom",
      direction: "row",
      title: "Custom Element",
      description: "Custom Element description",
      //Any custom element must offer the following methods
      createElement: (currentVal: any) => {
        let div = document.createElement("div");
        div.style.border = "1px solid var(--b3-theme-primary)";
        div.contentEditable = "true";
        div.textContent = currentVal;
        return div;
      },
      getEleVal: (ele: HTMLElement) => {
        return ele.textContent;
      },
      setEleVal: (ele: HTMLElement, val: any) => {
        ele.textContent = val;
      },
    });
    this.settingUtils.addItem({
      key: "Hint",
      value: "",
      type: "hint",
      title: this.i18n.hintTitle,
      description: this.i18n.hintDesc,
    });

    try {
      this.settingUtils.load();
    } catch (error) {
      console.error(
        "Error loading settings storage, probably empty config json:",
        error
      );
    }

    this.protyleSlash = [
      {
        filter: ["insert emoji 😊", "插入表情 😊", "crbqwx"],
        html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18n.insertEmoji}</span><span class="b3-list-item__meta">😊</span></div>`,
        id: "insertEmoji",
        callback(protyle: Protyle) {
          protyle.insert("😊");
        },
      },
    ];

    this.protyleOptions = {
      toolbar: [
        "block-ref",
        "a",
        "|",
        "text",
        "strong",
        "em",
        "u",
        "s",
        "mark",
        "sup",
        "sub",
        "clear",
        "|",
        "code",
        "kbd",
        "tag",
        "inline-math",
        "inline-memo",
        "|",
        {
          name: "insert-smail-emoji",
          icon: "iconEmoji",
          hotkey: "⇧⌘I",
          tipPosition: "n",
          tip: this.i18n.insertEmoji,
          click(protyle: Protyle) {
            protyle.insert("😊");
          },
        },
      ],
    };

    console.log(this.i18n.helloPlugin);
  }

  onLayoutReady() {
    // this.loadData(STORAGE_NAME);
    this.settingUtils.load();
    console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);

    console.log(
      "Official settings value calling example:\n" +
        this.settingUtils.get("InputArea") +
        "\n" +
        this.settingUtils.get("Slider") +
        "\n" +
        this.settingUtils.get("Select") +
        "\n"
    );

    let tabDiv = document.createElement("div");
    new HelloExample({
      target: tabDiv,
      props: {
        app: this.app,
      },
    });
    this.customTab = this.addTab({
      type: TAB_TYPE,
      init() {
        this.element.appendChild(tabDiv);
        console.log(this.element);
      },
      beforeDestroy() {
        console.log("before destroy tab:", TAB_TYPE);
      },
      destroy() {
        console.log("destroy tab:", TAB_TYPE);
      },
    });
  }

  async onunload() {
    console.log(this.i18n.byePlugin);
    showMessage("Goodbye SiYuan Plugin");
    console.log("onunload");
  }

  uninstall() {
    console.log("uninstall");
  }

  async updateCards(options: ICardData) {
    options.cards.sort((a: ICard, b: ICard) => {
      if (a.blockID < b.blockID) {
        return -1;
      }
      if (a.blockID > b.blockID) {
        return 1;
      }
      return 0;
    });
    return options;
  }

  /**
   * A custom setting pannel provided by svelte
   */
  openDIYSetting(): void {
    let dialog = new Dialog({
      title: "SettingPannel",
      content: `<div id="SettingPanel" style="height: 100%;"></div>`,
      width: "800px",
      destroyCallback: (options) => {
        console.log("destroyCallback", options);
        //You'd better destroy the component when the dialog is closed
        pannel.$destroy();
      },
    });
    let pannel = new SettingExample({
      target: dialog.element.querySelector("#SettingPanel"),
    });
  }

  private blockIconEvent({ detail }: any) {
    detail.menu.addItem({
      iconHTML: "",
      label: this.i18n.removeSpace,
      click: () => {
        const doOperations: IOperation[] = [];
        detail.blockElements.forEach((item: HTMLElement) => {
          const editElement = item.querySelector('[contenteditable="true"]');
          if (editElement) {
            editElement.textContent = editElement.textContent.replace(/ /g, "");
            doOperations.push({
              id: item.dataset.nodeId,
              data: item.outerHTML,
              action: "update",
            });
          }
        });
        detail.protyle.getInstance().transaction(doOperations);
      },
    });
  }

  private showDialog() {
    // let dialog = new Dialog({
    //     title: `SiYuan ${Constants.SIYUAN_VERSION}`,
    //     content: `<div id="helloPanel" class="b3-dialog__content"></div>`,
    //     width: this.isMobile ? "92vw" : "720px",
    //     destroyCallback() {
    //         // hello.$destroy();
    //     },
    // });
    // new HelloExample({
    //     target: dialog.element.querySelector("#helloPanel"),
    //     props: {
    //         app: this.app,
    //     }
    // });
    svelteDialog({
      title: `SiYuan ${Constants.SIYUAN_VERSION}`,
      width: this.isMobile ? "92vw" : "720px",
      constructor: (container: HTMLElement) => {
        return new HelloExample({
          target: container,
          props: {
            app: this.app,
          },
        });
      },
    });
  }

  private addMenu(rect?: DOMRect) {
    const menu = new Menu("topBarSample", () => {
      console.log(this.i18n.byeMenu);
    });
    menu.addItem({
      icon: "iconInfo",
      label: "Dialog(open help first)",
      accelerator: this.commands[0].customHotkey,
      click: () => {
        this.showDialog();
      },
    });
    if (!this.isMobile) {
      menu.addItem({
        icon: "iconFace",
        label: "Open Custom Tab",
        click: () => {
          const tab = openTab({
            app: this.app,
            custom: {
              icon: "iconFace",
              title: "Custom Tab",
              data: {
                text: "This is my custom tab",
              },
              id: this.name + TAB_TYPE,
            },
          });
          console.log(tab);
        },
      });
      menu.addItem({
        icon: "iconImage",
        label: "Open Asset Tab(open help first)",
        click: () => {
          const tab = openTab({
            app: this.app,
            asset: {
              path: "assets/paragraph-20210512165953-ag1nib4.svg",
            },
          });
          console.log(tab);
        },
      });
      menu.addItem({
        icon: "iconFile",
        label: "Open Doc Tab(open help first)",
        click: async () => {
          const tab = await openTab({
            app: this.app,
            doc: {
              id: "20200812220555-lj3enxa",
            },
          });
          console.log(tab);
        },
      });
      menu.addItem({
        icon: "iconSearch",
        label: "Open Search Tab",
        click: () => {
          const tab = openTab({
            app: this.app,
            search: {
              k: "SiYuan",
            },
          });
          console.log(tab);
        },
      });
      menu.addItem({
        icon: "iconRiffCard",
        label: "Open Card Tab",
        click: () => {
          const tab = openTab({
            app: this.app,
            card: {
              type: "all",
            },
          });
          console.log(tab);
        },
      });
      menu.addItem({
        icon: "iconLayout",
        label: "Open Float Layer(open help first)",
        click: () => {
          this.addFloatLayer({
            ids: ["20210428212840-8rqwn5o", "20201225220955-l154bn4"],
            defIds: ["20230415111858-vgohvf3", "20200813131152-0wk5akh"],
            x: window.innerWidth - 768 - 120,
            y: 32,
          });
        },
      });
      menu.addItem({
        icon: "iconOpenWindow",
        label: "Open Doc Window(open help first)",
        click: () => {
          openWindow({
            doc: { id: "20200812220555-lj3enxa" },
          });
        },
      });
    } else {
      menu.addItem({
        icon: "iconFile",
        label: "Open Doc(open help first)",
        click: () => {
          openMobileFileById(this.app, "20200812220555-lj3enxa");
        },
      });
    }
    menu.addItem({
      icon: "iconLock",
      label: "Lockscreen",
      click: () => {
        lockScreen(this.app);
      },
    });

    menu.addSeparator();
    menu.addItem({
      icon: "iconSettings",
      label: "Official Setting Dialog",
      click: () => {
        this.openSetting();
      },
    });
    menu.addItem({
      icon: "iconSettings",
      label: "A custom setting dialog (by svelte)",
      click: () => {
        this.openDIYSetting();
      },
    });
    menu.addItem({
      icon: "iconSparkles",
      label: this.data[STORAGE_NAME].readonlyText || "Readonly",
      type: "readonly",
    });
    if (this.isMobile) {
      menu.fullscreen();
    } else {
      menu.open({
        x: rect.right,
        y: rect.bottom,
        isLeft: true,
      });
    }
  }
}