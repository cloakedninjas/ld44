import {Scene} from 'phaser';
import {Hero} from '../entities/hero';
import Pointer = Phaser.Input.Pointer;
import GameObject = Phaser.GameObjects.GameObject;
import Sprite = Phaser.GameObjects.Sprite;
import {Trap} from "../entities/trap";
import {Tower} from "../entities/tower";
import {Structure} from "../entities/structure";

export class Dungeon extends Scene {
  static GRID_SIZE: number = 90;
  static GRID_OFFSET_X: number = 145;
  static GRID_OFFSET_Y: number = 35;
  static MAP_WIDTH: number = 11;
  static MAP_HEIGHT: number = 6;

  static TRAP_PLACEABLE: number = 0;
  static TOWER_PLACEABLE: number = 1;
  static NOT_PLACEABLE: number = 2;

  map: number[][];
  mapBg: Phaser.GameObjects.Image;
  graphics: Phaser.GameObjects.Graphics;
  heroPath: Phaser.Curves.Path;
  heros: Hero[];
  structures: Structure[];
  newStructure: Trap;
  trapButton: Sprite;
  towerButton: Sprite;
  gold: number;

  constructor() {
    super({
      key: 'DungeonScene',
    });

    this.map = [
      [1, 1, 1, 1, 1, 2],
      [1, 0, 0, 0, 1, 0],
      [1, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 0, 0],
      [1, 0, 1, 1, 1, 0],
      [2, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
    ];
  }

  init() {
  }

  create() {
    this.mapBg = this.add.image(0, 0, 'map');
    this.mapBg.setOrigin(0, 0);

    //const map = new MapArea(this, 0, 0);
    //this.add.existing(map);

    //this.cameras.main.setPosition(145, 35);

    // define hero path

    this.graphics = this.add.graphics();
    this.heroPath = this.add.path(0, 0);

    const coords = [
      [855, -45],
      [855, 135],
      [135, 135],
      [135, 315],
      [675, 315],
      [675, 495],
      [45, 495],
    ];

    coords.forEach((coord, index) => {
      const next = coords[index + 1];

      if (next) {
        const line = new Phaser.Curves.Line([
          coord[0] + Dungeon.GRID_OFFSET_X,
          coord[1] + Dungeon.GRID_OFFSET_Y,
          next[0] + Dungeon.GRID_OFFSET_X,
          next[1] + Dungeon.GRID_OFFSET_Y]);
        this.heroPath.add(line);
      }
    });

    this.heros = [];
    this.structures = [];

    const hero = new Hero(this, coords[0][0], coords[0][1], this.heroPath);
    this.heros.push(hero);

    this.add.existing(hero);
    hero.startOnPath();

    // add mouse control
    //this.game.input.setPollOnMove
    //this.input.setPollOnMove();

    /*this.input.on('pointermove', (pointer) => {
      console.log(pointer.x, pointer.y);
    });*/

    this.mapBg.setInteractive();

    this.input.on('gameobjectdown', this.onObjectDown.bind(this));

    this.trapButton = this.add.sprite(300, 650, 'spike');
    this.trapButton.setInteractive();

    this.trapButton.on('pointerover', () => {
      this.trapButton.setTint(0x00ff00);
    });

    this.trapButton.on('pointerout', () => {
      this.trapButton.clearTint();
    });

    this.towerButton = this.add.sprite(400, 650, 'tower');
    this.towerButton.setInteractive();

    this.towerButton.on('pointerover', () => {
      this.towerButton.setTint(0x00ff00);
    });

    this.towerButton.on('pointerout', () => {
      this.towerButton.clearTint();
    });

    this.input.on('gameobjectup', this.onObjectUp.bind(this));
  }

  update(time, delta) {
    this.heros.forEach((hero) => {
      hero.update(time, delta);
    });

    this.graphics.clear();
    this.graphics.lineStyle(2, 0xffff00, 1);

    this.heroPath.draw(this.graphics);

    if (this.newStructure) {
      this.newStructure.setPosition(this.input.activePointer.worldX, this.input.activePointer.worldY);
    }
  }

  onObjectDown(pointer: Pointer, gameObject: GameObject) {
    if (gameObject === this.trapButton) {
      this.createTrap();
    } else if (gameObject === this.towerButton) {
      this.createTower();
    }
  }

  onObjectUp(pointer: Pointer, gameObject: GameObject) {
    if (this.newStructure) {
      const mapX = pointer.worldX - Dungeon.GRID_OFFSET_X;
      const mapY = pointer.worldY - Dungeon.GRID_OFFSET_Y;

      const gridX = Math.floor(mapX / Dungeon.GRID_SIZE);
      const gridY = Math.floor(mapY / Dungeon.GRID_SIZE);

      const canPlace = (this.newStructure instanceof Trap && this.map[gridX][gridY] === Dungeon.TRAP_PLACEABLE) ||
        (this.newStructure instanceof Tower && this.map[gridX][gridY] === Dungeon.TOWER_PLACEABLE);

      if (canPlace) {
        const halfGrid = Dungeon.GRID_SIZE / 2;
        this.newStructure.setPosition(
          gridX * Dungeon.GRID_SIZE + halfGrid + Dungeon.GRID_OFFSET_X,
          gridY * Dungeon.GRID_SIZE + halfGrid + Dungeon.GRID_OFFSET_Y);
        this.newStructure.place();
        this.structures.push(this.newStructure);

        this.newStructure = null;
      } else {
        this.newStructure.destroy();
        this.newStructure = null;
      }
    }
  }

  createTrap() {
    this.newStructure = new Trap(this, 0, 0);
    this.add.existing(this.newStructure);
  }

  createTower() {
    this.newStructure = new Tower(this, 0, 0);
    this.add.existing(this.newStructure);
  }
}
