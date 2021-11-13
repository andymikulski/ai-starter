import Phaser, { GameObjects } from 'phaser';
import { Action, Behavior, BehaviorStatus, BehaviorTree, Composite, Condition } from '../ai/base/BehaviorTree';
import { FreshSequence, Sequence } from "./Sequence";
import { ActiveSelector, Selector } from "./Selector";
import { Item, LocalPlayer, rand } from '../main';
import { IncrementHealth } from "../ai/actions/IncrementHealth";
import { SetAmmo } from "../ai/actions/SetAmmo";
import { LinearMotionTowardsPosition } from "../ai/actions/LinearMotionTowardsPosition";
import { SetAnimationSpeed } from "./SetAnimationSpeed";
import { AccelerateAwayFromPosition } from "./AccelerateAwayFromPosition";
import { IsTargetWithinDistance } from "./IsTargetWithinDistance";
import { IsTargetActivelyMoving } from "./IsTargetActivelyMoving";
import { SetEmote } from "./SetEmote";
import { LoggingAction } from "../ai/utils/LoggingAction";
import { WaitMillisecondsAction } from "../ai/utils/WaitMillisecondsAction";
import { AdjustAmmoAction } from "./AdjustAmmoAction";
import { CheckAmmoLevel } from "../ai/conditions/CheckAmmoLevel";
import { Inverter } from "../ai/decorators/Inverter";
import Blackboard, { BlackboardObj } from '../ai/base/Blackboard';
import FogOfWar from './FogOfWar';
import { Parallel, ParallelPolicy } from './ParallelPolicy';
import { FailingAction, Throttle } from '../TomatoCrop';
import { GenericAction } from "../ai/utils/GenericAction";




class GrowFog extends Action {
  constructor(private self: NightFog, private blackboard: Blackboard) { super(); }
  update() {
    this.self.fog.growFog(0.05);
    return BehaviorStatus.SUCCESS;
  }
}

class ClearFog extends Action {
  constructor(private self: NightFog, private blackboard: Blackboard) { super(); }
  update() {
    const emitters = (this.blackboard.getTagged('gfx:clear-fog') || []) as Phaser.GameObjects.Components.Transform[];
    for (let i = 0; i < emitters.length; i++) {
      this.self.fog.reveal(emitters[i].x, emitters[i].y, emitters[i] instanceof LocalPlayer ? 12 : 32);
    }
    return BehaviorStatus.SUCCESS;
  }
}

class NightFog extends Sequence {
  public readonly fog: FogOfWar;

  constructor(private blackboard: Blackboard) {
    super();
    const scene = this.blackboard.get<Phaser.Scene>('scene');
    if (!scene) { throw new Error("No scene found when instantiating NightFog"); }

    this.blackboard.set('hasDaylight', true);
    const worldWidth = this.blackboard.get('worldWidth', 1024);
    const worldHeight = this.blackboard.get('worldHeight', 768);

    const fog = new FogOfWar(scene, worldWidth, worldHeight, 512, 0.0025);
    fog.fogColor = 0x111111;
    fog.fogTexture.setDepth(100000);
    this.fog = fog;

    let isDay = true;
    let lastSwitch = Date.now();
    let isVisible = !isDay;
    fog.fogTexture.alpha = isVisible ? 1 : 0;

    // console.log('it is day')

    this.children = [
      new GrowFog(this, this.blackboard),
      new GenericAction(() => {
        let now = Date.now();
        if (now - lastSwitch < 10_000) {
          return BehaviorStatus.SUCCESS;
        }
        lastSwitch = now;
        isDay = this.blackboard.get('hasDaylight');
        // console.log('it is currently:' + (isDay ? 'DAY' : 'NIGHT'), 'switching now!');
        this.blackboard.set('hasDaylight', !isDay)

        isVisible = isDay;

        const scene = this.fog.fogTexture.scene;
        scene.tweens.add({
          targets: this.fog.fogTexture,
          alpha: isVisible ? 0.5 : 0,
          ease: 'Linear',
          duration: 5000,
        });

        return isDay ? BehaviorStatus.FAILURE : BehaviorStatus.SUCCESS;
      }),
      new ClearFog(this, this.blackboard)
    ];
  }
}

export class LightingAI extends Phaser.GameObjects.GameObject {
  ai: BehaviorTree;
  fog: FogOfWar;


  // dayNight: DayNightCycle;

  constructor(scene: Phaser.Scene, private blackboard: Blackboard) {
    super(scene, 'lighting AI');
    // this.dayNight = new DayNightCycle(this.blackboard);
    // const worldWidth = this.blackboard.get('worldWidth', 1024);
    // const worldHeight = this.blackboard.get('worldHeight', 768);

    this.ai = new BehaviorTree(
      new Sequence([

        // new DayNightCycle(this.blackboard),
        new NightFog(this.blackboard),
      ])
    );
  }
}
