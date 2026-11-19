/* Scene interactions, generative decorations and canvas celebrations. */
(function () {
  "use strict";

  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = reduceQuery.matches;
  const timers = new Set();
  let matrixRaf = 0;
  let celebrationRaf = 0;
  let memoryTimer = 0;
  let memoryIndex = 0;
  let computerBooted = false;
  let computerTyped = false;
  let chandelierLit = false;
  let gardenEntered = false;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const rand = (min, max) => Math.random() * (max - min) + min;
  const sceneEl = (index) => document.querySelector(`.scene[data-scene="${index}"]`);

  function later(fn, delay) {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, delay);
    timers.add(id);
    return id;
  }

  function clearLater() {
    timers.forEach((id) => window.clearTimeout(id));
    timers.clear();
  }

  reduceQuery.addEventListener?.("change", (event) => {
    reduceMotion = event.matches;
    if (reduceMotion) {
      stopMatrix();
      stopCelebration();
      document.querySelectorAll(".burst-petal, .star-spark").forEach((el) => el.remove());
    } else if (document.body.dataset.scene === "4") {
      startMatrix();
    } else if (document.body.dataset.scene === "13") {
      startCelebration();
    }
  });

  /* ---------------- ambient generated decoration ---------------- */
  function buildAmbientDecor() {
    $$(".ambient-petals").forEach((container) => {
      if (container.dataset.populated) return;
      container.dataset.populated = "true";
      const count = Number(container.dataset.petals || 10);
      for (let i = 0; i < count; i += 1) {
        const petal = document.createElement("span");
        petal.className = "petal";
        petal.style.left = `${rand(0, 100)}%`;
        petal.style.setProperty("--fall-duration", `${rand(13, 26)}s`);
        petal.style.setProperty("--fall-delay", `${rand(-25, 0)}s`);
        petal.style.setProperty("--petal-drift", `${rand(-65, 65)}px`);
        petal.style.setProperty("--petal-rotate", `${rand(-25, 60)}deg`);
        petal.style.opacity = String(rand(.2, .55));
        if (i % 4 === 0) petal.style.background = "linear-gradient(135deg, rgba(185,110,121,.7), rgba(246,221,226,.35))";
        container.appendChild(petal);
      }
    });

    $$(".twinkle-field").forEach((container) => {
      if (container.dataset.populated) return;
      container.dataset.populated = "true";
      const count = Number(container.dataset.twinkles || 16);
      for (let i = 0; i < count; i += 1) {
        const star = document.createElement("span");
        star.className = "twinkle";
        star.style.left = `${rand(2, 98)}%`;
        star.style.top = `${rand(2, 98)}%`;
        star.style.setProperty("--twinkle-duration", `${rand(2.8, 6.5)}s`);
        star.style.setProperty("--twinkle-delay", `${rand(-6, 0)}s`);
        container.appendChild(star);
      }
    });

    $$(".night-stars").forEach((container) => {
      if (container.dataset.populated) return;
      container.dataset.populated = "true";
      const count = Number(container.dataset.stars || 60);
      for (let i = 0; i < count; i += 1) {
        const star = document.createElement("span");
        star.className = `night-star${i % 13 === 0 ? " night-star--big" : ""}`;
        star.style.left = `${rand(0, 100)}%`;
        star.style.top = `${rand(0, 88)}%`;
        star.style.setProperty("--star-duration", `${rand(3.5, 8)}s`);
        star.style.setProperty("--star-delay", `${rand(-8, 0)}s`);
        container.appendChild(star);
      }
    });

    $$(".fireflies").forEach((container) => {
      if (container.dataset.populated) return;
      container.dataset.populated = "true";
      const count = Number(container.dataset.fireflies || 14);
      for (let i = 0; i < count; i += 1) {
        const fly = document.createElement("span");
        fly.className = "firefly";
        fly.style.left = `${rand(2, 98)}%`;
        fly.style.top = `${rand(38, 92)}%`;
        fly.style.setProperty("--fly-duration", `${rand(9, 18)}s`);
        fly.style.setProperty("--fly-delay", `${rand(-18, 0)}s`);
        container.appendChild(fly);
      }
    });

    $$(".heart-particles").forEach((container) => {
      if (container.dataset.populated) return;
      container.dataset.populated = "true";
      const count = Number(container.dataset.heartParticles || 12);
      for (let i = 0; i < count; i += 1) {
        const heart = document.createElement("span");
        heart.className = "heart-particle";
        heart.textContent = i % 4 === 0 ? "✦" : "♥";
        heart.style.left = `${rand(3, 97)}%`;
        heart.style.bottom = `${rand(2, 35)}%`;
        heart.style.setProperty("--hp-size", `${rand(7, 14)}px`);
        heart.style.setProperty("--hp-duration", `${rand(12, 25)}s`);
        heart.style.setProperty("--hp-delay", `${rand(-25, 0)}s`);
        container.appendChild(heart);
      }
    });
  }

  /* ---------------- matrix / digital bouquet ---------------- */
  function startMatrix() {
    const canvas = document.getElementById("matrixCanvas");
    const scene = sceneEl(4);
    if (!canvas || !scene || !scene.classList.contains("is-active")) return;
    stopMatrix();
    if (reduceMotion) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        ctx.fillStyle = "rgba(5,14,8,.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = 0;
    let height = 0;
    let columns = [];
    let last = 0;
    const words = ["XOXO", "LOVE", "DODY", "21.11.2006", "HAPPY", "SMILE", "♥", "✦", "♡"];
    const glyphs = "01DODYLOVE♡♥✦✧";

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = scene.clientWidth;
      height = scene.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gap = Math.max(21, width / 26);
      const count = Math.ceil(width / gap) + 1;
      columns = Array.from({ length: count }, (_, index) => ({
        x: index * gap,
        y: rand(-height, height),
        speed: rand(52, 128),
        chars: []
      }));
    }

    function draw(time) {
      if (!last) last = time;
      const delta = Math.min(60, time - last) / 1000;
      last = time;
      ctx.fillStyle = "rgba(4, 12, 7, .09)";
      ctx.fillRect(0, 0, width, height);
      ctx.textAlign = "center";
      ctx.font = "13px monospace";
      ctx.shadowColor = "rgba(141, 208, 133, .55)";
      ctx.shadowBlur = 6;
      columns.forEach((column, index) => {
        const char = Math.random() > .86
          ? words[Math.floor(Math.random() * words.length)]
          : glyphs[Math.floor(Math.random() * glyphs.length)];
        const oldY = column.y;
        column.y += column.speed * delta;
        ctx.fillStyle = index % 7 === 0 ? "rgba(238, 214, 136, .95)" : "rgba(157, 226, 148, .8)";
        if (index % 9 === 0) ctx.fillStyle = "rgba(246, 221, 226, .85)";
        ctx.fillText(char, column.x, oldY);
        if (column.y > height + 20) {
          column.y = rand(-height * .7, -20);
          column.speed = rand(52, 128);
        }
      });
      ctx.shadowBlur = 0;
      matrixRaf = window.requestAnimationFrame(draw);
    }

    resize();
    matrixRaf = window.requestAnimationFrame(draw);
  }

  function stopMatrix() {
    if (matrixRaf) window.cancelAnimationFrame(matrixRaf);
    matrixRaf = 0;
  }

  /* ---------------- envelope and bloom ---------------- */
  const bigEnvelope = document.getElementById("bigEnvelope");
  const envelopeLetter = document.getElementById("envelopeLetter");
  bigEnvelope?.addEventListener("click", () => {
    if (bigEnvelope.getAttribute("aria-expanded") === "true") return;
    bigEnvelope.setAttribute("aria-expanded", "true");
    bigEnvelope.classList.add("is-opening");
    later(() => {
      if (!envelopeLetter) return;
      envelopeLetter.classList.add("is-visible");
      envelopeLetter.setAttribute("aria-hidden", "false");
    }, reduceMotion ? 50 : 1050);
  });

  /* ---------------- retro computer ---------------- */
  const computerSceneEl = sceneEl(5);
  const retroDesktop = document.getElementById("retroDesktop");
  const bootLoad = document.getElementById("bootLoad");
  const loadBar = document.getElementById("loadBar");
  const loadPercent = document.getElementById("loadPercent");
  const loadFile = document.getElementById("loadFile");
  const powerFlash = document.getElementById("powerFlash");
  const computerMatrixCanvas = document.getElementById("computerMatrixCanvas");
  const fakeCursor = document.getElementById("fakeCursor");
  const mainPower = document.getElementById("mainPower");
  const powerBtn = document.getElementById("powerBtn");
  const restartBtn = document.getElementById("restartBtn");
  const bootedLabel = document.getElementById("bootedLabel");
  const pcSubtitle = document.getElementById("pcSubtitle");
  const letterTypewriter = document.getElementById("letterTypewriter");
  const letterDynamic = document.getElementById("letterDynamic");
  const songWindow = document.getElementById("songWindow");
  const songToggle = document.getElementById("songToggle");
  const songStatus = document.getElementById("songStatus");
  const personalAudio = document.getElementById("personalAudio");
  let lastWindowTrigger = null;

  let computerPowered = false;
  let computerTouched = false;
  const computerTimers = [];
  const computerIntervals = [];
  let computerZTop = 20;
  let computerMatrixRaf = 0;
  function computerLater(fn, ms) { const t = window.setTimeout(fn, reduceMotion ? Math.min(ms, 70) : ms); computerTimers.push(t); return t; }
  function computerEvery(fn, ms) { const i = window.setInterval(fn, ms); computerIntervals.push(i); return i; }
  function clearComputerTimers() {
    computerTimers.forEach((id) => window.clearTimeout(id)); computerTimers.length = 0;
    computerIntervals.forEach((id) => window.clearInterval(id)); computerIntervals.length = 0;
    if (computerMatrixRaf) window.cancelAnimationFrame(computerMatrixRaf);
    computerMatrixRaf = 0;
  }

  /* ---------- كيبورد مرسوم ---------- */
  (function buildKeyboard() {
    var kb = document.getElementById("keyboard");
    var rows = [
      ["Q","W","E","R","T","Y","U","I","O","P"],
      ["A","S","D","F","G","H","J","K","L"],
      ["Z","X","C","V","B","N","M","♥"],
      ["Ctrl","Alt","", "DODY ♥", ""]
    ];
    rows.forEach(function (row, ri) {
      var div = document.createElement("div"); div.className = "kb-row";
      row.forEach(function (label, ci) {
        var k = document.createElement("span"); k.className = "key";
        if (ri === 3 && ci === 2) { k.className = "key key--space"; }
        else if (ri === 3) { k.className = "key key--wide" + (ci === 3 ? " key--pink" : " key--mint"); }
        else if (label === "♥") { k.className = "key key--pink"; }
        k.textContent = label;
        div.appendChild(k);
      });
      kb.appendChild(div);
    });
  })();

  /* ---------- ساعة شريط المهام ---------- */
  function tickClock() {
    var el = document.getElementById("taskClock");
    if (!el) return;
    try { el.textContent = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); } catch (e) {}
  }
  tickClock(); setInterval(tickClock, 20000);

  /* ---------- الماتريكس ---------- */
  /* One rain column set + one painted frame, shared by the animated and the
     reduced-motion paths so both show the same green rain. */
  function buildMatrixCols(W, H) {
    var glyphs = "01DODYLOVE♡♥✦✧";
    var words = ["XOXO", "LOVE", "DODY", "21.11", "HAPPY", "SMILE", "♥", "✦"];
    var gap = 34, cols = [];
    /* Columns must START inside the visible canvas (y in [0, H]): the old
       code spawned them above it (y in [-H, 0]) at 60-150px/s, so in the
       2s matrix phase almost no glyph ever fell into view — the rain was
       invisible in a real browser even though fillText was being called. */
    for (var i = 0; i < Math.ceil(W / gap); i++) cols.push({ x: i * gap + 14, y: Math.random() * H, s: 60 + Math.random() * 90 });
    return { glyphs: glyphs, words: words, cols: cols };
  }
  function paintMatrixFrame(ctx, W, H, rain, fade) {
    if (fade) { ctx.fillStyle = "rgba(4,11,6,.16)"; ctx.fillRect(0, 0, W, H); }
    ctx.font = "17px monospace"; ctx.textAlign = "center";
    rain.cols.forEach(function (c, idx) {
      var ch = Math.random() > .88 ? rain.words[(Math.random() * rain.words.length) | 0] : rain.glyphs[(Math.random() * rain.glyphs.length) | 0];
      ctx.fillStyle = idx % 7 === 0 ? "rgba(240,216,140,.95)" : (idx % 9 === 0 ? "rgba(246,200,214,.9)" : "rgba(150,226,145,.85)");
      ctx.fillText(ch, c.x, c.y);
      c.y += c.s * .016;
      if (c.y > H + 24) { c.y = Math.random() * -160; c.s = 60 + Math.random() * 90; }
    });
  }
  function startComputerMatrix(done) {
    if (!computerMatrixCanvas) { done(); return; }
    var ctx = computerMatrixCanvas.getContext("2d");
    if (!ctx) { done(); return; }
    var W = computerMatrixCanvas.width, H = computerMatrixCanvas.height;
    var dur = 2000, finished = false;
    function finish() {
      if (finished) return; finished = true;
      if (computerMatrixRaf) { window.cancelAnimationFrame(computerMatrixRaf); computerMatrixRaf = 0; }
      computerMatrixCanvas.classList.remove("show");
      try { ctx.clearRect(0, 0, W, H); } catch (e) {}
      done();
    }
    computerMatrixCanvas.classList.add("show");
    if (reduceMotion) {
      /* Reduced motion: no animation, but the rain must still be SEEN. The old
         code skipped the matrix entirely here, so on any browser with
         prefers-reduced-motion the boot jumped straight to the loading screen
         and the rain never appeared. Paint one still frame of the rain and
         hold it for the same ~2s instead. */
      var rain = buildMatrixCols(W, H);
      rain.cols.forEach(function (c) { c.y = Math.random() * H; });
      ctx.fillStyle = "#040b06"; ctx.fillRect(0, 0, W, H);
      paintMatrixFrame(ctx, W, H, rain, false);
      var stillTimer = window.setTimeout(finish, dur);
      computerTimers.push(stillTimer);
      return;
    }
    var live = buildMatrixCols(W, H);
    /* Paint the first frame immediately, so the rain is visible even if the
       browser throttles requestAnimationFrame. */
    paintMatrixFrame(ctx, W, H, live, true);
    var start = null;
    function frame(ts) {
      if (finished) return;
      if (!start) start = ts;
      paintMatrixFrame(ctx, W, H, live, true);
      if (ts - start < dur) { computerMatrixRaf = requestAnimationFrame(frame); }
      else { finish(); }
    }
    computerMatrixRaf = requestAnimationFrame(frame);
    /* Watchdog: if rAF stalls (background tab), the boot must still finish. */
    var watchdog = window.setTimeout(finish, dur + 600);
    computerTimers.push(watchdog);
  }

  /* ---------- التشغيل ---------- */
  var loadFiles = ["heart.exe", "letter.txt", "our_song.mp3", "future_plans.exe"];
  function powerOnComputer() {
    if (computerPowered) return;
    computerPowered = true;
    computerSceneEl.classList.add("is-on");
    mainPower.setAttribute("aria-pressed", "true");
    powerBtn.setAttribute("aria-pressed", "true");
    mainPower.hidden = true;
    powerFlash.classList.remove("go"); void powerFlash.offsetWidth; powerFlash.classList.add("go");
    pcSubtitle.textContent = "بيفتح… استني ثواني يا دودي 💗";
    startComputerMatrix(function () {
      bootLoad.classList.add("show"); bootLoad.setAttribute("aria-hidden", "false");
      var p = 0;
      var iv = computerEvery(function () {
        p = Math.min(100, p + 3 + Math.random() * 6);
        loadBar.style.width = p + "%";
        loadPercent.textContent = Math.floor(p) + "%";
        loadFile.textContent = loadFiles[Math.min(loadFiles.length - 1, Math.floor(p / (100 / loadFiles.length)))];
        if (p >= 100) {
          window.clearInterval(iv);
          computerLater(finishComputerBoot, 620);
        }
      }, 130);
    });
  }
  function finishComputerBoot() {
    computerBooted = true;
    bootLoad.classList.remove("show"); bootLoad.setAttribute("aria-hidden", "true");
    retroDesktop.classList.add("is-visible"); retroDesktop.setAttribute("aria-hidden", "false");
    pcSubtitle.textContent = "سطح المكتب جاهز… دوسي على كل أيقونة وشوفي اللي جواها.";
    bootedLabel.hidden = false; restartBtn.hidden = false;
    runCursorStory();
  }
  function powerOffComputer() {
    clearComputerTimers();
    computerPowered = false; computerBooted = false; computerTyped = false; computerTouched = false;
    computerSceneEl.classList.remove("is-on");
    mainPower.setAttribute("aria-pressed", "false");
    powerBtn.setAttribute("aria-pressed", "false");
    mainPower.hidden = false; bootedLabel.hidden = true; restartBtn.hidden = true;
    bootLoad.classList.remove("show"); bootLoad.setAttribute("aria-hidden", "true");
    retroDesktop.classList.remove("is-visible"); retroDesktop.setAttribute("aria-hidden", "true");
    computerMatrixCanvas.classList.remove("show");
    var ctx = computerMatrixCanvas.getContext("2d"); if (ctx) ctx.clearRect(0, 0, computerMatrixCanvas.width, computerMatrixCanvas.height);
    loadBar.style.width = "0%"; loadPercent.textContent = "0%";
    document.querySelectorAll(".retro-window").forEach(function (w) { w.classList.add("is-hidden"); w.setAttribute("aria-hidden", "true"); w.style.left = ""; w.style.top = ""; w.style.right = ""; w.style.bottom = ""; });
    letterDynamic.hidden = true; letterDynamic.classList.remove("is-visible");
    letterTypewriter.textContent = "يا دعاء…"; letterTypewriter.classList.remove("done");
    fakeCursor.classList.remove("show");
    pcSubtitle.textContent = "بس جواه حاجات لسه جديدة خالص. دوسي زرار الباور، واستني التحميل، وبعدين دوسي على كل أيقونة.";
    syncSongVisual();
  }

  /* ---------- قصة المؤشر ---------- */
  function moveCursor(leftPct, topPct) { fakeCursor.style.left = leftPct + "%"; fakeCursor.style.top = topPct + "%"; }
  function cursorClickAt(leftPct, topPct) {
    fakeCursor.classList.remove("clicking"); void fakeCursor.offsetWidth; fakeCursor.classList.add("clicking");
    var r = document.createElement("span"); r.className = "click-ripple";
    r.style.left = (leftPct + 1) + "%"; r.style.top = (topPct + 1) + "%";
    retroDesktop.appendChild(r); setTimeout(function () { r.remove(); }, 600);
  }
  function runCursorStory() {
    if (reduceMotion) { openRetroWindow("letterWindow"); startTypewriter(); return; }
    fakeCursor.classList.add("show");
    moveCursor(52, 58);
    /* Letter icon position depends on the layout: on phones the icons are a
       2-row × 3-col RTL grid, so letter.txt is the top-right cell; on desktop
       they are a column at the inline-end side (left in RTL), so it is the
       top of that column. The old fixed (90.5, 6) pointed at empty space on
       desktop and slightly off the cell on phones. */
    var letterPos = window.matchMedia("(max-width: 680px)").matches ? [82, 9] : [8, 6];
    computerLater(function () { if (computerTouched) return; moveCursor(letterPos[0], letterPos[1]); }, 500);
    computerLater(function () {
      if (computerTouched) return;
      cursorClickAt(letterPos[0], letterPos[1]);
      var icon = document.getElementById("iconLetter");
      icon.classList.remove("picked"); void icon.offsetWidth; icon.classList.add("picked");
      openRetroWindow("letterWindow"); startTypewriter();
    }, 1650);
    computerLater(function () { if (computerTouched) return; moveCursor(46, 84); }, 2300);
    computerLater(function () { fakeCursor.classList.remove("show"); }, 3600);
  }
  retroDesktop.addEventListener("pointerdown", function () {
    if (!computerTouched) { computerTouched = true; fakeCursor.classList.remove("show"); }
  });

  /* ---------- النوافذ ---------- */
  function openRetroWindow(id, options = {}) {
    const win = document.getElementById(id);
    if (!win) return;
    lastWindowTrigger = options.focus === false ? lastWindowTrigger : document.activeElement;
    const wasHidden = win.classList.contains("is-hidden");
    win.classList.remove("is-hidden");
    win.setAttribute("aria-hidden", "false");
    win.style.zIndex = String(++computerZTop);
    if (wasHidden) { win.classList.remove("opening"); void win.offsetWidth; win.classList.add("opening"); }
    if (options.focus !== false) win.querySelector("[data-window-close]")?.focus({ preventScroll: true });
    if (id === "letterWindow" && computerBooted && !computerTyped) startTypewriter();
    if (id === "songWindow") syncSongVisual();
  }
  function closeRetroWindow(id, options = {}) {
    const win = document.getElementById(id);
    if (!win) return;
    win.classList.add("is-hidden");
    win.setAttribute("aria-hidden", "true");
    if (options.restoreFocus !== false && lastWindowTrigger instanceof HTMLElement) {
      lastWindowTrigger.focus({ preventScroll: true });
    }
  }
  document.addEventListener("click", (event) => {
    const openTrigger = event.target.closest("[data-window-open]");
    if (openTrigger) {
      event.preventDefault();
      computerTouched = true;
      fakeCursor.classList.remove("show");
      openRetroWindow(openTrigger.dataset.windowOpen);
      return;
    }
    const closeTrigger = event.target.closest("[data-window-close]");
    if (closeTrigger) {
      event.preventDefault();
      closeRetroWindow(closeTrigger.dataset.windowClose);
    }
  });
  document.querySelectorAll(".retro-window").forEach(function (win) {
    win.addEventListener("pointerdown", function () { win.style.zIndex = ++computerZTop; });
  });

  /* سحب النوافذ من الشريط الأزرق */
  document.querySelectorAll("[data-drag]").forEach(function (bar) {
    bar.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button")) return;
      var win = bar.closest(".retro-window");
      var dRect = retroDesktop.getBoundingClientRect();
      var wRect = win.getBoundingClientRect();
      var startX = e.clientX, startY = e.clientY;
      var startL = wRect.left - dRect.left, startT = wRect.top - dRect.top;
      win.style.left = startL + "px"; win.style.top = startT + "px";
      win.style.right = "auto"; win.style.bottom = "auto"; win.style.insetInlineStart = "auto"; win.style.insetInlineEnd = "auto";
      win.style.margin = "0"; win.style.zIndex = ++computerZTop;
      function move(ev) {
        var nl = Math.max(-wRect.width * .35, Math.min(dRect.width - 60, startL + ev.clientX - startX));
        var nt = Math.max(0, Math.min(dRect.height - 34, startT + ev.clientY - startY));
        win.style.left = nl + "px"; win.style.top = nt + "px";
      }
      function up() { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  });

  /* ---------- آلة الكتابة + بوب أب القلب ---------- */
  function startTypewriter() {
    if (computerTyped || !letterTypewriter) return;
    var full = "يا دعاء…";
    if (reduceMotion) { letterTypewriter.textContent = full; showDynamicLetter(); return; }
    letterTypewriter.textContent = "";
    var i = 0;
    var iv = computerEvery(function () {
      i++; letterTypewriter.textContent = full.slice(0, i);
      if (i >= full.length) { window.clearInterval(iv); showDynamicLetter(); }
    }, 120);
  }
  function showDynamicLetter() {
    if (!letterDynamic || computerTyped) return;
    computerTyped = true;
    letterTypewriter.classList.add("done");
    letterDynamic.hidden = false;
    window.requestAnimationFrame(() => { letterDynamic.classList.add("is-visible"); });
    computerLater(() => {
      const heart = document.getElementById("heartWindow");
      if (document.body.dataset.scene === "5" && computerPowered && heart?.classList.contains("is-hidden")) {
        openRetroWindow("heartWindow", { focus: false, automatic: true });
      }
    }, 4200);
  }

  /* ---------- الأغنية — تشغيل حقيقي عبر js/music.js ---------- */
  /* The window only mirrors the site's real player (personal song =
     "Rewrite The Stars", assets/audio/personal-song.mp4). It never fakes
     playback: the toggle calls window.dodyMusic and the visuals follow the
     audio element and the dody:track-change event. */
  function songIsPlaying() {
    return Boolean(window.dodyMusic && window.dodyMusic.current() === "personal" && window.dodyMusic.isPlaying());
  }
  function syncSongVisual() {
    if (!songWindow || !songToggle || !songStatus) return;
    const playing = songIsPlaying();
    songWindow.classList.toggle("is-playing", playing);
    songToggle.textContent = playing ? "❚❚ إيقاف مؤقت" : "▶ شغّلي Our Song";
    songStatus.textContent = playing ? "♪ now playing — Rewrite The Stars ♥" : "♪ ready — our song";
  }
  songToggle?.addEventListener("click", () => {
    if (!window.dodyMusic) return;
    if (songIsPlaying()) window.dodyMusic.pause();
    else window.dodyMusic.playPersonal();
  });
  document.addEventListener("dody:track-change", syncSongVisual);
  personalAudio?.addEventListener("play", syncSongVisual);
  personalAudio?.addEventListener("pause", syncSongVisual);
  personalAudio?.addEventListener("ended", syncSongVisual);

  /* ---------- أزرار الباور ---------- */
  mainPower.addEventListener("click", powerOnComputer);
  powerBtn.addEventListener("click", function () { computerPowered ? powerOffComputer() : powerOnComputer(); });
  restartBtn.addEventListener("click", function () { powerOffComputer(); computerLater(powerOnComputer, 450); });
  document.getElementById("crt").addEventListener("dblclick", function () { if (!computerPowered) powerOnComputer(); });

  /* Reset the computer to its off state (used by resetJourney). */
  function resetComputer() {
    powerOffComputer();
  }
  syncSongVisual();

  /* ---------------- garden of words ---------------- */
  const enterGarden = document.getElementById("enterGarden");
  const gardenIntro = document.getElementById("gardenIntro");
  const gardenContent = document.getElementById("gardenContent");
  enterGarden?.addEventListener("click", () => {
    gardenEntered = true;
    if (gardenIntro) gardenIntro.hidden = true;
    if (gardenContent) {
      gardenContent.hidden = false;
      gardenContent.classList.add("is-entered");
      gardenContent.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
    window.dodyApp?.notify?.("اتفرجي على الورد… أقصد الكلام 🌷", 2400);
  });

  document.addEventListener("click", (event) => {
    const cardButton = event.target.closest(".word-card__button");
    if (!cardButton) return;
    const card = cardButton.closest(".word-card");
    const message = card?.querySelector(".word-card__message");
    const expanded = cardButton.getAttribute("aria-expanded") === "true";
    cardButton.setAttribute("aria-expanded", String(!expanded));
    if (message) {
      message.hidden = expanded;
      message.classList.toggle("is-visible", !expanded);
    }
  });

  /* ---------------- gift ---------------- */
  const giftBox = document.getElementById("giftBox");
  const giftLetter = document.getElementById("giftLetter");
  giftBox?.addEventListener("click", () => {
    if (giftBox.getAttribute("aria-expanded") === "true") return;
    giftBox.setAttribute("aria-expanded", "true");
    giftBox.classList.add("is-opening");
    burstPetals(sceneEl(7));
    later(() => {
      if (!giftLetter) return;
      giftLetter.classList.add("is-visible");
      giftLetter.setAttribute("aria-hidden", "false");
      giftLetter.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }, reduceMotion ? 100 : 900);
    window.dodyApp?.notify?.("كل اللي جوايا… في الجواب ده 💌", 2600);
  });

  /* ---------------- realistic rose flood (gift) ---------------- */
  /* Five rose palettes. Each palette is painted once to an offscreen
     canvas at runtime and stamped as data-URL backgrounds on the grid
     spans. Canvas sprites are code-generated, not image files. */
  var ROSE_PALETTES = [
    { deep: "#8c2f45", base: "#c65a72", mid: "#e08a99", light: "#f6cdd4", cream: "#fdeef0", core: "#5e1a28" },
    { deep: "#a83a52", base: "#d16b7e", mid: "#e89aa8", light: "#f8d3d8", cream: "#fdf0f1", core: "#6e1f30" },
    { deep: "#7d4e63", base: "#a86a82", mid: "#c99aad", light: "#e8c9d6", cream: "#f9ecf0", core: "#54253a" },
    { deep: "#b06a3e", base: "#d99a6b", mid: "#eab98f", light: "#f6dcc4", cream: "#fdf3e7", core: "#7c4522" },
    { deep: "#96506b", base: "#c07a92", mid: "#dda6b8", light: "#f2d3dc", cream: "#fbeef1", core: "#5f2a3e" }
  ];
  var roseSprites = null;
  /* Gradient with a solid-color fallback (jsdom canvas stubs have no
     addColorStop, and a failed gradient must never throw). */
  function safeGradient(ctx, kind, args, stops) {
    try {
      var g = kind === "radial"
        ? ctx.createRadialGradient.apply(ctx, args)
        : ctx.createLinearGradient.apply(ctx, args);
      if (g && typeof g.addColorStop === "function") {
        stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
        return g;
      }
    } catch (e) { /* fall through to solid */ }
    return stops[stops.length - 1][1];
  }
  /* Paint one realistic rose: ruffled layered petals, radial shading,
     spiral core, veins, highlight, soft shadow. Returns a data URL. */
  function paintRoseSprite(palette, size) {
    var c = document.createElement("canvas");
    c.width = size; c.height = size;
    var ctx = c.getContext("2d");
    if (!ctx) return null;
    var cx = size / 2, cy = size / 2, R = size / 2;
    var i, a, px, py;
    try {
      ctx.save();
      ctx.fillStyle = "rgba(90,20,35,.28)";
      ctx.beginPath();
      ctx.ellipse(cx + R * .06, cy + R * .1, R * .86, R * .8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      for (i = 0; i < 6; i += 1) { // outer ruffled petals
        a = (i / 6) * Math.PI * 2 + .35;
        px = cx + Math.cos(a) * R * .52; py = cy + Math.sin(a) * R * .52;
        ctx.save();
        ctx.translate(px, py); ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = safeGradient(ctx, "radial", [0, 0, 4, 0, 0, R * .52],
          [[0, palette.light], [.7, palette.base], [1, palette.deep]]);
        ctx.beginPath(); ctx.ellipse(0, 0, R * .34, R * .5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      for (i = 0; i < 5; i += 1) { // middle layer, deeper
        a = (i / 5) * Math.PI * 2 + .9;
        px = cx + Math.cos(a) * R * .3; py = cy + Math.sin(a) * R * .3;
        ctx.save();
        ctx.translate(px, py); ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = safeGradient(ctx, "radial", [0, 0, 2, 0, 0, R * .34],
          [[0, palette.mid], [.75, palette.base], [1, palette.deep]]);
        ctx.beginPath(); ctx.ellipse(0, 0, R * .24, R * .34, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.save(); // inner cup + spiral core
      ctx.fillStyle = safeGradient(ctx, "radial", [cx, cy, 1, cx, cy, R * .3],
        [[0, palette.cream], [.6, palette.light], [1, palette.mid]]);
      ctx.beginPath(); ctx.arc(cx, cy, R * .3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = palette.core;
      ctx.lineWidth = Math.max(1.5, size * .02);
      ctx.lineCap = "round";
      ctx.beginPath();
      for (var t = 0; t <= Math.PI * 4.5; t += .25) {
        var r = (t / (Math.PI * 4.5)) * R * .2;
        var sx = cx + Math.cos(t) * r, sy = cy + Math.sin(t) * r;
        if (t === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.restore();
      ctx.save(); // veins
      ctx.strokeStyle = "rgba(255,255,255,.28)";
      ctx.lineWidth = Math.max(1, size * .008);
      for (i = 0; i < 6; i += 1) {
        a = (i / 6) * Math.PI * 2 + .5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R * .18, cy + Math.sin(a) * R * .18);
        ctx.quadraticCurveTo(
          cx + Math.cos(a + .2) * R * .55, cy + Math.sin(a + .2) * R * .55,
          cx + Math.cos(a) * R * .82, cy + Math.sin(a) * R * .82);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save(); // highlight
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.beginPath(); ctx.ellipse(cx - R * .3, cy - R * .38, R * .2, R * .12, -.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } catch (e) { return null; }
    try { return c.toDataURL(); } catch (e) { return null; }
  }
  function roseSprite(index) {
    if (!roseSprites) {
      roseSprites = ROSE_PALETTES.map(function (p) { return paintRoseSprite(p, 240); });
    }
    return roseSprites[index % roseSprites.length];
  }

  function burstPetals(scene) {
    if (!scene || reduceMotion) return;
    const layer = document.createElement("div");
    layer.className = "petal-burst-layer";
    layer.setAttribute("aria-hidden", "true");
    const paletteColors = ["#d6a5ad", "#b96e79", "#f6dde2", "#fff9f5", "#7d4e63", "#e8c0b6"];
    let i, petal, rose;

    function burstWave(count, delayMin, delayMax, upOnly) {
      for (let k = 0; k < count; k += 1) {
        petal = document.createElement("span");
        petal.className = "burst-petal";
        petal.style.setProperty("--bx", `${rand(-90, 90)}vw`);
        petal.style.setProperty("--by", upOnly ? `${rand(-85, -10)}vh` : `${rand(-85, 25)}vh`);
        petal.style.setProperty("--br", `${rand(-540, 540)}deg`);
        petal.style.setProperty("--bd", `${rand(2.2, 4.5)}s`);
        petal.style.setProperty("--bdelay", `${rand(delayMin, delayMax)}s`);
        petal.style.setProperty("--bcolor", paletteColors[k % paletteColors.length]);
        const size = rand(12, 30);
        petal.style.width = `${size}px`;
        petal.style.height = `${size * 1.5}px`;
        petal.style.insetInlineStart = `${rand(35, 65)}%`;
        petal.style.insetBlockStart = `${rand(32, 58)}%`;
        layer.appendChild(petal);
      }
    }
    burstWave(90, 0, .5, true);      // wave 1: fast, upward
    burstWave(60, .45, 1.1, false);  // wave 2: wider, drifts down too

    // Rose grid: two offset passes, edge to edge, no gaps.
    // ~270 roses on a phone (390x844), ~600 on a desktop viewport.
    const w = scene.clientWidth || window.innerWidth || 390;
    const h = scene.clientHeight || window.innerHeight || 844;
    const step = 56;
    const cols = Math.ceil(w / step) + 1;
    const rows = Math.ceil(h / step) + 1;
    for (let pass = 0; pass < 2; pass += 1) {
      for (let r = 0; r < rows; r += 1) {
        for (let cI = 0; cI < cols; cI += 1) {
          rose = document.createElement("span");
          rose.className = "burst-rose";
          const rs = rand(62, 100);
          rose.style.width = `${rs}px`;
          rose.style.height = `${rs}px`;
          rose.style.left = `${cI * step + (pass ? step / 2 : 0) - rs / 2}px`;
          rose.style.top = `${r * step + (pass ? step / 2 : 0) - rs / 2}px`;
          rose.style.setProperty("--rdelay", `${rand(0, .8)}s`);
          rose.style.setProperty("--rrot", `${rand(-18, 18)}deg`);
          const sprite = roseSprite((r * cols + cI + pass) % ROSE_PALETTES.length);
          if (sprite) rose.style.backgroundImage = `url(${sprite})`;
          else rose.style.background = "radial-gradient(circle at 35% 30%, #f6cdd4, #c65a72 55%, #8c2f45)";
          layer.appendChild(rose);
        }
      }
    }

    // Falling petals afterward, raining down over the roses.
    for (i = 0; i < 120; i += 1) {
      petal = document.createElement("span");
      petal.className = "burst-petal burst-petal--fall";
      const fs = rand(10, 22);
      petal.style.width = `${fs}px`;
      petal.style.height = `${fs * 1.5}px`;
      petal.style.left = `${rand(0, 100)}%`;
      petal.style.top = "-24px";
      petal.style.setProperty("--fdelay", `${rand(1.2, 2.5)}s`);
      petal.style.setProperty("--fd", `${rand(3.5, 5)}s`);
      petal.style.setProperty("--fdrift", `${rand(-70, 70)}px`);
      petal.style.setProperty("--bcolor", paletteColors[i % paletteColors.length]);
      layer.appendChild(petal);
    }

    scene.appendChild(layer);
    later(() => layer.remove(), 8000);
  }

  /* ---------------- memories ---------------- */
  const memoryCards = $$("#memoryDeck .memory-card");
  const memoryDots = document.getElementById("memoryDots");

  function buildMemoryDots() {
    if (!memoryDots || memoryDots.childElementCount === memoryCards.length) return;
    memoryDots.innerHTML = "";
    memoryCards.forEach(() => memoryDots.appendChild(document.createElement("i")));
  }

  function showMemory(index) {
    if (!memoryCards.length) return;
    memoryIndex = (index + memoryCards.length) % memoryCards.length;
    memoryCards.forEach((card, i) => card.classList.toggle("is-visible", i === memoryIndex));
    Array.from(memoryDots?.children || []).forEach((dot, i) => dot.classList.toggle("is-active", i === memoryIndex));
  }

  function startMemories() {
    window.clearInterval(memoryTimer);
    buildMemoryDots();
    showMemory(0);
    if (!reduceMotion) {
      memoryTimer = window.setInterval(() => showMemory(memoryIndex + 1), 3600);
    }
  }

  function stopMemories() {
    window.clearInterval(memoryTimer);
    memoryTimer = 0;
  }

  /* ---------------- chandelier ---------------- */
  const lightCandles = document.getElementById("lightCandles");
  const chandelierSvg = document.getElementById("chandelierSvg");
  const chandelierGlow = document.getElementById("chandelierGlow");
  const chandelierPrompt = document.getElementById("chandelierPrompt");
  const chandelierScene = sceneEl(9);
  const chandelierStage = document.getElementById("chandelierStage");
  const relightBtn = document.getElementById("relightBtn");
  const chandelierSubtitle = document.getElementById("chandelierSubtitle");
  const chandelierTimers = [];

  function prepareChandelierStars() {
    const container = document.getElementById("chandelierStars");
    if (!container || container.dataset.populated) return;
    container.dataset.populated = "true";
    for (let i = 0; i < 26; i += 1) {
      const star = document.createElement("span");
      star.className = "chandelier-star";
      star.style.left = `${rand(5, 95)}%`;
      star.style.top = `${rand(5, 80)}%`;
      star.style.setProperty("--cs-delay", `${rand(-5, 0)}s`);
      container.appendChild(star);
    }
  }

  function lightChandelier() {
    if (chandelierLit) return;
    chandelierLit = true;
    chandelierScene?.classList.add("is-lit");
    chandelierGlow?.classList.add("is-lit");
    if (lightCandles) {
      lightCandles.classList.add("is-lit");
      lightCandles.setAttribute("aria-pressed", "true");
      lightCandles.disabled = true;
      lightCandles.hidden = true;
    }
    if (chandelierPrompt) chandelierPrompt.hidden = false;
    if (relightBtn) relightBtn.hidden = false;
    if (chandelierSubtitle) chandelierSubtitle.textContent = "الشموع نورت… اتمني أمنيتك يا دودي ✨🕯️";
    [1, 2, 3].forEach((n, index) => {
      chandelierTimers.push(later(() => {
        document.getElementById(`flame-${n}`)?.classList.add("is-lit");
        document.getElementById(`halo-${n}`)?.classList.add("is-lit");
        chandelierTimers.push(later(() => {
          document.getElementById(`ballerina-${n}`)?.classList.add("is-lit");
        }, reduceMotion ? 50 : 320));
        if (index === 2) window.dodyApp?.notify?.("اتمني أمنيتك… الشموع سامعاها ✨", 3600);
      }, reduceMotion ? 50 : index * 650));
    });
    document.dispatchEvent(new CustomEvent("dody:chandelier-lit"));
  }

  function resetChandelier() {
    chandelierTimers.forEach((id) => { window.clearTimeout(id); timers.delete(id); });
    chandelierTimers.length = 0;
    chandelierLit = false;
    chandelierScene?.classList.remove("is-lit");
    chandelierGlow?.classList.remove("is-lit");
    [1, 2, 3].forEach((n) => {
      ["flame-", "halo-", "ballerina-"].forEach((prefix) => {
        document.getElementById(prefix + n)?.classList.remove("is-lit");
      });
    });
    if (lightCandles) { lightCandles.hidden = false; lightCandles.classList.remove("is-lit"); lightCandles.disabled = false; lightCandles.setAttribute("aria-pressed", "false"); }
    if (chandelierPrompt) chandelierPrompt.hidden = true;
    if (relightBtn) relightBtn.hidden = true;
    if (chandelierSubtitle) chandelierSubtitle.textContent = "عندي ليكي تلات أمنيات… بس لازم تنوري الشموع الأول.";
  }

  lightCandles?.addEventListener("click", lightChandelier);
  relightBtn?.addEventListener("click", resetChandelier);
  chandelierStage?.addEventListener("click", lightChandelier);
  chandelierStage?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); lightChandelier(); }
  });

  /* ---------------- wishes ---------------- */
  function revealWishes() {
    const cards = $$(".wish-card", sceneEl(10) || document);
    cards.forEach((card, index) => {
      card.classList.remove("is-visible");
      later(() => card.classList.add("is-visible"), reduceMotion ? 0 : 400 + index * 700);
    });
  }

  /* ---------------- curtain windows ---------------- */
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".story-window__button");
    if (!button) return;
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    if (!expanded) {
      window.dodyApp?.notify?.("اتفضلي… الكلمة مستنياكي 💗", 1800);
    }
  });

  /* ---------------- extra envelopes ---------------- */
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".mini-envelope__button");
    if (!button) return;
    const envelope = button.closest(".mini-envelope");
    const target = document.getElementById(button.getAttribute("aria-controls"));
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    envelope?.classList.toggle("is-open", !expanded);
    if (target) target.hidden = expanded;
  });

  /* ---------------- love button ---------------- */
  const loveButton = document.getElementById("loveButton");
  const loveReveal = document.getElementById("loveReveal");
  loveButton?.addEventListener("click", () => {
    loveButton.setAttribute("aria-expanded", "true");
    loveReveal?.classList.add("is-visible");
    if (loveButton) loveButton.disabled = true;
    window.dodyApp?.notify?.("ودي كانت آخر حاجة… وأحلى حاجة ❤️", 3200);
  });

  /* ---------------- celebration ---------------- */
  function prepareCelebrationDecor() {
    const balloonField = document.getElementById("balloonField");
    const blooms = document.getElementById("celebrationBlooms");
    if (balloonField && !balloonField.dataset.populated) {
      balloonField.dataset.populated = "true";
      const colors = ["#d6a5ad", "#e8c9c5", "#c7a36a", "#b96e79", "#f6dde2", "#a9bbaa"];
      for (let i = 0; i < 15; i += 1) {
        const balloon = document.createElement("span");
        balloon.className = "balloon";
        balloon.style.insetInlineStart = `${rand(1, 94)}%`;
        balloon.style.insetBlockEnd = `${rand(-25, -5)}%`;
        balloon.style.setProperty("--balloon-w", `${rand(25, 56)}px`);
        balloon.style.setProperty("--balloon-h", `${rand(32, 72)}px`);
        balloon.style.setProperty("--balloon-color", colors[i % colors.length]);
        balloon.style.setProperty("--balloon-duration", `${rand(15, 29)}s`);
        balloon.style.setProperty("--balloon-delay", `${rand(-25, 0)}s`);
        balloonField.appendChild(balloon);
      }
    }
    if (blooms && !blooms.dataset.populated) {
      blooms.dataset.populated = "true";
      for (let i = 0; i < 9; i += 1) {
        const bloom = document.createElement("span");
        bloom.className = "bloom";
        bloom.innerHTML = '<svg viewBox="0 0 80 80" aria-hidden="true"><g fill="currentColor"><circle cx="40" cy="40" r="12"/><circle cx="40" cy="17" r="14"/><circle cx="40" cy="63" r="14"/><circle cx="17" cy="40" r="14"/><circle cx="63" cy="40" r="14"/><circle cx="24" cy="24" r="11" opacity=".7"/><circle cx="56" cy="24" r="11" opacity=".7"/><circle cx="24" cy="56" r="11" opacity=".7"/><circle cx="56" cy="56" r="11" opacity=".7"/><circle cx="40" cy="40" r="7" fill="#f1d9a5"/></g></svg>';
        bloom.style.left = `${rand(1, 91)}%`;
        bloom.style.top = `${rand(4, 88)}%`;
        bloom.style.setProperty("--bloom-size", `${rand(26, 76)}px`);
        bloom.style.setProperty("--bloom-color", ["#d6a5ad", "#b96e79", "#e8c9c5", "#a9bbaa"][i % 4]);
        bloom.style.setProperty("--bloom-duration", `${rand(5, 10)}s`);
        bloom.style.setProperty("--bloom-delay", `${rand(-8, 0)}s`);
        blooms.appendChild(bloom);
      }
    }
  }

  function startCelebration() {
    const scene = sceneEl(13);
    const canvas = document.getElementById("celebrationCanvas");
    if (!scene || !canvas || !scene.classList.contains("is-active")) return;
    stopCelebration();
    prepareCelebrationDecor();
    if (reduceMotion) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = 0;
    let height = 0;
    let particles = [];
    let last = 0;
    const colors = ["#c1737f", "#a9525f", "#b08a4f", "#d9a9b1", "#7f9a82", "#ffffff"];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = scene.clientWidth;
      height = scene.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(105, Math.floor(width / 8));
      particles = Array.from({ length: count }, () => makeParticle(true));
    }

    function makeParticle(initial = false) {
      return {
        x: rand(0, width),
        y: initial ? rand(-height, height) : rand(-80, -10),
        size: rand(4, 10),
        speed: rand(26, 80),
        drift: rand(-18, 18),
        rotation: rand(0, Math.PI * 2),
        spin: rand(-3, 3),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() < .34 ? "heart" : (Math.random() < .55 ? "petal" : "star"),
        opacity: rand(.55, .9)
      };
    }

    function drawHeart(x, y, size, rotation) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      const s = size / 9;
      ctx.moveTo(0, s * 5);
      ctx.bezierCurveTo(-s * 10, -s * 2, -s * 5, -s * 9, 0, -s * 4);
      ctx.bezierCurveTo(s * 5, -s * 9, s * 10, -s * 2, 0, s * 5);
      ctx.fill();
      ctx.restore();
    }

    function drawStar(x, y, size, rotation) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      for (let point = 0; point < 8; point += 1) {
        const radius = point % 2 === 0 ? size : size * .3;
        const angle = (point * Math.PI) / 4;
        if (point === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function frame(time) {
      if (!last) last = time;
      const delta = Math.min(50, time - last) / 1000;
      last = time;
      ctx.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        particle.y += particle.speed * delta;
        particle.x += Math.sin(time / 900 + particle.rotation) * 8 * delta + particle.drift * delta;
        particle.rotation += particle.spin * delta;
        if (particle.y > height + 20) Object.assign(particle, makeParticle());
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        if (particle.shape === "heart") {
          drawHeart(particle.x, particle.y, particle.size, particle.rotation * .1);
        } else if (particle.shape === "star") {
          drawStar(particle.x, particle.y, particle.size, particle.rotation);
        } else {
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);
          ctx.beginPath();
          ctx.ellipse(0, 0, particle.size, particle.size * .55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
      ctx.globalAlpha = 1;
      celebrationRaf = window.requestAnimationFrame(frame);
    }

    resize();
    celebrationRaf = window.requestAnimationFrame(frame);
  }

  function stopCelebration() {
    if (celebrationRaf) window.cancelAnimationFrame(celebrationRaf);
    celebrationRaf = 0;
    const canvas = document.getElementById("celebrationCanvas");
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /* ---------------- scene hooks ---------------- */
  document.addEventListener("dody:scene-change", (event) => {
    const index = event.detail.index;
    if (event.detail.previousIndex === 4) stopMatrix();
    if (event.detail.previousIndex === 8) stopMemories();
    if (event.detail.previousIndex === 13) stopCelebration();

    switch (index) {
      case 4: later(startMatrix, 220); break;
      case 8: startMemories(); break;
      case 9: prepareChandelierStars(); break;
      case 10: revealWishes(); break;
      case 13: later(startCelebration, 250); break;
      default: break;
    }
  });

  document.addEventListener("dody:chandelier-lit", () => {
    const cards = $$(".wish-card", sceneEl(10) || document);
    cards.forEach((card) => card.classList.remove("is-visible"));
  });

  /* ---------------- reset ---------------- */
  function resetJourney() {
    clearLater();
    stopMatrix();
    stopMemories();
    stopCelebration();

    // Gate
    window.dodyGate?.reset();

    // First envelope
    bigEnvelope?.setAttribute("aria-expanded", "false");
    bigEnvelope?.classList.remove("is-opening");
    envelopeLetter?.classList.remove("is-visible");
    envelopeLetter?.setAttribute("aria-hidden", "true");

    // Computer
    resetComputer();

    // Garden
    gardenEntered = false;
    if (gardenIntro) gardenIntro.hidden = false;
    if (gardenContent) { gardenContent.hidden = true; gardenContent.classList.remove("is-entered"); }
    $$(".word-card__button").forEach((button) => {
      button.setAttribute("aria-expanded", "false");
      const message = button.closest(".word-card")?.querySelector(".word-card__message");
      if (message) { message.hidden = true; message.classList.remove("is-visible"); }
    });

    // Gift
    giftBox?.setAttribute("aria-expanded", "false");
    giftBox?.classList.remove("is-opening");
    giftLetter?.classList.remove("is-visible");
    giftLetter?.setAttribute("aria-hidden", "true");
    $$(".petal-burst-layer").forEach((layer) => layer.remove());

    // Chandelier
    resetChandelier();

    // Windows and envelopes
    $$(".story-window__button").forEach((button) => button.setAttribute("aria-expanded", "false"));
    $$(".mini-envelope__button").forEach((button) => {
      button.setAttribute("aria-expanded", "false");
      const target = document.getElementById(button.getAttribute("aria-controls"));
      if (target) target.hidden = true;
      button.closest(".mini-envelope")?.classList.remove("is-open");
    });

    // Love
    loveButton?.setAttribute("aria-expanded", "false");
    if (loveButton) loveButton.disabled = false;
    loveReveal?.classList.remove("is-visible");

    // Wishes/memory
    $$(".wish-card").forEach((card) => card.classList.remove("is-visible"));
    showMemory(0);

    // Scene controller last so the gate is locked and active.
    document.querySelector(".scene-menu")?.setAttribute("hidden", "");
    window.dodyScenes?.closeMenu?.();
    window.dodyScenes?.reset?.();
    window.dodyApp?.notify?.("يلا نعيشها من الأول… المرة دي كمان بكل حب 💗", 3200);
  }

  document.getElementById("restartJourney")?.addEventListener("click", (event) => {
    event.preventDefault();
    resetJourney();
  });

  buildAmbientDecor();
  prepareChandelierStars();
  buildMemoryDots();
  showMemory(0);

  window.dodyInteractions = {
    resetJourney,
    startMatrix,
    startComputer: powerOnComputer,
    resetComputer,
    startCelebration,
    startMemories,
    revealWishes,
    lightChandelier,
    burstPetals,
    getState: () => ({ computerBooted, computerTyped, chandelierLit, gardenEntered, memoryIndex })
  };
})();
