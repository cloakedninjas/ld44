import {Shop as ShopScene} from './scenes/shop';
import {Dungeon as DungeonScene} from './scenes/dungeon';
import {Preload} from './scenes/preload';

const config: GameConfig = {
  title: 'LD44',

  scene: [Preload, ShopScene, DungeonScene],
  backgroundColor: '#333',
  // resolution: window.devicePixelRatio,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
    width: 1280,
    height: 720,
  },
};

window.addEventListener('load', () => {
  window['game'] = new Phaser.Game(config);
});
