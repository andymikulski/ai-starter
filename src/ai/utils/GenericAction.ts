import { Action, BehaviorStatus } from '../base/BehaviorTree';


export class GenericAction extends Action {
  constructor(private fn: () => BehaviorStatus) { super(); }
  update() {
    return this.fn();
  }
}
