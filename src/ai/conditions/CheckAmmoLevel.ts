import { BehaviorStatus, Condition } from "../base/BehaviorTree";

export class CheckAmmoLevel extends Condition {
  constructor(private target: { ammo: number }, private desiredAmount: number) {
    super();
  }
  update() {
    return this.target.ammo >= this.desiredAmount
      ? BehaviorStatus.SUCCESS
      : BehaviorStatus.FAILURE;
  }
}
