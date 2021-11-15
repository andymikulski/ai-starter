import Phaser from "phaser";
import { BehaviorStatus, Condition } from "../base/BehaviorTree";

export class IsTargetWithinDistance extends Condition {
  constructor(
    private self: { x: number; y: number },
    private target: { x: number; y: number },
    private maxDistance: number
  ) {
    super();
  }

  update() {
    const dist = Phaser.Math.Distance.Between(
      this.self.x,
      this.self.y,
      this.target.x,
      this.target.y
    );
    return dist <= this.maxDistance
      ? BehaviorStatus.SUCCESS
      : BehaviorStatus.FAILURE;
  }
}
