import Phaser from 'phaser';
import { Action, Behavior, BehaviorStatus, BehaviorTree, Condition, Decorator } from '../ai/base/BehaviorTree';
import { FreshSequence, Sequence } from "./Sequence";
import { ActiveSelector, Selector } from "./Selector";
import { Item, LocalPlayer, rand } from '../main';
import { IncrementHealth } from "../ai/actions/IncrementHealth";
import { SetAmmo } from "../ai/actions/SetAmmo";
import { LinearMotionTowardsPosition } from "../ai/actions/LinearMotionTowardsPosition";
import { SetAnimationSpeed } from "./SetAnimationSpeed";
import { AccelerateAwayFromPosition } from "./AccelerateAwayFromPosition";
import { IsTargetWithinDistance } from "./IsTargetWithinDistance";
import { IsTargetActivelyMoving } from "./IsTargetActivelyMoving";
import { SetEmote } from "./SetEmote";
import { LoggingAction } from "../ai/utils/LoggingAction";
import { WaitMillisecondsAction } from "../ai/utils/WaitMillisecondsAction";
import { AdjustAmmoAction } from "./AdjustAmmoAction";
import { CheckAmmoLevel } from "../ai/conditions/CheckAmmoLevel";
import { Inverter } from "../ai/decorators/Inverter";
import Blackboard from '../ai/base/Blackboard';
import { AddObjectTagToBlackboard, HasSunlight, RemoveObjectTagFromBlackboard, SetTextureAction } from '../TomatoCrop';


export class IsTreeFullyGrown extends Condition {
  constructor(private self: { growthStage: TreeGrowthStatus }) { super(); }
  update() {
    return this.self.growthStage === TreeGrowthStatus.Grown ? BehaviorStatus.SUCCESS : BehaviorStatus.FAILURE;
  }
}


class GoToNextGrowthStage extends Condition {
  constructor(private self: { growthStage: TreeGrowthStatus }) { super(); }
  update() {
    if (this.self.growthStage === TreeGrowthStatus.Grown) {
      return BehaviorStatus.FAILURE;
    }
    this.self.growthStage += 1;
    return BehaviorStatus.SUCCESS;
  }
}

enum TreeGrowthStatus {
  Chopped,
  Grown,
}


export class ActualTree extends Phaser.Physics.Arcade.Image {
  growthStage: TreeGrowthStatus = TreeGrowthStatus.Chopped;

  avatar: Phaser.GameObjects.Image;
  emote: Phaser.GameObjects.Image;
  emoteBg: Phaser.GameObjects.Image;
  ai: BehaviorTree;
  constructor(scene: Phaser.Scene, x: number, y: number, private blackboard: Blackboard) {
    super(scene, x, y, 'env', 'Tree');

    const treeType = Math.ceil(Math.random() * 2);
    this.avatar = scene.add.image(0, 0, 'spritesheet', 'Tree' +  treeType + '-Shadow').setDepth(2).setOrigin(0.5, 0.5).setDisplaySize(32, 32).setScale(3);

    this.avatar.setDepth(this.y + (this.avatar.height * 0.8))

    this.ai = new BehaviorTree(
      new ActiveSelector([
        new FreshSequence([
          new Inverter(new IsTreeFullyGrown(this)),
          new HasSunlight(this.blackboard),
          new WaitMillisecondsAction(() => 1000 + (Math.random() * 5000)),
          new GoToNextGrowthStage(this),
        ]),
        new FreshSequence([
          new IsTreeFullyGrown(this),
          new RemoveObjectTagFromBlackboard(this, this.blackboard, ['tree:stump']),
          new AddObjectTagToBlackboard(this, this.blackboard, ['tree:grown']),
          new SetTextureAction(this.avatar, 'spritesheet', 'Tree' + treeType + '-Shadow')
        ])
      ])
    );


    // Align the emote stuff with the physics body
    this.scene.physics.world.on('worldstep', () => {
      this.avatar.x = this.body.x;
      this.avatar.y = this.body.y;
      this.avatar.setDepth(this.avatar.y + (this.avatar.height * 0.75));

      let wasFlipped = this.avatar.flipX;
      if (this.body.velocity.x === 0) {
        this.avatar.flipX = wasFlipped;
      } else {
        this.avatar.flipX = this.body.velocity.x < 0;
      }
    });
  }
}
