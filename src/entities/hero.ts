import {GameObjects, Scene} from 'phaser';
import Path = Phaser.Curves.Path;
import TimerEvent = Phaser.Time.TimerEvent;
import {Bar} from '../lib/bar';

export class Hero extends GameObjects.Sprite {
  static MOVE_SPEED: number = 0.4;
  static MOVE_SPEED_SLOW: number = 0.2;
  static SLOW_RECOVERY_TIME: number = 3500;
  static STAMINA_DRAIN_WALK: number = 0.05;
  static STAMINA_DRAIN_ATTACK: number = 6;
  static STAMINA_DRAIN_TOWER: number = 3;
  static ATTACK_DELAY: number = 1000;
  static ATTACK_MIN_DAMAGE: number = 6;
  static ATTACK_MAX_DAMAGE: number = 9;

  static ACTION_WALKING: number = 1;
  static ACTION_ATTACKING: number = 2;
  static ACTION_LEAVING: number = 3;
  static ACTION_DYING: number = 4;

  static EVENT_ATTACK: string = 'attack';

  path: Path;
  follower: any;
  health: number;
  stamina: number;
  mapPosition: Vector2Like;
  slowed: boolean;
  targetable: boolean;
  slowTimer: TimerEvent;
  action: number;
  healtBar: Bar;
  staminaBar: Bar;
  sounds: Record<string, Phaser.Sound.BaseSound>;

  constructor(scene: Scene, x: number, y: number, path: Path) {
    super(scene, x, y, 'hero-down-walk');

    this.anims.play('hero-down-walk');

    this.setOrigin(0.5, 0.75);
    this.follower = {t: 0, vec: new Phaser.Math.Vector2()};
    this.path = path;
    this.health = 100;
    this.stamina = 100;
    this.slowed = false;
    this.targetable = true;
    this.action = Hero.ACTION_WALKING;
    this.mapPosition = {
      x: 0,
      y: 0
    };

    this.healtBar = new Bar(scene, {
      fillColour: 0xff0000,
      fillPercent: 1,
      width: this.width,
      height: 10
    });

    this.scene.add.existing(this.healtBar);

    this.staminaBar = new Bar(scene, {
      fillColour: 0xffff00,
      fillPercent: 1,
      width: this.width,
      height: 10
    });

    this.scene.add.existing(this.staminaBar);

    this.sounds = {
      'hero-teleport': this.scene.sound.add('hero-teleport'),
      'player-hit-1': this.scene.sound.add('player-ouch-1'),
      'player-hit-2': this.scene.sound.add('player-ouch-2'),
    };

    for (let i = 1; i <= 4; i++) {
      this.sounds['hero-death-' + i] = this.scene.sound.add('hero-death-' + i);
    }

    this.resetSlowTimer();
  }

  startOnPath() {
    this.follower.t = 0;

    // get x and y of the given t point
    this.path.getPoint(this.follower.t, this.follower.vec);

    // set the x and y of our enemy to the received from the previous step
    this.setPosition(this.follower.vec.x, this.follower.vec.y);
  }

