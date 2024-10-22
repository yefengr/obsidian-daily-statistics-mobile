import {
  debounce,
  type Debouncer,
  MarkdownView,
  Plugin,
  TFile} from "obsidian";
import { DailyStatisticsSettings } from "@/data/Settting";
import { DailyStatisticsDataManagerInstance } from "@/data/StatisticsDataManager";
import { SampleSettingTab } from "@/ui/setting/SampleSettingTab";
import i18n from "simplest-i18n";
import { i18nG } from "@/globals";



/**
 * 插件核心类
 */
export default class DailyStatisticsPlugin extends Plugin {
  settings!: DailyStatisticsSettings;
  debouncedUpdate!: Debouncer<[contents: string, filepath: string], void>;
  private statusBarItemEl!: HTMLElement;


  async onload() {
    // 然后在某个地方初始化 i18nInstance


    await this.loadSettings();


    DailyStatisticsDataManagerInstance.init(
      this.settings.dataFile,
      this.app,
      this
    );
    DailyStatisticsDataManagerInstance.loadStatisticsData().then(() => {
      // console.info("loadStatisticsData success. ");
      i18nG.instance = i18n({
        locale: this.settings.language,
        locales: [
          "zh-cn",
          "en"
        ]
      });


    });
    this.debouncedUpdate = debounce(
      (contents: string, filepath: string) => {
        // // console.info("debounce updateWordCount" + filepath);
        if (
          this.settings.statisticsFolder != null &&
          this.settings.statisticsFolder != "" &&
          this.settings.statisticsFolder != "/"
        ) {
          // 检查路径是否匹配
          if (!filepath.match(this.settings.statisticsFolder)) {
            // console.log("文件路径不匹配，不统计" + filepath);
            return;
          }
        }
        DailyStatisticsDataManagerInstance.updateWordCount(contents, filepath);
      },
      400,
      false
    );




    // 在快速预览时，更新统计数据
    this.registerEvent(
      this.app.workspace.on("quick-preview", this.onQuickPreview.bind(this))
    );

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this));

  }


  onunload() {
    // this.statusBarItemEl.remove()

  }


  // 重新加载
  async languageChange() {
    i18nG.instance = i18n({
      locale: this.settings.language,
      locales: [
        "zh-cn",
        "en"
      ]
    });

  }

  // async activateView() {
  //   const { workspace } = this.app;
  //
  //   let leaf: WorkspaceLeaf | null = null;
  //   const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);
  //
  //   if (leaves.length > 0) {
  //     // A leaf with our view already exists, use that
  //     leaf = leaves[0];
  //   } else {
  //     // Our view could not be found in the workspace, create a new leaf
  //     // in the right sidebar for it
  //     leaf = workspace.getRightLeaf(false);
  //     if (leaf == null) {
  //       console.error("leaf is null");
  //       return;
  //     }
  //     await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
  //   }
  //
  //   // "Reveal" the leaf in case it is in a collapsed sidebar
  //   workspace.revealLeaf(leaf);
  // }




  async loadSettings() {
    this.settings = Object.assign(
      {},
      new DailyStatisticsSettings(),
      await this.loadData()
    );
  }

  // 保存配置文件
  async saveSettings() {
    // 先获取最新的数据，再将新的配置保存进去
    let data = await this.loadData();
    if (data == null) {
      data = new DailyStatisticsSettings();
    }
    Object.assign(data, this.settings);
    await this.saveData(data);
  }

  // 在预览时更新统计字数
  onQuickPreview(file: TFile, contents: string) {
    if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
      this.debouncedUpdate(contents, file.path);
    }
  }
}



