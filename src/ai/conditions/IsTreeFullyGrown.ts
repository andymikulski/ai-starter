import { BehaviorStatus, Condition } from "../base/BehaviorTree";
import { TreeGrowthStatus } from "../../game/ActualTree";

export class IsTreeFullyGrown extends Condition {
  constructor(private self: { growthStage: TreeGrowthStatus }) {
    super();
  }
  update() {
    return this.self.growthStage === TreeGrowthStatus.Grown
      ? BehaviorStatus.SUCCESS
      : BehaviorStatus.FAILURE;
  }
}
