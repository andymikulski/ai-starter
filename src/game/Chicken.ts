import Phaser, { GameObjects } from 'phaser';
import { BehaviorStatus, BehaviorTree } from '../ai/base/BehaviorTree';
import { FreshSequence } from "../ai/base/Sequence";
import { ActiveSelector } from "../ai/base/Selector";
import { LocalPlayer, rand } from '../main';
import { LinearMotionTowardsPosition } from "../ai/actions/LinearMotionTowardsPosition";
import { SetAnimationSpeed } from "../ai/actions/SetAnimationSpeed";
import { AccelerateAwayFromNearestTag } from "../ai/actions/AccelerateAwayFromNearestTag";
import { IsTagWithinDistance } from "../ai/conditions/IsTagWithinDistance";
import { SetEmote } from "../ai/actions/SetEmote";
import { WaitMillisecondsAction } from "../ai/utils/WaitMillisecondsAction";
import { Inverter } from "../ai/decorators/Inverter";
import Blackboard from '../ai/base/Blackboard';
import { TomatoCrop } from './TomatoCrop';
import { FailingAction } from "./FailingAction";
import { HasFoodNearby } from '../ai/conditions/HasFoodNearby';
import { getClosestFood } from '../ai/queries/getClosestFood';
import { GenericAction } from '../ai/utils/GenericAction';
import { getClosestLightSource } from '../ai/queries/getClosestLightSource';
import { HasDaylight } from '../ai/conditions/HasDaylight';

export class Chicken extends Phaser.Physics.Arcade.Image {
  avatar: Phaser.GameObjects.Sprite;
  emote: Phaser.GameObjects.Image;
  emoteBg: Phaser.GameObjects.Image;
  ai: BehaviorTree;
  constructor(scene: Phaser.Scene, x: number, y: number, player: LocalPlayer, private blackboard: Blackboard) {
    super(scene, x, y, 'mario');


    this.emoteBg = scene.add.image(0, 0, 'bubbles', 'round_speech_bubble').setDepth(10).setScale(3).setVisible(false);
    this.emote = scene.add.image(0, 0, 'bubbles', 'faceHappy').setDepth(20).setScale(3).setVisible(false);
    this.avatar = scene.add.sprite(0, 0, 'env', 'Chicken-1').setDepth(20).setDisplaySize(32, 32).setOrigin(0, 0);

    this.avatar.anims.create({
      key: 'ChickenAnim',
      frames: this.avatar.anims.generateFrameNames('env', {
        prefix: 'Chicken-',
        start: 0,
        end: 4,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 1,
      repeat: -1,
    });

    this.avatar.anims.play('ChickenAnim');

    this.ai = new BehaviorTree(
      new ActiveSelector([
        // Melee danger check
        new FreshSequence([
          // new LoggingAction('\Chicken: Is player too close?'),
          // If player is too close..
          // new IsTargetWithinDistance(this.body?.position ?? this, player.body, 100),
          new IsTagWithinDistance(this.body?.position ?? this, 'humanoid', 100, this.blackboard),
          // .. and they're moving around..
          // new IsTargetActivelyMoving(player.body as Phaser.Physics.Arcade.Body),
          // Startled! Run away!
          new SetEmote(this, 'alert'),
          // new LoggingAction('\Chicken: Player is too close, bail!'),
          new SetAnimationSpeed(this.avatar, 4),
          new AccelerateAwayFromNearestTag(this, 'humanoid', 125, 200, this.blackboard),
          new WaitMillisecondsAction(500),
        ]),


        // Night time? Go to nearby light source
        new FreshSequence([
          new Inverter(new HasDaylight(this.blackboard)),
          new LinearMotionTowardsPosition(this, () => {
            return getClosestLightSource(this.blackboard, this.body?.position ?? this, 2000);
          }, 128, 75),
          new FailingAction(),
        ]),

        // Find and eat nearby food
        new FreshSequence([
          new HasFoodNearby(this.blackboard, this.body?.position ?? this, 200),
          new SetEmote(this, 'exclamation'),
          new SetAnimationSpeed(this.avatar, 2),
          new LinearMotionTowardsPosition(this, () => {
            return getClosestFood(this.blackboard, this.body?.position ?? this, 200);
          }, 10, 100, true),
          // new LoggingAction('Chicken: Reached the food!'),
          new WaitMillisecondsAction(1000),
          new GenericAction(()=>{
            const closestFood = getClosestFood(this.blackboard, this.body?.position ?? this, 10) as TomatoCrop|null;
            if (!closestFood){ return BehaviorStatus.FAILURE; }
            // Reset tomato plant
            closestFood.ai.enabled = false;
            closestFood.growthStage = 0;
            closestFood.avatar.setTexture('env', 'TomatoSeeds');

            // This is bad, the plant itself should be responsible for handling being eaten
            this.blackboard.removeObjectTags(['food'], closestFood);
            setTimeout(()=>{
              closestFood.ai.enabled = true;
            }, 5000);

            return BehaviorStatus.SUCCESS;
          }),
          new SetAnimationSpeed(this.avatar, 1),
          new SetEmote(this, 'faceHappy'),
          // new LoggingAction('Chicken: FOOD ANNIHIALIATED'),
          new WaitMillisecondsAction(1000),
        ]),

        // Idle
        new FreshSequence([
          new SetEmote(this, null),
          new SetAnimationSpeed(this.avatar, 1),
          // new LoggingAction('\Chicken: Idling..'),
          new WaitMillisecondsAction(500),
          // Wander
          new LinearMotionTowardsPosition(this, () => {
            const pos = {x: this.body?.position.x || this.x, y: this.body?.position.y || this.y};
            pos.x += (Math.random() > 0.5 ? -1 : 1) * (rand() * 200);
            pos.y += (Math.random() > 0.5 ? -1 : 1) * (rand() * 200);

            pos.x %= this.blackboard.get('worldWidth', 1024);
            pos.y %= this.blackboard.get('worldHeight', 768);

            return pos;
          }, 20, 60),
          new WaitMillisecondsAction(500),
        ])
      ])
    );


    // Align the emote stuff with the physics body
    this.scene.physics.world.on('worldstep', () => {
      this.emote.x = this.body.x + 16;
      this.emote.y = this.body.y - 32;
      this.emoteBg.x = this.body.x + 16;
      this.emoteBg.y = this.body.y - 32;

      this.avatar.x = this.body.x;
      this.avatar.y = this.body.y;

      this.avatar.setDepth(this.avatar.y + (this.avatar.height));

      this.emoteBg.setDepth(this.avatar.depth);
      this.emote.setDepth(this.avatar.depth + 1);

      let wasFlipped = this.avatar.flipX;
      if (this.body.velocity.x === 0) {
        this.avatar.flipX = wasFlipped;
      } else {
        this.avatar.flipX = this.body.velocity.x < 0;
      }
    });
  }
}
