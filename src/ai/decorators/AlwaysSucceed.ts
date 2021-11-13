import { BehaviorStatus, Decorator } from '../base/BehaviorTree';


export class AlwaysSucceed extends Decorator {
  update() {
    this.child.update();
    return BehaviorStatus.SUCCESS;
  }

  tick() {
    this.child.tick();
    return BehaviorStatus.SUCCESS;
  }
}
