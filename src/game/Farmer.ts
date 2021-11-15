import Phaser from "phaser";
import { BehaviorStatus, BehaviorTree } from "../ai/base/BehaviorTree";
import { FreshSequence } from "../ai/base/Sequence";
import { ActiveSelector } from "../ai/base/Selector";
import { rand } from "../main";
import { LocalPlayer } from "./LocalPlayer";
import { LinearMotionTowardsPosition } from "../ai/actions/LinearMotionTowardsPosition";
import { SetAnimation } from "../ai/actions/SetAnimation";
import { AccelerateAwayFromPosition } from "../ai/actions/AccelerateAwayFromPosition";
import { IsTargetWithinDistance } from "../ai/conditions/IsTargetWithinDistance";
import { LoggingAction } from "../ai/utils/LoggingAction";
import { WaitMillisecondsAction } from "../ai/utils/WaitMillisecondsAction";
import { GenericAction } from "../ai/utils/GenericAction";
import { getClosestFood } from "../ai/queries/getClosestFood";
import { HasFoodNearby } from "../ai/conditions/HasFoodNearby";
import Blackboard from "../ai/base/Blackboard";
import { TomatoCrop } from "./TomatoCrop";

export class Farmer extends Phaser.Physics.Arcade.Image {
  private _numTomatoesCollected: number = 0;
  public get numTomatoesCollected(): number {
    return this._numTomatoesCollected;
  }
  public set numTomatoesCollected(v: number) {
    this._numTomatoesCollected = v;
    this.numTomatoesCollectedDisplay.setText(
      "Tomatoes: " + this._numTomatoesCollected
    );
  }

  numLogsCollectedDisplay: Phaser.GameObjects.Text;
  numTomatoesCollectedDisplay: Phaser.GameObjects.Text;
  avatar: Phaser.GameObjects.Sprite;

  ai: BehaviorTree;
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    player: LocalPlayer,
    private blackboard: Blackboard
  ) {
    super(scene, x, y, "env");

    this.avatar = scene.add
      .sprite(0, 0, "generic-avatar", "walk-0")
      .setOrigin(0, 0)
      .setDisplaySize(64, 64)
      .setTint(0xa1e064);

    this.defineSpriteAnimations();
    this.avatar.anims.play("idle-s");

    this.numTomatoesCollectedDisplay = scene.add
      .text(0, 0, "Tomatoes: " + this.numTomatoesCollected, {
        color: "#000",
        backgroundColor: "rgba(255,255,255,0.3)",
      })
      .setDepth(10);

    this.ai = new BehaviorTree(
      new ActiveSelector([
        // Melee danger check
        new FreshSequence([
          new LoggingAction("\tWoodsman: Is player within melee range?"),
          // If player is in melee range, bail
          new IsTargetWithinDistance(
            this.body?.position ?? this,
            player.body,
            75
          ),
          new AccelerateAwayFromPosition(this, player, 125),
        ]),

        // Find and pick tomatoes
        new FreshSequence([
          new HasFoodNearby(this.blackboard, this.body?.position ?? this, 300),
          new SetAnimation(this.avatar, "walk-e"),
          new LinearMotionTowardsPosition(
            this,
            () => {
              return getClosestFood(
                this.blackboard,
                this.body?.position ?? this,
                300
              );
            },
            10,
            100,
            true
          ),
          new SetAnimation(this.avatar, "hoe-w"),
          // new LoggingAction('Chicken: Reached the food!'),
          new WaitMillisecondsAction(1000),
          new GenericAction(() => {
            const closestFood = getClosestFood(
              this.blackboard,
              this.body?.position ?? this,
              10
            ) as TomatoCrop | null;
            if (!closestFood) {
              return BehaviorStatus.FAILURE;
            }
            // Reset tomato plant
            closestFood.ai.enabled = false;
            closestFood.growthStage = 0;
            closestFood.avatar.setTexture("env", "TomatoSeeds");

            // This is bad, the plant itself should be responsible for handling being eaten
            this.blackboard.removeObjectTags(["food"], closestFood);
            setTimeout(() => {
              closestFood.ai.enabled = true;
            }, 3000);

            return BehaviorStatus.SUCCESS;
          }),
          new GenericAction(() => {
            this.numTomatoesCollected += 1;
            return BehaviorStatus.SUCCESS;
          }),
          new SetAnimation(this.avatar, "idle-s"),
          // new LoggingAction('Chicken: FOOD ANNIHIALIATED'),
          new WaitMillisecondsAction(1000),
        ]),

        // Idle
        new FreshSequence([
          new SetAnimation(this.avatar, "idle-s"),
          new WaitMillisecondsAction(() => Math.random() * 1000),
          new SetAnimation(this.avatar, "walk-s"),
          new LinearMotionTowardsPosition(
            this,
            () => {
              const pos = {
                x: this.body?.position.x || this.x,
                y: this.body?.position.y || this.y,
              };
              pos.x += (Math.random() > 0.5 ? -1 : 1) * (rand() * 50);
              pos.y += (Math.random() > 0.5 ? -1 : 1) * (rand() * 50);

              return pos;
            },
            5,
            60
          ),
          new SetAnimation(this.avatar, "idle-s"),
          new WaitMillisecondsAction(() => Math.random() * 1000),
        ]),
      ])
    );

    // Align the emote stuff with the physics body
    this.scene.physics.world.on("worldstep", () => {
      this.avatar.x = this.body.x + 1;
      this.avatar.y = this.body.y - 15;

      this.numTomatoesCollectedDisplay.x = this.body.x + 1;
      this.numTomatoesCollectedDisplay.y = this.body.y - 15;
    });
  }

  private defineSpriteAnimations() {
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
  }
}
