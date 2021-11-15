import { Action, BehaviorStatus } from "../base/BehaviorTree";

export class LoggingAction extends Action {
  constructor(
    private message: string | (() => string),
    private returnStatus: BehaviorStatus = BehaviorStatus.SUCCESS
  ) {
    super();
  }
  update() {
    // console.log('LoggingAction : ', typeof this.message === 'function' ? this.message() : this.message);
    return this.returnStatus;
  }
}
