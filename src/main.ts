import Phaser from "phaser";
import { RunningAction } from "./ai/utils/RunningAction";
import { MainGameScene } from "./scenes/MainGameScene";

export const rand = () => (Math.random() + Math.random() + Math.random()) / 3;

const game = new Phaser.Game({
  width: 1400,
  height: 900,
  backgroundColor: 0xa1e064,

  pixelArt: true,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  physics: {
    default: "arcade",
    arcade: {
      // debug: true,
      gravity: {
        y: 0,
      },
    },
  },

  scene: MainGameScene,
});

export function getMainScene() {
  return game.scene.getScene("MainGame") as MainGameScene;
}
