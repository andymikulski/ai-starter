import Phaser from 'phaser';
import { Action, BehaviorStatus } from '../base/BehaviorTree';




export class SetAnimation extends Action {
  constructor(private self: Phaser.GameObjects.Sprite, private animationKey: string, private ignoreIfAlreadyPlaying = true) {
    super();
  }
  update() {
    this.self.anims.play(this.animationKey, this.ignoreIfAlreadyPlaying);
    return BehaviorStatus.SUCCESS;
  }
}
