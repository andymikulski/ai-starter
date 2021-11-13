import { Action, BehaviorStatus } from '../base/BehaviorTree';


export class IncrementHealth extends Action {
  constructor(private entity: { health: number; }, private amount: number) {
    super();
  }
  onInitialize() {
    super.onInitialize();
    this.entity.health += this.amount;
  }
  update() {
    return BehaviorStatus.SUCCESS;
  }
}
;
