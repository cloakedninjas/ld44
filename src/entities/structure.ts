import {GameObjects} from 'phaser';
import Scene = Phaser.Scene;
import {Hero} from './hero';
import TimerEvent = Phaser.Time.TimerEvent;

export class Structure extends GameObjects.Sprite {
  static EVENT_ATTACK: string = 'attack';
  placed: boolean;
  attackRange: number;
  canAttack: boolean;
  canPlace: boolean;
  attackTimer: TimerEvent;
  mapPosition: Vector2Like;

  constructor(scene: Scene, x: number, y: number, sprite, frame?) {
    super(scene, x, y, sprite, frame);

    this.canPlace = false;
    this.placed = false;
    this.attackRange = 0;
    this.refreshAttack();
  }

  place(x: number, y: number) {
    this.depth = this.y + (this.height * this.originY);

    this.placed = true;
    this.mapPosition = {x, y};
    this.disableInteractive();
  }

  trigger(hero: Hero) {
  }

  isHeroInRange(hero: Hero) {
    if (!hero.targetable) {
      return;
    }

    if (Math.abs(hero.mapPosition.x - this.mapPosition.x) < this.attackRange &&
      Math.abs(hero.mapPosition.y - this.mapPosition.y) < this.attackRange) {

      this.trigger(hero);
    }
  }

  refreshAttack() {
    this.canAttack = true;
  }
}
