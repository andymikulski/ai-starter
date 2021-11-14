import Phaser from 'phaser';
import { BehaviorTree } from '../ai/base/BehaviorTree';
import throttle from '../utils/throttle';
import { Enemy } from '../game/Enemy';
import { Chicken } from '../game/Chicken';
import Blackboard from '../ai/base/Blackboard';
import { TomatoCrop } from '../game/TomatoCrop';
import { LocalPlayer, rand } from '../main';
import { Woodsman } from '../game/Woodsman';
import { ActualTree } from '../game/ActualTree';
import { Farmer } from '../game/Farmer';

export class MainGameScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'MainGame',
      active: true,
    });
  }

  private aiBlackboard: Blackboard;
  private aiTreeList: { ai: BehaviorTree; }[] = [];
  public registerBehavior = (obj: { ai: BehaviorTree }) => {
    this.aiTreeList.push(obj);
  };
  private enemies: Enemy[] = [];
  private player: LocalPlayer;

  preload = () => {
    this.load.image('mario', '/asset/image/nKgMvuj.png');
    this.load.image('background', '/asset/image/dzpw15B.png');
    this.load.image('fog-dot', '/asset/image/tehnIVH.png');

    this.load.atlas('env', 'asset/env.png', 'asset/env.json');
    this.load.atlas('bubbles', 'asset/bubbles.png', 'asset/bubbles.json');
    this.load.atlas('spritesheet', 'asset/spritesheet.png', 'asset/spritesheet.json');


    this.load.atlas('generic-avatar', 'asset/generic-avatar.png', 'asset/generic-avatar.json');
  };


  create = () => {
    this.cameras.main.zoom = 1;
    const worldWidth = this.scale.width * 4;
    const worldHeight = this.scale.height * 4;
    const bg = this.add.tileSprite(0, 0, worldWidth, worldHeight, 'env', 'Tiles-5').setOrigin(0, 0);

    this.aiBlackboard = new Blackboard();
    this.aiBlackboard.set('scene', this);
    this.aiBlackboard.set('worldWidth', worldWidth);
    this.aiBlackboard.set('worldHeight', worldHeight);

    this.input.mouse.disableContextMenu();
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    const lp = new LocalPlayer(this, worldWidth / 2, worldHeight / 2);
    const player = this.physics.add.existing(lp).setDisplaySize(32, 32).setCollideWorldBounds(true); // .setMaxVelocity(100, 100);
    this.player = player;
    this.aiBlackboard.tagObject(['humanoid', 'gfx:clear-fog'], player);

    this.input.keyboard.on('keydown', (key: KeyboardEvent) => {
      switch (key.key) {
        case 'w':
          this.physics.moveTo(this.player, this.player.x, this.player.y - 100, 250);
          break;
        case 's':
          this.physics.moveTo(this.player, this.player.x, this.player.y + 100, 250);
          break;
        case 'a':
          this.physics.moveTo(this.player, this.player.x - 100, this.player.y, 250);
          break;
        case 'd':
          this.physics.moveTo(this.player, this.player.x + 100, this.player.y, 250);
          break;
      }
    });


    this.cameras.main.startFollow(player, false, 0.01, 0.01);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    for (let i = 0; i < 100; i++) {
      const plant = new TomatoCrop(this, rand() * worldWidth, rand() * worldHeight, this.aiBlackboard);
      plant.growthStage = Math.floor(Math.random() * 5);
      this.physics.add.existing(plant).setCollideWorldBounds(true).setMaxVelocity(150, 150).setImmovable(false).setPushable(true);
      this.registerBehavior(plant);

      this.aiBlackboard.tagObject(['crop'], plant);
    }

    for (let i = 0; i < 100; i++) {
      const tree = new ActualTree(this, Math.random() * worldWidth, Math.random() * worldHeight, this.aiBlackboard);
      this.physics.add.existing(tree).setCollideWorldBounds(true).setMaxVelocity(150, 150).setImmovable(false).setPushable(true);
      this.aiBlackboard.tagObject(['tree', 'tree:grown'], tree);
      this.registerBehavior(tree);
    }

    for (let i = 0; i < 100; i++) {
      const chicken = new Chicken(this, Math.random() * worldWidth, Math.random() * worldHeight, player, this.aiBlackboard);
      chicken.setDisplaySize(32, 32).setDepth(10);
      this.physics.add.existing(chicken).setCollideWorldBounds(true).setMaxVelocity(150, 150).setImmovable(false).setPushable(true);
      this.registerBehavior(chicken);

      // this.aiBlackboard.tagObject(['emitter:light'], chicken);
    }

    for (let i = 0; i < 0; i++) {
      // continue;
      const enemy = new Enemy(this, Math.random() * worldWidth, Math.random() * worldHeight, player, this.aiBlackboard).setDisplaySize(32, 32).setDepth(10);
      this.physics.add.existing(enemy).setCollideWorldBounds(true).setMaxVelocity(75, 75).setImmovable(false).setPushable(true);
      this.enemies.push(enemy);
      this.registerBehavior(enemy);
      this.aiBlackboard.tagObject(['humanoid'], enemy);
    }



    for (let i = 0; i < 25; i++) {
      // continue;
      let npc;
      if ((Math.random() + Math.random() + Math.random()) / 3 > 0.5) {
        npc = new Woodsman(this, Math.random() * worldWidth, Math.random() * worldHeight, player, this.aiBlackboard).setDepth(10);
      } else {
        npc = new Farmer(this, Math.random() * worldWidth, Math.random() * worldHeight, player, this.aiBlackboard).setDepth(10);
      }

      this.sys.updateList.add(npc);

      this.physics.add.existing(npc).setCollideWorldBounds(true).setMaxVelocity(75, 75).setImmovable(false).setPushable(true);
      this.registerBehavior(npc);
      this.aiBlackboard.tagObject(['humanoid'], npc);
    }

    this.time.addEvent({
      loop: true,
      callback: this.updateAI,
    });
    this.time.addEvent({
      loop: true,
      callback: this.updateLocalAgent,
    });

    (window as any).step = this.updateAI;
  };

  update = (time: number, delta: number) => {
    super.update(time, delta);
    this.player.setDepth(this.player.y + (this.player.height));
    this.player.avatar.setDepth(this.player.avatar.y + (this.player.avatar.height));
  }

  updateLocalAgent = throttle(() => {
    this.player.ai?.tick();
  }, 1000 / 30); // 30fps

  updateAI = throttle(() => {
    for (let i = 0; i < this.aiTreeList.length; i++) {
      this.aiTreeList[i].ai.tick();
    }
  }, 1000 / 12); // 12fps - increasing this speed makes them appear smarter
}
