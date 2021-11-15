import { BehaviorStatus, Condition } from "../base/BehaviorTree";
import Blackboard from "../base/Blackboard";

export class HasDaylight extends Condition {
  constructor(private blackboard: Blackboard) {
    super();
  }
  update() {
    return this.blackboard.get("hasDaylight", true)
      ? BehaviorStatus.SUCCESS
      : BehaviorStatus.FAILURE;
  }
}
