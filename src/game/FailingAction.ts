import { Action, BehaviorStatus } from "../ai/base/BehaviorTree";

export class FailingAction extends Action {
  update() {
    return BehaviorStatus.FAILURE;
  }
}
