import Phaser from "phaser";
import { BehaviorStatus, Condition } from "../base/BehaviorTree";

export class IsTargetActivelyMoving extends Condition {
  constructor(private target: Phaser.Physics.Arcade.Body) {
    super();
  }

  update() {
    return this.target.speed >= 0.1
      ? BehaviorStatus.SUCCESS
      : BehaviorStatus.FAILURE;
  }
}
