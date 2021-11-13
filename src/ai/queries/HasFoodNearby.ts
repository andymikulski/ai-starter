import Phaser from 'phaser';
import { BehaviorStatus, Condition } from './BehaviorTree';
import Blackboard from './Blackboard';


export class HasFoodNearby extends Condition {
  constructor(private blackboard: Blackboard, private position: { x: number; y: number; }, private maxDistance: number) { super(); }
  update() {
    const food = this.blackboard.getTagged('food') as Phaser.GameObjects.Components.Transform[];
    if (!food.length) { return BehaviorStatus.FAILURE; }

    let dist;
    let lowestDist = Infinity;
    for (let i = 0; i < food.length; i++) {
      dist = Phaser.Math.Distance.BetweenPoints(food[i], this.position);
      lowestDist = lowestDist < dist ? lowestDist : dist;
      if (dist <= this.maxDistance) { return BehaviorStatus.SUCCESS; }
    }
    return BehaviorStatus.FAILURE;
  }
}
