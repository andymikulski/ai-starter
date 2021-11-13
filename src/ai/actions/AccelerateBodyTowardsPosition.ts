import Phaser from 'phaser';
import { Action, BehaviorStatus } from './BehaviorTree';

class AccelerateBodyTowardsPosition extends Action {
  constructor(private self: Phaser.Physics.Arcade.Image, private target: { x: number; y: number; }, private range: number = 100) {
    super();
  }
  update() {
    const dist = Phaser.Math.Distance.Between(
      this.self.body.x, this.self.body.y,
      this.target.x, this.target.y
    );
    if (dist > this.range) {
      this.self.body.velocity.set(this.target.x - this.self.body.x, this.target.y - this.self.body.y);
      return BehaviorStatus.RUNNING;
    } else {
      return BehaviorStatus.SUCCESS;
    }
  }
  onTerminate() {
    super.onTerminate();
    this.self.body.velocity.set(0, 0);
  }
}
;