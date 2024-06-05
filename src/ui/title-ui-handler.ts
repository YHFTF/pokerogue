import BattleScene from "../battle-scene";
import { DailyRunScoreboard } from "./daily-run-scoreboard";
import OptionSelectUiHandler from "./settings/option-select-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";
import { TextStyle, addTextObject } from "./text";
import { getBattleCountSplashMessage, getSplashMessages } from "../data/splash-messages";
import i18next from "i18next";

export default class TitleUiHandler extends OptionSelectUiHandler {
  private titleContainer: Phaser.GameObjects.Container;
  private dailyRunScoreboard: DailyRunScoreboard;
  private playerCountLabel: Phaser.GameObjects.Text;
  private customLabel: Phaser.GameObjects.Text; //커스텀 레이블
  private splashMessage: string;
  private splashMessageText: Phaser.GameObjects.Text;

  private titleStatsTimer: NodeJS.Timeout;

  constructor(scene: BattleScene, mode: Mode = Mode.TITLE) {
    super(scene, mode);
  }

  setup() {
    super.setup();

    const ui = this.getUi();

    this.titleContainer = this.scene.add.container(0, -(this.scene.game.canvas.height / 6));
    this.titleContainer.setAlpha(0);
    ui.add(this.titleContainer);

    const logo = this.scene.add.image((this.scene.game.canvas.width / 6) / 2, 8, "logo");
    logo.setOrigin(0.5, 0);
    this.titleContainer.add(logo);

    this.dailyRunScoreboard = new DailyRunScoreboard(this.scene, 1, 44);
    this.dailyRunScoreboard.setup();

    this.titleContainer.add(this.dailyRunScoreboard);

    this.playerCountLabel = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 2, (this.scene.game.canvas.height / 6) - 109, `? ${i18next.t("menu:playersOnline")}`, TextStyle.MESSAGE, { fontSize: "54px" });
    this.playerCountLabel.setOrigin(1, 0);
    this.titleContainer.add(this.playerCountLabel);

    //커스텀 레이블은 plyaerCountLabel 바로 위에 위치
    this.customLabel = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 28, (this.scene.game.canvas.height / 6) - 113, "박영현 Github방문", TextStyle.SUMMARY_PINK, { fontSize: "54px" });
    this.customLabel.setOrigin(0.5, 0.5);
    this.customLabel;
    this.customLabel.setInteractive()
      .on("pointerover", function () {
        this.setStyle({ color:"green" });
      }, this.customLabel)
      .on("pointerout", function () {
        this.setStyle({ color:"#f89890" });
      }, this.customLabel)
      .on("pointerdown", function () {
        top.location.href = "https://github.com/YHFTF/pokerogue";
      });
    this.titleContainer.add(this.customLabel);
    this.scene.tweens.add({
      targets: this.customLabel,
      duration: Utils.fixedInt(900),
      scale: this.customLabel.scale * 1.1,
      loop: -1,
      yoyo: true,
    });
    //커스텀 레이블 끝

    this.splashMessageText = addTextObject(this.scene, logo.x + 64, logo.y + logo.displayHeight - 8, "", TextStyle.MONEY, { fontSize: "54px" });
    this.splashMessageText.setOrigin(0.5, 0.5);
    this.splashMessageText.setAngle(-20);
    this.titleContainer.add(this.splashMessageText);

    const originalSplashMessageScale = this.splashMessageText.scale;

    this.scene.tweens.add({
      targets: this.splashMessageText,
      duration: Utils.fixedInt(350),
      scale: originalSplashMessageScale * 1.25,
      loop: -1,
      yoyo: true,
    });
  }

  updateTitleStats(): void {
    Utils.apiFetch("game/titlestats")
      .then(request => request.json())
      .then(stats => {
        this.playerCountLabel.setText(`${stats.playerCount} ${i18next.t("menu:playersOnline")}`);
        if (this.splashMessage === getBattleCountSplashMessage()) {
          this.splashMessageText.setText(getBattleCountSplashMessage().replace("{COUNT}", stats.battleCount.toLocaleString("en-US")));
        }
      })
      .catch(err => {
        console.error("Failed to fetch title stats:\n", err);
      });
  }

  show(args: any[]): boolean {
    const ret = super.show(args);

    if (ret) {
      this.splashMessage = Utils.randItem(getSplashMessages());
      this.splashMessageText.setText(this.splashMessage.replace("{COUNT}", "?"));

      const ui = this.getUi();

      this.dailyRunScoreboard.update();

      this.updateTitleStats();

      this.titleStatsTimer = setInterval(() => this.updateTitleStats(), 60000);

      this.scene.tweens.add({
        targets: [ this.titleContainer, ui.getMessageHandler().bg ],
        duration: Utils.fixedInt(325),
        alpha: (target: any) => target === this.titleContainer ? 1 : 0,
        ease: "Sine.easeInOut"
      });
    }

    return ret;
  }

  clear(): void {
    super.clear();

    const ui = this.getUi();

    clearInterval(this.titleStatsTimer);
    this.titleStatsTimer = null;

    this.scene.tweens.add({
      targets: [ this.titleContainer, ui.getMessageHandler().bg ],
      duration: Utils.fixedInt(325),
      alpha: (target: any) => target === this.titleContainer ? 0 : 1,
      ease: "Sine.easeInOut"
    });
  }
}
