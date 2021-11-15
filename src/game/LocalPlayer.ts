import Phaser from "phaser";
import { LinearMotionTowardsPosition } from "../ai/actions/LinearMotionTowardsPosition";
import { SetAnimation } from "../ai/actions/SetAnimation";
import { BehaviorTree } from "../ai/base/BehaviorTree";
import { Sequence } from "../ai/base/Sequence";
import { GotoBranch } from "../ai/utils/GotoBranch";
import throttle from "../utils/throttle";

export class LocalPlayer extends Phaser.Physics.Arcade.Image {
  avatar: Phaser.GameObjects.Sprite;
  ai: BehaviorTree;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "mario");
    this.avatar = scene.add
      .sprite(0, 0, "generic-avatar", "walk-0")
      .setDepth(2)
      .setDisplaySize(64, 64);

    const animDefs: {
      [key: string]: { start: number; end: number; prefix: string };
    } = {
      "walk-s": { start: 0, end: 7, prefix: "walk-" },
      "walk-n": { start: 8, end: 15, prefix: "walk-" },
      "walk-e": { start: 16, end: 23, prefix: "walk-" },
      "walk-w": { start: 24, end: 31, prefix: "walk-" },
      //
      "axe-s": { start: 0, end: 4, prefix: "axe-" },
      "axe-n": { start: 5, end: 9, prefix: "axe-" },
      "axe-e": { start: 10, end: 14, prefix: "axe-" },
      "axe-w": { start: 15, end: 19, prefix: "axe-" },
      //
      "hoe-s": { start: 0, end: 4, prefix: "hoe-" },
      "hoe-n": { start: 5, end: 9, prefix: "hoe-" },
      "hoe-e": { start: 10, end: 14, prefix: "hoe-" },
      "hoe-w": { start: 15, end: 19, prefix: "hoe-" },
      //
      "sword-s": { start: 0, end: 3, prefix: "sword-" },
      "sword-n": { start: 4, end: 7, prefix: "sword-" },
      "sword-e": { start: 8, end: 11, prefix: "sword-" },
      "sword-w": { start: 12, end: 15, prefix: "sword-" },
      //
      "water-s": { start: 0, end: 1, prefix: "water-" },
      "water-n": { start: 2, end: 3, prefix: "water-" },
      "water-e": { start: 4, end: 5, prefix: "water-" },
      "water-w": { start: 6, end: 7, prefix: "water-" },
      //
      "idle-s": { start: 0, end: 0, prefix: "walk-" },
      die: { start: 0, end: 1, prefix: "die-" },
    };

    for (const key in animDefs) {
      const { start, end, prefix } = animDefs[key];
      this.avatar.anims.create({
        key,
        frames: this.avatar.anims.generateFrameNames("generic-avatar", {
          prefix,
          start,
          end,
          suffix: "",
          zeroPad: 0,
        }),
        duration: 1000 / 2,
        repeat: -1,
      });
    }
    this.avatar.anims.play("idle-s");

    const normalMoveTree = (target: { x: number; y: number }) =>
      new BehaviorTree(
        new Sequence([
          new SetAnimation(this.avatar, "walk-s", true),
          new LinearMotionTowardsPosition(this, target, 5, 220),
          new GotoBranch(this, idleTree),
        ])
      );

    const idleTree = new BehaviorTree(
      new Sequence([new SetAnimation(this.avatar, "idle-s", true)])
    );

    this.ai = idleTree;

    const throttledPlayerInput = throttle((pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.ai = normalMoveTree({ x: pointer.worldX, y: pointer.worldY });
      }
    }, 1000 / 30);
    scene.input.on("pointermove", throttledPlayerInput);
    scene.input.on("pointerdown", throttledPlayerInput);

    this.avatar.setDepth(0);

    // Need to attach the avatar to the physics object - this is weird but seems like a req in phaser
    this.scene.physics.world.on("worldstep", () => {
      this.avatar.x = this.body.x;
      this.avatar.y = this.body.y;
      this.avatar.setDepth(this.avatar.y + this.avatar.height * 0.75);
    });

    this.avatar.setDepth(10);
  }
}
