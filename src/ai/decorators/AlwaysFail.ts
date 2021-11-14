import { BehaviorStatus, Decorator } from '../base/BehaviorTree';


export class AlwaysFail extends Decorator {
  update() {
    this.child.update();
    return BehaviorStatus.FAILURE;
  }

  tick() {
    this.child.tick();
    return BehaviorStatus.FAILURE;
  }
}
