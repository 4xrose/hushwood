import './styles.css';
import { Game } from './game/Game.js';

let game = null;

try {
  game = new Game(document.getElementById('scene'));
  game.boot().catch((error) => {
    console.error(error);
    game?.fatal?.(error);
  });
} catch (error) {
  console.error('HUSHWOOD could not start.', error);
  const sub = document.querySelector('.boot-sub');
  if (sub) {
    sub.textContent = 'WebGL could not be started. Try a different browser or device.';
  }
  document.querySelector('.boot')?.classList.remove('done');
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service worker registration failed.', error);
    });
  });
}
