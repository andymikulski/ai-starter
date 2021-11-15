import Phaser from "phaser";
import { Action, BehaviorStatus } from "../base/BehaviorTree";

export class SetAnimationSpeed extends Action {
  constructor(private self: Phaser.GameObjects.Sprite, private amt: number) {
    super();
  }

  update() {
    this.self.anims.timeScale = this.amt;
    return BehaviorStatus.SUCCESS;
  }
}
