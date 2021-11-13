import { Action, BehaviorStatus } from '../base/BehaviorTree';

export class SetAmmo extends Action {
  constructor(private entity: { ammo: number; }, private amount: number) {
    super();
  }
  onInitialize() {
    super.onInitialize();
    this.entity.ammo = Math.max(0, this.amount);
  }
  update() {
    return BehaviorStatus.SUCCESS;
  }
}
;
