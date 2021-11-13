import Phaser from 'phaser';
import { Action, BehaviorStatus } from './BehaviorTree';


export class SetEmote extends Action {
  constructor(private self: { emoteBg: Phaser.GameObjects.Image; emote: Phaser.GameObjects.Image; }, private emote: string) {
    super();
  }
  update() {
    if (this.emote === null) {
      this.self.emote.setVisible(false).setActive(false);
      this.self.emoteBg.setVisible(false).setActive(false);
    } else {
      this.self.emote.setTexture('bubbles', this.emote);
      this.self.emote.setVisible(true).setActive(true);
      this.self.emoteBg.setVisible(true).setActive(true);
    }
    return BehaviorStatus.SUCCESS;
  }
}
;
