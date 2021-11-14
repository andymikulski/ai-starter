
import Phaser from 'phaser';
import { BehaviorTree } from './ai/base/BehaviorTree';
import { RunningAction } from './ai/utils/RunningAction';
import { MainGameScene } from './scenes/MainGameScene';


export const rand = () => (Math.random() + Math.random() + Math.random()) / 3;

const game = new Phaser.Game({
  width: 1400,
  height: 900,
  backgroundColor: 0xa1e064,

  pixelArt: true,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  physics: {
    default: 'arcade',
    arcade: {
      // debug: true,
      gravity: {
        y: 0,
      }
    }
  },

  scene: MainGameScene
});



export function getMainScene() {
  return game.scene.getScene('MainGame') as MainGameScene;
}


export class LocalPlayer extends Phaser.Physics.Arcade.Image {
  avatar: Phaser.GameObjects.Sprite;
  ai: BehaviorTree;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'mario');
    this.avatar = scene.add.sprite(0, 0, 'generic-avatar', 'walk-0').setDepth(2).setDisplaySize(64, 64).setOrigin(0, 0);

    const animDefs: { [key: string]: { start: number; end: number; prefix: string; } } = {
      'walk-s': { start: 0, end: 7, prefix: 'walk-' },
      'walk-n': { start: 8, end: 15, prefix: 'walk-' },
      'walk-e': { start: 16, end: 23, prefix: 'walk-' },
      'walk-w': { start: 24, end: 31, prefix: 'walk-' },
      //
      'axe-s': { start: 0, end: 4, prefix: 'axe-' },
      'axe-n': { start: 5, end: 9, prefix: 'axe-' },
      'axe-e': { start: 10, end: 14, prefix: 'axe-' },
      'axe-w': { start: 15, end: 19, prefix: 'axe-' },
      //
      'hoe-s': { start: 0, end: 4, prefix: 'hoe-' },
      'hoe-n': { start: 5, end: 9, prefix: 'hoe-' },
      'hoe-e': { start: 10, end: 14, prefix: 'hoe-' },
      'hoe-w': { start: 15, end: 19, prefix: 'hoe-' },
      //
      'sword-s': { start: 0, end: 3, prefix: 'sword-' },
      'sword-n': { start: 4, end: 7, prefix: 'sword-' },
      'sword-e': { start: 8, end: 11, prefix: 'sword-' },
      'sword-w': { start: 12, end: 15, prefix: 'sword-' },
      //
      'water-s': { start: 0, end: 1, prefix: 'water-' },
      'water-n': { start: 2, end: 3, prefix: 'water-' },
      'water-e': { start: 4, end: 5, prefix: 'water-' },
      'water-w': { start: 6, end: 7, prefix: 'water-' },
      //
      'idle-s': { start: 0, end: 0, prefix: 'walk-' },
      'die': { start: 0, end: 1, prefix: 'die-' },
    };

    for (const key in animDefs) {
      const { start, end, prefix } = animDefs[key];
      this.avatar.anims.create({
        key,
        frames: this.avatar.anims.generateFrameNames('generic-avatar', {
          prefix,
          start,
          end,
          suffix: '',
          zeroPad: 0,
        }),
        duration: 1000 / 2,
        repeat: -1,
      });
    }

    this.avatar.anims.play('idle-s');
    this.avatar.anims.create({
      key: 'axe-s',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'axe-',
        start: 0,
        end: 4,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,
      repeat: -1,
    });

    this.avatar.anims.create({
      key: 'axe-n',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'axe-',
        start: 5,
        end: 9,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,
      repeat: -1,
    });

    this.avatar.anims.create({
      key: 'axe-e',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'axe-',
        start: 10,
        end: 14,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,
      repeat: -1,
    });

    this.avatar.anims.create({
      key: 'axe-w',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'axe-',
        start: 15,
        end: 19,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,
      repeat: -1,
    });

    this.avatar.anims.create({
      key: 'hoe-s',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'hoe-',
        start: 0,
        end: 4,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,
      repeat: -1,
    });

    this.avatar.anims.create({
      key: 'hoe-n',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'hoe-',
        start: 5,
        end: 9,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,
      repeat: -1,
    });

    this.avatar.anims.create({
      key: 'hoe-e',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'hoe-',
        start: 10,
        end: 14,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,
      repeat: -1,
    });

    this.avatar.anims.create({
      key: 'hoe-w',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'hoe-',
        start: 15,
        end: 19,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,
      repeat: -1,
    });

    this.avatar.anims.create({
      key: 'die',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'die-',
        start: 0,
        end: 1,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,
      repeat: -1,
    });

    this.avatar.anims.create({
      key: 'sword-s',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'sword-',
        start: 0,
        end: 3,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,

    });

    this.avatar.anims.create({
      key: 'sword-s',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'sword-',
        start: 0,
        end: 3,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,

    });

    this.avatar.anims.create({
      key: 'sword-n',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'sword-',
        start: 4,
        end: 7,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,

    });

    this.avatar.anims.create({
      key: 'sword-e',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'sword-',
        start: 8,
        end: 11,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,

    });

    this.avatar.anims.create({
      key: 'sword-w',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'sword-',
        start: 12,
        end: 15,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,

    });

    this.avatar.anims.create({
      key: 'water-s',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'water-',
        start: 0,
        end: 1,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,
      repeat: -1,
    });

    this.avatar.anims.create({
      key: 'water-n',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'water-',
        start: 2,
        end: 3,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,
      repeat: -1,
    });

    this.avatar.anims.create({
      key: 'water-e',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'water-',
        start: 4,
        end: 5,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,
      repeat: -1,
    });

    this.avatar.anims.create({
      key: 'water-w',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'water-',
        start: 6,
        end: 7,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 2,
      repeat: -1,
    });

    this.avatar.anims.create({
      key: 'idle-s',
      frames: this.avatar.anims.generateFrameNames('generic-avatar', {
        prefix: 'walk-',
        start: 0,
        end: 0,
        suffix: '',
        zeroPad: 0,
      }),
      duration: 1000 / 1,
      repeat: -1,
    });

    this.avatar.anims.play('walk-s');


    this.avatar.setDepth(0);

    this.scene.physics.world.on('worldstep', () => {
      this.avatar.x = this.body.x;
      this.avatar.y = this.body.y;
      this.avatar.setDepth(this.avatar.y + (this.avatar.height * 0.75));
    });


    this.avatar.setDepth(10);
  }
}
