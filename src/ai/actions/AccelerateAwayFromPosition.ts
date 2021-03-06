import Phaser from "phaser";
import { Action, BehaviorStatus } from "../base/BehaviorTree";

export class AccelerateAwayFromPosition extends Action {
  constructor(
    private self: Phaser.Physics.Arcade.Image,
    private target: { x: number; y: number },
    private targetDist: number = 100,
    private speed: number = 125
  ) {
    super();
  }
  update() {
    const dist = Phaser.Math.Distance.Between(
      this.self.body.x,
      this.self.body.y,
      this.target.x,
      this.target.y
    );
    if (dist > this.targetDist) {
      this.self.body.velocity.set(0, 0);
      return BehaviorStatus.SUCCESS;
    } else {
      const angle = Math.atan2(
        this.self.body.y - this.target.y,
        this.self.body.x - this.target.x
      );
      this.self.body.velocity.set(
        Math.cos(angle) * this.speed,
        Math.sin(angle) * this.speed
      );
      return BehaviorStatus.RUNNING;
    }
  }
  onInitialize() {
    super.onInitialize();
    this.self.setMaxVelocity(this.speed, this.speed);
  }
  onTerminate() {
    super.onTerminate();
    this.self.body.velocity.set(0, 0);
  }
}
