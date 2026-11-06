const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreLabel = document.querySelector('#score');
const bestLabel = document.querySelector('#best');
const status = document.querySelector('#status');
const button = document.querySelector('#jump');
let best = 0;
try { best = Number(localStorage.getItem('plushrush-best')) || 0; } catch {}
bestLabel.textContent = best;
let mode = 'ready', distance = 0, y = 0, velocity = 0, obstacles = [], spawn = 1.5, previous;
const ground = 322;

function jump() {
  if (mode !== 'running') {
    mode = 'running'; distance = 0; y = 0; velocity = 0; obstacles = []; spawn = 1.5;
    status.textContent = '좋아요! 장애물을 뛰어넘어 보세요.';
    button.textContent = '점프 ↗';
  }
  if (y === 0) velocity = 610;
}
document.addEventListener('keydown', event => {
  if (['Space', 'ArrowUp'].includes(event.code) && event.target !== button) {
    event.preventDefault(); if (!event.repeat) jump();
  }
});
button.addEventListener('click', jump);
canvas.addEventListener('pointerdown', jump);

function rounded(x, top, width, height, radius, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, top, width, height, radius); ctx.fill();
}
function render(time) {
  const dt = previous === undefined ? 0 : Math.min((time - previous) / 1000, 0.04);
  previous = time;
  if (mode === 'running') {
    const speed = Math.min(480, 270 + distance * 0.13);
    distance += speed * dt / 20;
    y = Math.max(0, y + velocity * dt); velocity -= 1600 * dt;
    if (y === 0) velocity = 0;
    spawn -= dt;
    if (spawn <= 0) { obstacles.push({ x: 980, height: 40 + Math.random() * 22 }); spawn = 1.25 + Math.random() * 0.7; }
    for (const obstacle of obstacles) {
      obstacle.x -= speed * dt;
      if (obstacle.x < 188 && obstacle.x + 32 > 148 && y < obstacle.height - 7) {
        mode = 'over';
        best = Math.max(best, Math.floor(distance));
        bestLabel.textContent = best;
        try { localStorage.setItem('plushrush-best', String(best)); } catch {}
        status.textContent = `${Math.floor(distance)}m 달렸어요! 다시 도전해 볼까요?`;
        button.textContent = '다시 시작 ↗';
        break;
      }
    }
    obstacles = obstacles.filter(obstacle => obstacle.x > -50);
    scoreLabel.textContent = Math.floor(distance);
  }
  ctx.fillStyle = '#eaf3e9'; ctx.fillRect(0, 0, 960, 400);
  for (let i = 0; i < 5; i++) {
    const x = ((i * 240 + 90 - distance * 2) % 1200 + 1200) % 1200 - 120;
    rounded(x, 60 + (i % 2) * 45, 100, 22, 20, '#fffdf7');
    rounded(x + 25, 42 + (i % 2) * 45, 50, 36, 22, '#fffdf7');
  }
  ctx.fillStyle = '#d4e5cc'; ctx.beginPath(); ctx.ellipse(730, 326, 320, 125, 0, Math.PI, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#dfebd7'; ctx.beginPath(); ctx.ellipse(280, 340, 390, 100, 0, Math.PI, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#c5d9b9'; ctx.fillRect(0, ground, 960, 78);
  for (let i = 0; i < 24; i++) rounded((i * 47 - distance * 20 % 47), 350 + (i % 3) * 12, 12, 3, 2, '#abc49f');
  for (const obstacle of obstacles) {
    rounded(obstacle.x, ground - obstacle.height, 32, obstacle.height, 9, '#bd8f73');
    rounded(obstacle.x + 6, ground - obstacle.height + 7, 20, 6, 3, '#d9b498');
  }
  const top = ground - 58 - y;
  rounded(142, top - 17, 18, 27, 10, '#c69a75'); rounded(176, top - 17, 18, 27, 10, '#c69a75');
  rounded(140, top, 56, 55, 22, '#e1b88c');
  rounded(147, top + 43, 16, 15, 6, '#c69a75'); rounded(176, top + 43, 16, 15, 6, '#c69a75');
  rounded(155, top + 26, 27, 19, 9, '#f5ddbd');
  ctx.fillStyle = '#3e4036';
  for (const x of [155, 179]) { ctx.beginPath(); ctx.arc(x, top + 20, 3, 0, Math.PI * 2); ctx.fill(); }
  rounded(165, top + 29, 7, 5, 3, '#614d3c');
  rounded(138, top + 45, 61, 8, 3, '#6b9d88');
  requestAnimationFrame(render);
}
document.addEventListener('visibilitychange', () => { previous = undefined; });
requestAnimationFrame(render);
