const arena = document.getElementById('arena');
const player = document.getElementById('player');
const timeEl = document.getElementById('time');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const messageEl = document.getElementById('message');
const startBtn = document.getElementById('start-btn');

const enemyTexts = ['画饼', '无偿加班', '情绪PUA', '年底再说', '你不够努力'];

const state = {
  running: false,
  score: 0,
  lives: 3,
  timeLeft: 60,
  playerX: 0,
  speed: 7,
  keys: new Set(),
  objects: [],
  timers: { countdown: null, spawn: null },
  rafId: null,
};

function arenaWidth() {
  return arena.clientWidth;
}

function resetGameState() {
  state.score = 0;
  state.lives = 3;
  state.timeLeft = 60;
  state.playerX = arenaWidth() / 2 - 26;
  state.keys.clear();
  clearObjects();
  renderHud();
  renderPlayer();
}

function renderHud() {
  timeEl.textContent = String(state.timeLeft);
  scoreEl.textContent = String(state.score);
  livesEl.textContent = String(state.lives);
}

function renderPlayer() {
  const limit = arenaWidth() - 52;
  state.playerX = Math.max(0, Math.min(limit, state.playerX));
  player.style.left = `${state.playerX}px`;
}

function spawnObject() {
  const isBonus = Math.random() < 0.28;
  const obj = document.createElement('div');
  obj.className = isBonus ? 'bonus' : 'enemy';
  obj.textContent = isBonus ? '📁' : '💬';

  if (!isBonus) {
    obj.title = enemyTexts[Math.floor(Math.random() * enemyTexts.length)];
  } else {
    obj.title = '劳动证据';
  }

  const x = Math.random() * (arenaWidth() - 52);
  const speed = isBonus ? 2.8 + Math.random() * 2 : 2.5 + Math.random() * 2.8;
  const y = -56;

  obj.style.left = `${x}px`;
  obj.style.top = `${y}px`;
  arena.appendChild(obj);
  state.objects.push({ el: obj, x, y, speed, isBonus });
}

function clearObjects() {
  state.objects.forEach((item) => item.el.remove());
  state.objects = [];
}

function intersects(a, b) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function damage() {
  state.lives -= 1;
  arena.classList.remove('flash');
  void arena.offsetWidth;
  arena.classList.add('flash');
  if (state.lives <= 0) {
    endGame(false);
  }
}

function gainScore(amount) {
  state.score += amount;
}

function updateObjects() {
  const playerBox = player.getBoundingClientRect();
  state.objects = state.objects.filter((item) => {
    item.y += item.speed;
    item.el.style.top = `${item.y}px`;

    const box = item.el.getBoundingClientRect();
    if (intersects(playerBox, box)) {
      if (item.isBonus) {
        gainScore(10);
      } else {
        damage();
      }
      item.el.remove();
      return false;
    }

    if (item.y > arena.clientHeight + 56) {
      if (!item.isBonus) {
        gainScore(2);
      }
      item.el.remove();
      return false;
    }

    return true;
  });
}

function updatePlayer() {
  if (state.keys.has('ArrowLeft') || state.keys.has('a') || state.keys.has('A')) {
    state.playerX -= state.speed;
  }
  if (state.keys.has('ArrowRight') || state.keys.has('d') || state.keys.has('D')) {
    state.playerX += state.speed;
  }
  renderPlayer();
}

function gameLoop() {
  if (!state.running) return;
  updatePlayer();
  updateObjects();
  renderHud();
  state.rafId = requestAnimationFrame(gameLoop);
}

function startGame() {
  if (state.running) return;
  resetGameState();
  state.running = true;
  messageEl.textContent = '挺住！收集证据，躲开话术攻击！';
  startBtn.textContent = '重新开始';

  state.timers.countdown = setInterval(() => {
    state.timeLeft -= 1;
    renderHud();
    if (state.timeLeft <= 0) {
      endGame(true);
    }
  }, 1000);

  state.timers.spawn = setInterval(spawnObject, 650);
  state.rafId = requestAnimationFrame(gameLoop);
}

function stopTimers() {
  clearInterval(state.timers.countdown);
  clearInterval(state.timers.spawn);
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
  }
}

function endGame(win) {
  if (!state.running) return;
  state.running = false;
  stopTimers();
  const title = win ? '你成功顶住了 60 秒！' : '被话术击垮了…';
  const tips = win
    ? '你保住了底线，准备和老板谈判吧。'
    : '别灰心，收集更多证据再来一次。';
  messageEl.textContent = `${title} 最终得分：${state.score}。${tips}`;
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    if (!state.running) {
      startGame();
    }
  }
  state.keys.add(event.key);
});

window.addEventListener('keyup', (event) => {
  state.keys.delete(event.key);
});

startBtn.addEventListener('click', startGame);

window.addEventListener('resize', () => {
  if (!state.running) {
    state.playerX = arenaWidth() / 2 - 26;
  }
  renderPlayer();
});

resetGameState();
