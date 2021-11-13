import { Action, BehaviorStatus, BehaviorTree } from '../base/BehaviorTree';

export class GotoBranch extends Action {
  constructor(private self: { ai: BehaviorTree; }, private target: BehaviorTree) {
    super();
  }
  update() {
    this.self.ai = this.target;
    return BehaviorStatus.SUCCESS;
  }
}
;
