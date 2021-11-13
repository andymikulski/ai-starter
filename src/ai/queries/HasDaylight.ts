import { BehaviorStatus, Condition } from './BehaviorTree';
import Blackboard from './Blackboard';


export class HasDaylight extends Condition {
  constructor(private blackboard: Blackboard) {
    super();
  }
  update() {
    return this.blackboard.get('hasDaylight', false) ? BehaviorStatus.SUCCESS : BehaviorStatus.FAILURE;
  }
}
