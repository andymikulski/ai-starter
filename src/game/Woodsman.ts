import Phaser from "phaser";
import {
  BehaviorStatus,
  BehaviorTree,
  Condition,
} from "../ai/base/BehaviorTree";
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
import Blackboard from "../ai/base/Blackboard";
import { ActualTree } from "./ActualTree";

export class HasTreeNearby extends Condition {
  constructor(
    private blackboard: Blackboard,
    private position: { x: number; y: number },
    private maxDistance: number
  ) {
    super();
  }
  update() {
    const food = this.blackboard.getTagged(
      "tree:grown"
    ) as Phaser.GameObjects.Components.Transform[];
    if (!food.length) {
      return BehaviorStatus.FAILURE;
    }

    let dist;
    let lowestDist = Infinity;
    for (let i = 0; i < food.length; i++) {
      dist = Phaser.Math.Distance.BetweenPoints(food[i], this.position);
      lowestDist = lowestDist < dist ? lowestDist : dist;
      if (dist <= this.maxDistance) {
        return BehaviorStatus.SUCCESS;
      }
    }
    return BehaviorStatus.FAILURE;
  }
}

export const getClosestTree = (
  blackboard: Blackboard,
  position: { x: number; y: number },
  maxDistance: number
): null | Phaser.GameObjects.Components.Transform => {
  const food = blackboard.getTagged(
    "tree:grown"
  ) as Phaser.GameObjects.Components.Transform[];
  if (!food.length) {
    return null;
  }

  let dist;
  let closestDist = Infinity;
  let nearestFood = null;
  for (let i = 0; i < food.length; i++) {
    dist = Phaser.Math.Distance.BetweenPoints(food[i], position);

    if (dist > closestDist || dist > maxDistance) {
      continue;
    }
    if (dist < closestDist) {
      closestDist = dist;
      nearestFood = food[i];
    }
  }

  return nearestFood;
};

export class Woodsman extends Phaser.Physics.Arcade.Image {
  private _numLogsCollected: number = 0;
  public get numLogsCollected(): number {
    return this._numLogsCollected;
  }
  public set numLogsCollected(v: number) {
    this._numLogsCollected = v;
    this.numLogsCollectedDisplay.setText("Logs: " + this._numLogsCollected);
  }

  numLogsCollectedDisplay: Phaser.GameObjects.Text;
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
      .setTint(0x8a3324);

    this.defineSpriteAnimations();
    this.avatar.anims.play("idle-s");

    this.numLogsCollectedDisplay = scene.add
      .text(0, 0, "Logs: " + this.numLogsCollected, {
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

        // Have logs; build house
        new FreshSequence([
          new GenericAction(() => {
            return this.numLogsCollected >= 3
              ? BehaviorStatus.SUCCESS
              : BehaviorStatus.FAILURE;
          }),
          new SetAnimation(this.avatar, "walk-s"),
          new LinearMotionTowardsPosition(
            this,
            () => ({
              x: Math.random() * this.scene.scale.width,
              y: Math.random() * this.scene.scale.height,
            }),
            20,
            150
          ),
          new SetAnimation(this.avatar, "sword-e"),
          new GenericAction(() => {
            this.numLogsCollected = 0;
            const houseKey = "House" + (((Math.random() * 10) | 0) + 1);
            const house = scene.add
              .image(this.x, this.y, "spritesheet", houseKey)
              .setScale(2.5);

            this.blackboard.tagObject(
              ["emitter:light", "gfx:clear-fog"],
              house
            );

            house.setDepth(house.y + house.height * 0.5);

            house.setScale(0.4 + rand() / 2, 0.6 + rand() / 2);
            scene.tweens.add({
              targets: house,
              props: {
                scaleY: 2.5,
              },
              ease: Phaser.Math.Easing.Bounce.Out,
              duration: 1500,
            });

            scene.tweens.add({
              targets: house,
              props: {
                scaleX: 2.5,
              },
              ease: Phaser.Math.Easing.Bounce.Out,
              duration: 1250,
            });

            return BehaviorStatus.SUCCESS;
          }),
        ]),

        // Chop down tree
        new FreshSequence([
          new HasTreeNearby(this.blackboard, this.body?.position ?? this, 300),
          new SetAnimation(this.avatar, "walk-s"),
          new LinearMotionTowardsPosition(
            this,
            () => {
              return getClosestTree(
                this.blackboard,
                this.body?.position ?? this,
                300
              );
            },
            10,
            75,
            true
          ),
          new SetAnimation(this.avatar, "axe-w"),
          new WaitMillisecondsAction(1000),
          new GenericAction(() => {
            const tree = getClosestTree(
              this.blackboard,
              this.body?.position ?? this,
              10
            ) as ActualTree | null;
            if (!tree) {
              return BehaviorStatus.FAILURE;
            }
            // Reset tomato tree
            tree.ai.enabled = false;
            tree.growthStage = 0;
            tree.avatar.setTexture("spritesheet", "Tree1-Stump");

            // This is bad, the tree itself should be responsible for handling being eaten
            this.blackboard.removeObjectTags(["tree:grown"], tree);
            this.blackboard.tagObject(["tree:stump"], tree);

            setTimeout(() => {
              tree.ai.enabled = true;
            }, 20_000);
            return BehaviorStatus.SUCCESS;
          }),
          new SetAnimation(this.avatar, "idle-s"),
          new GenericAction(() => {
            this.numLogsCollected += 1;
            return BehaviorStatus.SUCCESS;
          }),
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
      this.numLogsCollectedDisplay.x = this.body.x + 1;
      this.numLogsCollectedDisplay.y = this.body.y - 15;
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
