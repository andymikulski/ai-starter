import { Action, BehaviorStatus } from '../base/BehaviorTree';


export class AdjustAmmoAction extends Action {
  constructor(private target: { ammo: number; }, private amount: number) { super(); }
  onInitialize() {
    this.target.ammo += this.amount;
  }
  update() {
    return BehaviorStatus.SUCCESS;
  }
}
