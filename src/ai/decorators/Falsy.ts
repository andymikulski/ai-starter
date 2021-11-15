import { BehaviorStatus, Decorator } from "../base/BehaviorTree";

export class Falsy extends Decorator {
  update() {
    const status = this.child.tick();
    return status === BehaviorStatus.SUCCESS
      ? BehaviorStatus.SUCCESS
      : BehaviorStatus.FAILURE;
  }
}
