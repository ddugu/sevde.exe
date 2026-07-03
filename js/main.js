(() => {
  'use strict';

  const BG_H = 682;
  let WORLD_W = 1948;
  const COLS = 4;
  const ROWS = 2;
  const SPRITE_W = 1024 / COLS;
  const SPRITE_H = 682 / ROWS;

  const PATH = { top: 443, bottom: 512 };
  const CHAR_SCALE = 0.18;
  const SPEED = 3.2;
  const ANIM_INTERVAL = 120;
  const WALK_BOB = 5;
  const FRAME_SEQ = [0, 1, 2, 1];
  const FINAL_FLOWER_COUNT = 5;
  const BGM_FILE = 'bgm.mp3';
  const BGM_START_SEC = 43;

  const FLOWERS = [
    { x: 320,  y: 488, col: 0, row: 0, scale: 0.11, collected: false, message: 'Merhaba Sevde!\nBugün senin günün 🎂' },
    { x: 720,  y: 492, col: 1, row: 0, scale: 0.11, collected: false, message: 'Seninle geçen her an\nçok değerli ✨' },
    { x: 1120, y: 485, col: 2, row: 0, scale: 0.10, collected: false, letter: true },
    { x: 1420, y: 490, col: 1, row: 1, scale: 0.11, collected: false, message: 'Bu yol senin için...\nHer adım bir sürpriz 🌸' },
    { x: 1580, y: 486, col: 2, row: 1, scale: 0.11, collected: false, message: 'Son çiçek!\nArkadaşların seni bekliyor 💕' },
  ];

  const FLOWER_COLS = 4;
  const FLOWER_ROWS = 4;
  const FLOWER_CELL = 256;
  const FLOWER_PAD = 28;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const confettiCanvas = document.getElementById('confetti');
  const confettiCtx = confettiCanvas.getContext('2d');
  const hint = document.getElementById('hint');
  const modal = document.getElementById('modal');
  const modalText = document.getElementById('modal-text');
  const modalClose = document.getElementById('modal-close');
  const finalModal = document.getElementById('final');
  const celebrationText = document.getElementById('celebration-text');
  const letterModal = document.getElementById('letter');
  const letterClose = document.getElementById('letter-close');

  const keys = {};
  let paused = false;
  let confettiPieces = [];
  let camera = { x: 0 };
  let collectedFlowerCount = 0;
  let celebrationStarted = false;
  let bgm = null;
  let bgmStarted = false;

  const sprite = new Image();
  sprite.src = assetUrl('assets/character.png');
  const worldBg = new Image();
  worldBg.src = assetUrl('assets/world.png');
  const flowersImg = new Image();
  flowersImg.src = assetUrl('assets/flowers.png');
  const partyCircleImg = new Image();
  partyCircleImg.src = assetUrl('assets/party-circle-clean.png?v=3');

  function initBgm() {
    if (bgm) return bgm;
    bgm = new Audio(assetUrl(`public/${BGM_FILE}?v=6`));
    bgm.loop = true;
    bgm.volume = 0.55;
    bgm.preload = 'auto';
    return bgm;
  }

  window.unlockBgm = function unlockBgm() {
    const audio = initBgm();
    audio.currentTime = BGM_START_SEC;
    const playAttempt = audio.play();
    if (playAttempt) {
      playAttempt.then(() => {
        audio.pause();
      }).catch(() => {});
    }
  };

  function resumeBgmOnInput() {
    const audio = initBgm();
    const start = () => {
      audio.currentTime = BGM_START_SEC;
      audio.play().catch(() => {});
    };
    window.addEventListener('keydown', start, { once: true });
    canvas.addEventListener('touchstart', start, { once: true, passive: true });
  }

  function playBgm() {
    if (bgmStarted) return;
    bgmStarted = true;

    const audio = initBgm();
    const start = () => {
      audio.currentTime = BGM_START_SEC;
      audio.play().catch(() => resumeBgmOnInput());
    };

    if (audio.readyState >= 1) {
      start();
    } else {
      audio.addEventListener('loadedmetadata', start, { once: true });
      audio.load();
    }
  }

  const player = {
    x: 180,
    y: 485,
    frame: 1,
    frameIdx: 0,
    row: 0,
    moving: false,
    lastAnim: 0,
    facing: 'right',
    walkPhase: 0,
  };

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  function getScale() {
    return canvas.height / BG_H;
  }

  function getViewW() {
    return canvas.width / getScale();
  }

  function worldToScreen(wx, wy) {
    const scale = getScale();
    return { x: wx * scale - camera.x * scale, y: wy * scale };
  }

  function updateCamera() {
    const viewW = getViewW();
    const target = player.x - viewW * 0.38;
    camera.x = Math.max(0, Math.min(WORLD_W - viewW, target));
  }

  function clampPlayer() {
    const halfW = (SPRITE_W * CHAR_SCALE) / 2;
    player.x = Math.max(halfW + 20, Math.min(WORLD_W - halfW - 20, player.x));
    player.y = Math.max(PATH.top + 8, Math.min(PATH.bottom - 8, player.y));
  }

  function handleInput() {
    if (paused || celebrationStarted) return;

    let dx = 0;
    let dy = 0;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1;

    player.moving = dx !== 0 || dy !== 0;

    if (dx !== 0) {
      player.facing = dx > 0 ? 'right' : 'left';
      player.row = dx > 0 ? 0 : 1;
    }

    if (player.moving) {
      const len = Math.hypot(dx, dy) || 1;
      player.x += (dx / len) * SPEED;
      player.y += (dy / len) * SPEED * 0.5;
    }

    clampPlayer();
    updateCamera();
  }

  function updateAnimation(now) {
    if (celebrationStarted) {
      player.frame = 1;
      player.walkPhase += 0.18;
      return;
    }

    if (!player.moving) {
      player.frame = 1;
      player.walkPhase = 0;
      return;
    }
    player.walkPhase += 0.22;
    if (now - player.lastAnim >= ANIM_INTERVAL) {
      player.frameIdx = (player.frameIdx + 1) % FRAME_SEQ.length;
      player.frame = FRAME_SEQ[player.frameIdx];
      player.lastAnim = now;
    }
  }

  function checkFlowers() {
    if (paused) return;
    for (const flower of FLOWERS) {
      if (flower.collected) continue;
      const hitR = 26 + flower.scale * 80;
      if (Math.hypot(player.x - flower.x, player.y - flower.y) < hitR) {
        flower.collected = true;
        flower.pop = 1;

        collectedFlowerCount += 1;
        if (collectedFlowerCount >= FINAL_FLOWER_COUNT) {
          if (flower.message) {
            showModal(flower.message);
            setTimeout(showFinal, 2200);
          } else if (flower.letter) {
            showLetter();
            setTimeout(showFinal, 3500);
          } else {
            showFinal();
          }
          return;
        }
        if (flower.letter) {
          showLetter();
          startConfetti();
        } else if (flower.message) {
          showModal(flower.message);
          if (flower.confetti) startConfetti();
        }
      }
    }
  }

  function showModal(text) {
    paused = true;
    modalText.innerHTML = text.replace(/\n/g, '<br>');
    modal.classList.remove('hidden');
  }

  function hideModal() {
    modal.classList.add('hidden');
    paused = false;
  }

  function showLetter() {
    paused = true;
    letterModal.classList.remove('hidden');
  }

  function hideLetter() {
    letterModal.classList.add('hidden');
    paused = false;
  }

  function showFinal() {
    if (celebrationStarted) return;
    celebrationStarted = true;
    paused = false;
    modal.classList.add('hidden');
    letterModal.classList.add('hidden');
    finalModal.classList.add('hidden');
    hint.classList.add('hidden');
    if (celebrationText) celebrationText.classList.remove('hidden');
    player.moving = false;
    const viewW = getViewW();
    camera.x = Math.max(0, WORLD_W - viewW);
    startConfetti();
  }

  function drawPartyCircle() {
    const bounce = Math.sin(performance.now() / 240) * 10;
    const size = Math.min(canvas.width, canvas.height) * 0.52;
    const dx = (canvas.width - size) / 2;
    const dy = (canvas.height - size) / 2 + bounce - 10;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(partyCircleImg, dx, dy, size, size);
  }

  function drawBackground() {
    const scale = getScale();
    const drawH = canvas.height;
    const drawW = WORLD_W * scale;
    const screenX = -camera.x * scale;

    const sky = ctx.createLinearGradient(0, 0, 0, drawH);
    sky.addColorStop(0, '#7b4fa8');
    sky.addColorStop(0.45, '#d4829a');
    sky.addColorStop(1, '#e8a060');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(worldBg, screenX, 0, drawW, drawH);

    if (celebrationStarted) drawPartyCircle();
  }

  function drawFlowerSprite(flower, sx, sy, size) {
    const src = FLOWER_CELL - FLOWER_PAD * 2;
    ctx.drawImage(
      flowersImg,
      flower.col * FLOWER_CELL + FLOWER_PAD, flower.row * FLOWER_CELL + FLOWER_PAD,
      src, src,
      sx - size / 2, sy - size * 0.92, size, size
    );
  }

  function drawFlowers(now) {
    const scale = getScale();
    for (const flower of FLOWERS) {
      if (flower.collected) {
        if (flower.pop > 0) {
          flower.pop -= 0.06;
          const { x: sx, y: sy } = worldToScreen(flower.x, flower.y);
          ctx.save();
          ctx.globalAlpha = flower.pop;
          ctx.imageSmoothingEnabled = false;
          drawFlowerSprite(flower, sx, sy, FLOWER_CELL * flower.scale * scale * flower.pop);
          ctx.restore();
        }
        continue;
      }
      const bob = Math.sin(now / 500 + flower.x) * 2;
      const { x: sx, y: sy } = worldToScreen(flower.x, flower.y + bob);
      if (sx < -60 || sx > canvas.width + 60) continue;
      ctx.imageSmoothingEnabled = false;
      drawFlowerSprite(flower, sx, sy, FLOWER_CELL * flower.scale * scale);
    }
  }

  function drawPlayerShadow(scale) {
    const { x: sx, y: sy } = worldToScreen(player.x, player.y);
    const w = SPRITE_W * CHAR_SCALE * scale;
    ctx.save();
    ctx.globalAlpha = player.moving ? 0.35 + Math.cos(player.walkPhase) * 0.1 : 0.4;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 3 * scale, w * 0.28, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return Math.sin(player.walkPhase) * WALK_BOB;
  }

  function drawPlayer() {
    if (celebrationStarted) return;

    const scale = getScale();
    const bob = drawPlayerShadow(scale);
    const w = SPRITE_W * CHAR_SCALE * scale;
    const h = SPRITE_H * CHAR_SCALE * scale;
    const { x: cx, y: cy } = worldToScreen(player.x, player.y);
    const px = cx - w / 2;
    const py = cy - h * 0.85 + ((player.moving || celebrationStarted) ? bob * scale * 0.55 : 0);
    const squash = (player.moving || celebrationStarted) ? 1 + Math.cos(player.walkPhase * 2) * 0.03 : 1;

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(px + w / 2, py + h);
    ctx.scale(1, squash);
    ctx.translate(-(px + w / 2), -(py + h));
    ctx.drawImage(
      sprite,
      player.frame * SPRITE_W, player.row * SPRITE_H,
      SPRITE_W, SPRITE_H,
      px, py, w, h
    );
    ctx.restore();
  }

  function startConfetti() {
    const colors = ['#ff69b4', '#ffd700', '#ff1493', '#ffb6c1', '#da70d6', '#87ceeb'];
    for (let i = 0; i < 80; i++) {
      confettiPieces.push({
        x: Math.random() * confettiCanvas.width,
        y: -10 - Math.random() * confettiCanvas.height * 0.5,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: 2 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 3,
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 8,
      });
    }
  }

  function updateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiPieces = confettiPieces.filter(p => p.y < confettiCanvas.height + 20);
    for (const p of confettiPieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate((p.rot * Math.PI) / 180);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      confettiCtx.restore();
    }
  }

  function loop(now) {
    handleInput();
    updateAnimation(now);
    checkFlowers();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    if (!celebrationStarted) {
      drawFlowers(now);
      drawPlayer();
    }
    updateConfetti();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => { resize(); updateCamera(); });
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  modalClose.addEventListener('click', hideModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });
  letterClose.addEventListener('click', hideLetter);
  letterModal.addEventListener('click', (e) => { if (e.target === letterModal) hideLetter(); });

  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    if (!touchStart) return;
    const dx = e.touches[0].clientX - touchStart.x;
    const dy = e.touches[0].clientY - touchStart.y;
    keys['ArrowLeft'] = dx < -15;
    keys['ArrowRight'] = dx > 15;
    keys['ArrowUp'] = dy < -15;
    keys['ArrowDown'] = dy > 15;
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', () => {
    touchStart = null;
    keys['ArrowLeft'] = keys['ArrowRight'] = keys['ArrowUp'] = keys['ArrowDown'] = false;
  });

  let gameStarted = false;
  window.startSevdeGame = function startSevdeGame() {
    if (gameStarted) return;
    gameStarted = true;
    playBgm();

    setTimeout(() => hint.classList.add('hidden'), 5000);

    const welcome = document.getElementById('game-welcome');
    if (welcome) {
      welcome.classList.remove('hidden');
      setTimeout(() => {
        welcome.classList.add('fade-out');
        setTimeout(() => welcome.classList.add('hidden'), 1000);
      }, 2800);
    }

    Promise.all([
      new Promise(r => { if (worldBg.complete) r(); else worldBg.onload = r; }),
      new Promise(r => { if (sprite.complete) r(); else sprite.onload = r; }),
      new Promise(r => { if (flowersImg.complete) r(); else flowersImg.onload = r; }),
      new Promise(r => { if (partyCircleImg.complete) r(); else partyCircleImg.onload = r; }),
    ]).then(() => {
      WORLD_W = worldBg.naturalWidth || WORLD_W;
      resize();
      updateCamera();
      requestAnimationFrame(loop);
    });
  };
})();