  update(time, delta, x, y) {
    switch (this.action) {
      case Hero.ACTION_WALKING:
        let walkSpeed;

        this.mapPosition.x = x;
        this.mapPosition.y = y;

        if (this.slowed) {
          walkSpeed = (Hero.MOVE_SPEED_SLOW / 10000) * delta;
        } else {
          walkSpeed = (Hero.MOVE_SPEED / 10000) * delta;
        }

        if (this.stamina > 0) {
          this.reduceStamina(Hero.STAMINA_DRAIN_WALK);

          this.follower.t += walkSpeed;

          // set the new x and y coordinates in vec
          this.path.getPoint(this.follower.t, this.follower.vec);

          // update enemy x and y to the newly obtained x and y
          this.setPosition(this.follower.vec.x, this.follower.vec.y);
          this.depth = this.y + (this.height * this.originY);

          this.healtBar.x = this.x - (this.width * this.originX);
          this.healtBar.y = this.y - (this.height * this.originY) - 20;
          this.healtBar.depth = this.depth;

          this.staminaBar.x = this.x - (this.width * this.originX);
          this.staminaBar.y = this.y - (this.height * this.originY) - 10;
          this.staminaBar.depth = this.depth;

          // we have reached the end of the path
          if (this.follower.t >= 1) {
            this.action = Hero.ACTION_ATTACKING;
          } else {
            let nextPoint = this.path.getPoint(this.follower.t + walkSpeed);

            if (nextPoint) {
              if (nextPoint.x > this.x) {
                if (this.anims.currentAnim.key !== 'hero-side-walk') {
                  this.flipX = true;
                  this.anims.play('hero-side-walk');
                }
              } else if (nextPoint.x < this.x) {
                if (this.anims.currentAnim.key !== 'hero-side-walk') {
                  this.flipX = false;
                  this.anims.play('hero-side-walk');
                }
              } else {
                if (this.anims.currentAnim.key !== 'hero-down-walk') {
                  this.flipX = false;
                  this.anims.play('hero-down-walk');
                }
              }
            }
          }
        } else {
          this.action = Hero.ACTION_LEAVING;
        }
        break;

      case Hero.ACTION_ATTACKING:
        if (this.anims.currentAnim.key !== 'hero-attack') {
          this.tryToAttack();
        }
        break;

      case Hero.ACTION_LEAVING:
        if (this.anims.currentAnim.key !== 'hero-teleport') {
          this.anims.play('hero-teleport');
          this.sounds['hero-teleport'].play();

          this.on('animationcomplete', () => {
            this.destroyBars();
            this.setTintFill(0xfbb040, 0xfbb040, 0xffffff, 0xffffff);

            this.scene.tweens.add({
              targets: this,
              alphaBottomLeft: 0,
              alphaBottomRight: 0,
              ease: 'Quad.easeIn',
              duration: 500
            });

            this.scene.tweens.add({
              targets: this,
              alphaTopLeft: 0,
              alphaTopRight: 0,
              ease: 'Quad.easeIn',
              duration: 500,
              delay: 500,
              onComplete: this.onTeleport.bind(this),
            });
          }, this);
        }

        break;

      case Hero.ACTION_DYING:
        if (this.anims.currentAnim.key !== 'hero-death') {
          this.anims.play('hero-death');

          this.on('animationcomplete', () => {
            this.targetable = false;

            // fade body out
            this.scene.tweens.add({
              targets: this,
              alpha: 0,
              ease: 'Quad.easeIn',
              duration: 1500,
              delay: 300,
              onComplete: () => {
                this.destroy();
              },
            });
          });
        }
        break;
    }
  }

  damage(dmg: number): number {
    let damageDealt = 0;

    if (this.health > 0) {
      this.health -= dmg;

      damageDealt = Math.min(this.health, dmg);
      this.healtBar.setValue(this.health / 100);

      if (this.health <= 0) {
        this.action = Hero.ACTION_DYING;
        this.destroyBars();

        if (Math.random() > 0.95) {
          this.sounds['hero-death-4'].play();
        } else {
          this.sounds['hero-death-' + Phaser.Math.Between(1, 3)].play();
        }
      }
    }

    return damageDealt;
  }

  slow() {
    this.slowed = true;
    this.resetSlowTimer();
    this.reduceStamina(Hero.STAMINA_DRAIN_TOWER);
    this.slowTimer.paused = false;
  }

  resetSlowTimer() {
    if (this.slowTimer) {
      this.slowTimer.destroy();
    }

    this.slowTimer = this.scene.time.addEvent({
      delay: Hero.SLOW_RECOVERY_TIME, callback: this.removeSlow, callbackScope: this, paused: true, loop: true
    });
  }

  removeSlow() {
    this.slowed = false;
  }

  tryToAttack() {
    if (this.stamina >= Hero.STAMINA_DRAIN_ATTACK) {

      // delay SFX but a bit
      this.scene.time.addEvent({
        delay: 300, callback: () => {
          this.sounds['player-hit-' + Phaser.Math.Between(1,2)].play();

          this.emit(Hero.EVENT_ATTACK, {
            damage: Phaser.Math.Between(Hero.ATTACK_MIN_DAMAGE, Hero.ATTACK_MAX_DAMAGE)
          });
        }
      });

      this.anims.play('hero-attack', true);

      this.reduceStamina(Hero.STAMINA_DRAIN_ATTACK);

      this.scene.time.addEvent({
        delay: Hero.ATTACK_DELAY, callback: this.tryToAttack, callbackScope: this
      });
    } else {
     this.action = Hero.ACTION_LEAVING;
    }
  }

  reduceStamina(staminaDrain: number) {
    this.stamina -= staminaDrain;
    this.staminaBar.setValue(this.stamina / 100);
  }

  onTeleport() {
    this.destroy();
  }

  destroy(fromScene?: boolean) {
    this.destroyBars(fromScene);
    super.destroy(fromScene);
  }

  destroyBars(fromScene?: boolean) {
    this.healtBar.destroy(fromScene);
    this.staminaBar.destroy(fromScene);
  }
}
