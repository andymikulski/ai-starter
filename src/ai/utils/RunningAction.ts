import { Action, BehaviorStatus } from '../base/BehaviorTree';

export class RunningAction extends Action {
  constructor() {
    super();
  }
  update() {
    return BehaviorStatus.RUNNING;
  }
}
;
