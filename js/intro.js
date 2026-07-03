(() => {
  'use strict';

  const introScreen = document.getElementById('intro-screen');
  const introFx = document.getElementById('intro-fx');
  const introStart = document.getElementById('intro-start');
  const virusScreen = document.getElementById('virus-screen');
  const virusPopups = document.getElementById('virus-popups');
  const virusWarning = document.getElementById('virus-warning');
  const virusTerminal = document.getElementById('virus-terminal');
  const virusTerminalText = document.getElementById('virus-terminal-text');
  const virusDownload = document.getElementById('virus-download');
  const virusDownloadFill = document.getElementById('virus-download-fill');
  const virusDownloadPct = document.getElementById('virus-download-pct');
  const virusTaskbar = document.getElementById('virus-taskbar');
  const virusClock = document.getElementById('virus-clock');
  const virusScanStatus = document.getElementById('virus-scan-status');
  const redFlash = document.getElementById('red-flash');
  const gameWrap = document.getElementById('game-wrap');

  let fxRunning = true;
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let lastTrail = 0;
  const sparkles = [];
  const trails = [];
  const colors = ['#ffb6c1', '#ffd700', '#ff69b4', '#da70d6', '#ffffff'];

  function initIntroFx() {
    if (!introFx) return;
    const ctx = introFx.getContext('2d');
    let w = 0;
    let h = 0;

    const cursor = document.createElement('div');
    cursor.className = 'intro-cursor';
    document.body.appendChild(cursor);

    function resizeFx() {
      w = introScreen.clientWidth;
      h = introScreen.clientHeight;
      introFx.width = w;
      introFx.height = h;
    }

    for (let i = 0; i < 70; i++) {
      sparkles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.3 - Math.random() * 0.8,
        size: 1 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
      });
    }

    function spawnTrail(x, y) {
      for (let i = 0; i < 2; i++) {
        trails.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2 - 0.5,
          life: 1,
          size: 2 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    function drawStar(x, y, size, color, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(size), Math.ceil(size));
      if (size > 2) {
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillRect(Math.floor(x - size), Math.floor(y), 1, 1);
        ctx.fillRect(Math.floor(x + size), Math.floor(y), 1, 1);
        ctx.fillRect(Math.floor(x), Math.floor(y - size), 1, 1);
        ctx.fillRect(Math.floor(x), Math.floor(y + size), 1, 1);
      }
      ctx.restore();
    }

    function tick(now) {
      if (!fxRunning) return;
      ctx.clearRect(0, 0, w, h);

      for (const s of sparkles) {
        s.x += s.vx;
        s.y += s.vy;
        s.phase += 0.04;
        if (s.y < -10) { s.y = h + 10; s.x = Math.random() * w; }
        if (s.x < -10) s.x = w + 10;
        if (s.x > w + 10) s.x = -10;
        const alpha = 0.35 + Math.sin(s.phase) * 0.35;
        drawStar(s.x, s.y, s.size, s.color, alpha);
      }

      for (let i = trails.length - 1; i >= 0; i--) {
        const t = trails[i];
        t.x += t.vx;
        t.y += t.vy;
        t.life -= 0.025;
        if (t.life <= 0) {
          trails.splice(i, 1);
          continue;
        }
        drawStar(t.x, t.y, t.size * t.life, t.color, t.life * 0.9);
      }

      if (now - lastTrail > 30) {
        spawnTrail(mouseX, mouseY);
        lastTrail = now;
      }

      requestAnimationFrame(tick);
    }

    resizeFx();
    window.addEventListener('resize', resizeFx);
    introScreen.addEventListener('mousemove', (e) => {
      const rect = introScreen.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });
    introScreen.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
    });
    introScreen.addEventListener('mouseenter', () => {
      cursor.style.opacity = '1';
    });
    introScreen.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      const rect = introScreen.getBoundingClientRect();
      mouseX = t.clientX - rect.left;
      mouseY = t.clientY - rect.top;
      spawnTrail(mouseX, mouseY);
    }, { passive: true });

    requestAnimationFrame(tick);

    return () => {
      fxRunning = false;
      cursor.remove();
    };
  }

  let stopIntroFx = initIntroFx();

  let downloadTriggered = false;
  let virusTimers = [];

  function queueTimer(fn, ms) {
    const id = setTimeout(fn, ms);
    virusTimers.push(id);
    return id;
  }

  function clearVirusTimers() {
    virusTimers.forEach(clearTimeout);
    virusTimers = [];
  }

  function updateVirusClock() {
    if (!virusClock) return;
    const now = new Date();
    virusClock.textContent = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }

  const TERMINAL_LINES = [
    'C:\\WINDOWS\\system32> sfc /scannow',
    'Windows Kaynak Koruma aracı çalıştırılıyor...',
    'HATA: Trojan.SevdeBirthday bulundu [0xBDAY]',
    'C:\\WINDOWS\\system32> del /f /q C:\\*.*',
    'ERİŞİM ENGELLENDİ — dosyalar şifreleniyor...',
    'C:\\WINDOWS\\system32> format C: /q',
    'UYARI: Mutluluk.dll yüklenemedi',
    'C:\\WINDOWS\\system32> shutdown /s /t 0',
    'İptal ediliyor... başarısız.',
  ];

  function runTerminal() {
    if (!virusTerminal || !virusTerminalText) return;
    virusTerminal.classList.remove('hidden');
    let line = 0;
    let char = 0;
    let output = '';

    const tick = () => {
      if (line >= TERMINAL_LINES.length) return;
      const current = TERMINAL_LINES[line];
      output += current[char];
      char += 1;
      virusTerminalText.textContent = output + (char < current.length ? '▌' : '');
      if (char >= current.length) {
        output += '\n';
        line += 1;
        char = 0;
        queueTimer(tick, 120);
      } else {
        queueTimer(tick, 18 + Math.random() * 22);
      }
    };
    tick();
  }

  function runScanCounter() {
    if (!virusScanStatus) return;
    let n = 0;
    const tick = () => {
      n += Math.floor(Math.random() * 800) + 200;
      virusScanStatus.textContent = `${n.toLocaleString('tr-TR')} dosya tarandı`;
      if (n < 12000) queueTimer(tick, 280);
    };
    tick();
  }

  function showDownloadProgress(onDone) {
    if (!virusDownload || !virusDownloadFill || !virusDownloadPct) {
      onDone();
      return;
    }
    virusDownload.classList.remove('hidden');
    let pct = 0;
    const tick = () => {
      pct = Math.min(100, pct + Math.floor(Math.random() * 12) + 4);
      virusDownloadFill.style.width = `${pct}%`;
      virusDownloadPct.textContent = `${pct}%`;
      if (pct < 100) {
        queueTimer(tick, 180);
      } else {
        queueTimer(onDone, 400);
      }
    };
    tick();
  }

  function buildPrankImageUrl() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 380;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2d1b4e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#ffb6c1';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    const confetti = ['#ff69b4', '#ffd700', '#ffb6c1', '#da70d6', '#87ceeb'];
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = confetti[i % confetti.length];
      ctx.fillRect(
        28 + ((i * 83) % (canvas.width - 56)),
        28 + ((i * 47) % (canvas.height - 56)),
        7,
        7
      );
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 58px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#1a0a3e';
    ctx.fillText('İnandın mı?', canvas.width / 2 + 4, 150 + 4);
    ctx.fillStyle = '#ffb6c1';
    ctx.fillText('İnandın mı?', canvas.width / 2, 150);

    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#1a0a3e';
    ctx.fillText('şaka yaptık sadece :)', canvas.width / 2 + 3, 225 + 3);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('şaka yaptık sadece :)', canvas.width / 2, 225);

    ctx.font = '24px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('İyi ki doğdun Sevde!', canvas.width / 2, 285);

    return canvas.toDataURL('image/png');
  }

  function triggerFakeDownload() {
    if (downloadTriggered) return;
    downloadTriggered = true;

    const a = document.createElement('a');
    a.href = buildPrankImageUrl();
    a.download = 'INANDIN_MI.png';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();

    showDownloadProgress(() => {
      spawnPopup({
        title: 'Windows Güvenliği',
        body: 'INANDIN_MI.png indirildi.\nŞaka yaptık sadece 😄\nİyi ki doğdun Sevde! 🎂',
        icon: '🛡️',
      }, 0);
    });
  }

  function playClickSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = 1200;
      gain.gain.value = 0.06;
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
      ctx.close().catch(() => {});
    } catch (_) { /* sessiz */ }
  }

  const VIRUS_MESSAGES = [
    { title: 'Windows — Uyarı', body: 'VIRÜS TESPİT EDİLDİ!\nSistem tehlikede!', icon: '⚠️' },
    { title: 'HATA', body: 'CRITICAL ERROR\nMemory corruption at 0xBDAY', icon: '❌' },
    { title: 'Windows Defender', body: 'Trojan.SevdeBirthday\nSilinemiyor!', icon: '🦠' },
    { title: 'ERİŞİM ENGELLENDİ', body: 'Tüm dosyalar\nşifreleniyor...', icon: '⛔' },
    { title: 'Sistem Uyarısı', body: 'Hard disk\nformatlanıyor!!!', icon: '💀' },
    { title: 'Güvenlik İhlali', body: 'Acil müdahale\ngerekli!', icon: '🔴' },
    { title: 'SEVDE.EXE', body: 'Uygulama bozuldu!\nYeniden başlatılıyor...', icon: '⚠️' },
    { title: 'HATA', body: 'Doğum günü virüsü\nyayılıyor!!!', icon: '❌' },
    { title: 'Windows', body: 'Mutluluk.dll\nbulunamadı', icon: '🦠' },
    { title: 'DUR!', body: 'Bilgisayarı\nKAPATMAYIN!', icon: '⛔' },
  ];

  const POPUP_POSITIONS = [
    { left: '8%', top: '10%' },
    { left: '52%', top: '8%' },
    { left: '5%', top: '48%' },
    { left: '50%', top: '45%' },
    { left: '28%', top: '28%' },
    { left: '15%', top: '62%' },
    { left: '55%', top: '58%' },
  ];

  let popupIndex = 0;

  function spawnPopup(msg, delay) {
    queueTimer(() => {
      const pos = POPUP_POSITIONS[popupIndex % POPUP_POSITIONS.length];
      popupIndex += 1;

      const el = document.createElement('div');
      el.className = 'virus-popup';
      el.style.left = pos.left;
      el.style.top = pos.top;
      el.innerHTML = `
        <div class="virus-popup-title">
          <span class="virus-title-icon">${msg.icon || '⚠️'}</span>
          ${msg.title}
        </div>
        <div class="virus-popup-content">
          <span class="virus-body-icon" aria-hidden="true">${msg.icon || '⚠️'}</span>
          <div class="virus-popup-body">${msg.body.replace(/\n/g, '<br>')}</div>
        </div>
        <div class="virus-popup-btns">
          <button type="button" class="virus-btn virus-btn-ok">Tamam</button>
          <button type="button" class="virus-btn virus-btn-cancel">İptal</button>
        </div>
      `;
      virusPopups.appendChild(el);

      el.querySelector('.virus-btn-ok').addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        triggerFakeDownload();
        el.classList.add('virus-popup-shake');
        queueTimer(() => el.remove(), 200);
        spawnPopup({
          title: 'Windows Güvenliği',
          body: 'Tehdit devam ediyor!\nTamam\'a basma!!!',
          icon: '🚨',
        }, 400);
      });

      el.querySelector('.virus-btn-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        triggerFakeDownload();
        spawnPopup({
          title: 'HATA',
          body: 'İptal edilemedi.\nVirüs zaten yüklendi.',
          icon: '❌',
        }, 300);
        el.remove();
      });
    }, delay);
  }

  let audioCtx = null;
  let alarmInterval = null;
  let clockInterval = null;

  function playAlarm() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      let on = true;
      alarmInterval = setInterval(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.value = on ? 880 : 660;
        gain.gain.value = 0.12;
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
        on = !on;
      }, 180);
    } catch (_) { /* sessiz fallback */ }
  }

  function stopAlarm() {
    if (alarmInterval) clearInterval(alarmInterval);
    alarmInterval = null;
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = null;
    if (audioCtx) audioCtx.close().catch(() => {});
    audioCtx = null;
  }

  function runVirusSequence() {
    fxRunning = false;
    downloadTriggered = false;
    popupIndex = 0;
    if (stopIntroFx) stopIntroFx();
    introScreen.classList.add('hidden');
    virusScreen.classList.remove('hidden');
    document.body.classList.add('virus-active');

    triggerFakeDownload();
    playAlarm();
    redFlash.classList.add('flashing');
    virusWarning.classList.remove('hidden');
    if (virusTaskbar) virusTaskbar.classList.remove('hidden');
    updateVirusClock();
    clockInterval = setInterval(updateVirusClock, 1000);
    runTerminal();
    runScanCounter();

    VIRUS_MESSAGES.forEach((msg, i) => spawnPopup(msg, i * 420 + 300));

    queueTimer(() => {
      stopAlarm();
      clearVirusTimers();
      document.body.classList.remove('virus-active');
      redFlash.classList.remove('flashing');
      virusScreen.classList.add('hidden');
      virusPopups.innerHTML = '';
      virusWarning.classList.add('hidden');
      if (virusTerminal) virusTerminal.classList.add('hidden');
      if (virusDownload) virusDownload.classList.add('hidden');
      if (virusTaskbar) virusTaskbar.classList.add('hidden');
      if (virusTerminalText) virusTerminalText.textContent = '';
      launchGame();
    }, 6500);
  }

  function launchGame() {
    gameWrap.classList.remove('hidden');
    if (typeof window.startSevdeGame === 'function') {
      window.startSevdeGame();
    }
  }

  introStart.addEventListener('click', runVirusSequence);
})();
