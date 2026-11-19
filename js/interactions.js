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
      stopBouquet();
      stopCelebration();
      document.querySelectorAll(".burst-petal, .star-spark").forEach((el) => el.remove());
      if (document.body.dataset.scene === "4") startBouquet();
    } else if (document.body.dataset.scene === "4") {
      startMatrix();
      startBouquet();
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

  /* ---------------- dotted-particle bouquet (scene 4) ---------------- */
  /* The bouquet is 20,000 tiny glowing dots on pure black — pink/magenta/
     purple/white lily flowers, green stems and leaves, white sparkles.
     Dots are smooth radial-gradient glow sprites (never hard squares).
     Layout is fixed in a 360 x 430 space; the canvas is scaled by CSS.
     Build timeline (ms): structural dots fall in bottom-up (0-~2000);
     buds assemble ~1550; petal dots land in tight center clusters
     from ~1750; flowers bloom from ~3450 (back layer first, wider and
     longer, then front layer); buds bloom last from ~6150 into small
     5-petal lilies; everything finishes open by ~7700; complete at 8000,
     then the dots breathe gently and the sparkles twinkle. */
  var BOUQUET_W = 360, BOUQUET_H = 430;
  var BOUQUET_COMPLETE_MS = 8000;
  var bouquetRaf = 0;
  var bouquetParticles = null;
  var bouquetStart = 0;
  var bouquetState = "idle"; // idle | playing | complete | static
  var bouquetSprites = null;
  var bouquetBaked = null;

  var BOUQUET_FLOWERS = [
    { x: 58, y: 128, r: 30, palette: "pink" },
    { x: 104, y: 96, r: 32, palette: "purple" },
    { x: 148, y: 74, r: 34, palette: "pink" },
    { x: 184, y: 64, r: 34, palette: "white" },
    { x: 222, y: 76, r: 33, palette: "magenta" },
    { x: 264, y: 98, r: 31, palette: "purple" },
    { x: 306, y: 132, r: 29, palette: "pink" }
  ];
  var BOUQUET_BUDS = [
    { x: 86, y: 42 }, { x: 124, y: 30 }, { x: 162, y: 24 },
    { x: 200, y: 24 }, { x: 238, y: 32 }, { x: 276, y: 44 }
  ];
  var BOUQUET_TIE = { x: 180, y: 338 };
  var BOUQUET_PALETTES = {
    pink:    { light: "#f8c9d8", base: "#f2a0c0", mid: "#e75480", deep: "#b03070" },
    purple:  { light: "#e3c8f5", base: "#c9a0e8", mid: "#a86bd6", deep: "#8b4fb8" },
    white:   { light: "#ffffff", base: "#fdf6f8", mid: "#f2c9d8", deep: "#d18ba5" },
    magenta: { light: "#f7b8d4", base: "#ef7fb2", mid: "#d1477a", deep: "#9e2a63" }
  };
  var BOUQUET_GREENS = ["#7ed957", "#5cbf4e", "#3fae4a", "#2e8b3a", "#8fd07a"];
  var BOUQUET_CENTERS = ["#fff6e8", "#f1d27d", "#fdf6f8"];
  var BOUQUET_LEAVES = [
    { x: 137, y: 255, rx: 26, ry: 10, rot: -0.63 },
    { x: 200, y: 260, rx: 27, ry: 10, rot: 0.56 },
    { x: 109, y: 293, rx: 23, ry: 9, rot: -0.23 },
    { x: 225, y: 299, rx: 22, ry: 9, rot: 0.21 },
    { x: 143, y: 315, rx: 20, ry: 8, rot: -0.73 },
    { x: 165, y: 282, rx: 24, ry: 9, rot: 0.35 },
    { x: 120, y: 232, rx: 22, ry: 9, rot: -0.5 },
    { x: 238, y: 236, rx: 23, ry: 9, rot: 0.45 },
    { x: 180, y: 306, rx: 21, ry: 8, rot: 0.1 },
    { x: 96, y: 322, rx: 18, ry: 8, rot: -0.4 }
  ];
  /* Dense green mass: half-width of the teardrop blob at a given y. */
  var BOUQUET_MASS_PROFILE = [[195, 78], [230, 86], [270, 72], [300, 55], [320, 30], [338, 10], [365, 2]];
  function bouquetMassHalfWidth(y) {
    var pts = BOUQUET_MASS_PROFILE;
    if (y <= pts[0][0]) return pts[0][1];
    for (var i = 1; i < pts.length; i += 1) {
      if (y <= pts[i][0]) {
        var t = (y - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
        return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t;
      }
    }
    return pts[pts.length - 1][1];
  }

  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  function makeDotSprite(color) {
    var size = 24;
    var c = document.createElement("canvas");
    c.width = size; c.height = size;
    var ctx = c.getContext("2d");
    if (!ctx) return null;
    try {
      ctx.fillStyle = safeGradient(ctx, "radial",
        [size / 2, size / 2, 0, size / 2, size / 2, size / 2],
        [[0, "rgba(255,255,255,.9)"], [.12, hexA(color, 1)], [.55, hexA(color, .55)], [1, hexA(color, 0)]]);
      ctx.fillRect(0, 0, size, size);
    } catch (e) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.fill();
    }
    return c;
  }
  function getBouquetSprites() {
    if (bouquetSprites) return bouquetSprites;
    bouquetSprites = {};
    var colors = BOUQUET_GREENS.concat(BOUQUET_CENTERS).concat(["#ffffff"]);
    Object.keys(BOUQUET_PALETTES).forEach(function (key) {
      var pal = BOUQUET_PALETTES[key];
      colors.push(pal.light, pal.base, pal.mid, pal.deep);
    });
    colors.forEach(function (color) {
      if (!bouquetSprites[color]) bouquetSprites[color] = makeDotSprite(color);
    });
    return bouquetSprites;
  }

  function bouquetQuad(p0, p1, p2, t) {
    var u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
    };
  }
  function bouquetEllipsePoint(cx, cy, rx, ry, rot) {
    var a = Math.random() * Math.PI * 2;
    var r = Math.sqrt(Math.random());
    var x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r;
    var c = Math.cos(rot), s = Math.sin(rot);
    return { x: cx + x * c - y * s, y: cy + x * s + y * c };
  }

  /* Build the exact 20,000-dot particle list:
     green structural 10,540 (stems 13x220 + leaves 10x260 + mass 5,080)
     + petals 8,964 (flowers 7x2x513 + buds 6x297)
     + centers 376 (flowers 7x40 + buds 6x16) + stars 120 = 20,000. */
  function buildBouquetParticles() {
    var list = [];
    var i, j;
    function structDot(x, y) {
      list.push({
        kind: "struct", head: -1, layer: null, bud: false,
        x0: x + rand(-30, 30), y0: -20 - rand(0, 140),
        cx: x, cy: y, tx: x, ty: y,
        color: BOUQUET_GREENS[Math.floor(Math.random() * BOUQUET_GREENS.length)],
        size: 1.2 + Math.random() * 0.8,
        lockDelay: (1 - y / BOUQUET_H) * 900, lockDur: 600 + Math.random() * 500,
        bloomStart: 0, bloomDur: 0, bloomEnd: 0, phase: Math.random() * Math.PI * 2
      });
    }
    function petalDot(head, layer, isBud) {
      var c = isBud ? BOUQUET_BUDS[head] : BOUQUET_FLOWERS[head];
      var petals = isBud ? 5 : 6;
      var petalLen = isBud ? 13 : (c.r * (layer === "back" ? 1.18 : 1));
      var k = Math.floor(Math.random() * petals);
      var a = (k / petals) * Math.PI * 2 + (layer === "back" ? Math.PI / petals : 0) + rand(-0.22, 0.22);
      var d = petalLen * (0.25 + 0.75 * Math.sqrt(Math.random()));
      var tx = c.x + Math.cos(a) * d;
      var ty = c.y + Math.sin(a) * d * 0.85;
      var pal = isBud ? BOUQUET_PALETTES.pink : BOUQUET_PALETTES[c.palette];
      var frac = d / petalLen;
      var color = frac < 0.35 ? pal.light : (frac < 0.7 ? pal.base : (Math.random() < 0.6 ? pal.mid : pal.deep));
      var bloomStart, bloomDur;
      if (isBud) { bloomStart = 6150 + head * 140; bloomDur = 800; }
      else if (layer === "back") { bloomStart = 3450 + head * 480; bloomDur = 1300; }
      else { bloomStart = 3700 + head * 480; bloomDur = 950; }
      var cluster = isBud
        ? { x: c.x + rand(-4, 4), y: (c.y - 3) + rand(-7, 7) }
        : { x: c.x + rand(-4, 4), y: c.y + rand(-4, 4) };
      list.push({
        kind: "petal", head: head, layer: layer, bud: isBud,
        x0: c.x + rand(-20, 20), y0: -20 - rand(0, 120),
        cx: cluster.x, cy: cluster.y, tx: tx, ty: ty,
        color: color, size: 1.3 + Math.random() * 0.9,
        lockDelay: isBud ? 1550 + Math.random() * 300 : 1750 + Math.random() * 400,
        lockDur: 500,
        bloomStart: bloomStart, bloomDur: bloomDur, bloomEnd: bloomStart + bloomDur,
        phase: Math.random() * Math.PI * 2
      });
    }
    function centerDot(x, y, bloomStart, colors) {
      list.push({
        kind: "center", head: -1, layer: null, bud: false,
        x0: x + rand(-15, 15), y0: -20 - rand(0, 100),
        cx: x + rand(-3, 3), cy: y + rand(-3, 3), tx: x, ty: y,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 1.5 + Math.random() * 1.0,
        lockDelay: 1750 + Math.random() * 400, lockDur: 500,
        bloomStart: bloomStart, bloomDur: 400, bloomEnd: bloomStart + 400,
        phase: Math.random() * Math.PI * 2
      });
    }
    function starDot(x, y) {
      list.push({
        kind: "star", head: -1, layer: null, bud: false,
        x0: x, y0: y, cx: x, cy: y, tx: x, ty: y,
        color: "#ffffff", size: 1.0 + Math.random() * 1.0,
        lockDelay: 0, lockDur: 0, bloomStart: 0, bloomDur: 0, bloomEnd: 0,
        phase: Math.random() * Math.PI * 2
      });
    }

    /* Stems: one quadratic curve per head and per bud, fanning out from
       the tie point. 13 stems x 220 dots = 2,860. */
    var targets = [];
    BOUQUET_FLOWERS.forEach(function (f) { targets.push({ x: f.x, y: f.y + f.r * 0.4 }); });
    BOUQUET_BUDS.forEach(function (b) { targets.push({ x: b.x, y: b.y + 8 }); });
    targets.forEach(function (end) {
      var bend = (end.x - BOUQUET_TIE.x) * 0.28;
      var ctrl = { x: (BOUQUET_TIE.x + end.x) / 2 + bend, y: (BOUQUET_TIE.y + end.y) / 2 };
      for (i = 0; i < 220; i += 1) {
        var pt = bouquetQuad(BOUQUET_TIE, ctrl, end, Math.random());
        structDot(pt.x + rand(-2.5, 2.5), pt.y + rand(-2.5, 2.5));
      }
    });
    /* Leaves: 10 ellipses x 260 dots = 2,600. */
    BOUQUET_LEAVES.forEach(function (leaf) {
      for (i = 0; i < 260; i += 1) {
        var lp = bouquetEllipsePoint(leaf.x, leaf.y, leaf.rx, leaf.ry, leaf.rot);
        structDot(lp.x, lp.y);
      }
    });
    /* Dense green mass narrowing to the tie point: 5,080 dots. */
    for (i = 0; i < 5080; i += 1) {
      var my = rand(195, 365);
      var mw = bouquetMassHalfWidth(my);
      structDot(BOUQUET_TIE.x + rand(-mw, mw), my);
    }
    /* Petals: 7 flowers x 2 layers x 513 + 6 buds x 297 = 8,964. */
    for (i = 0; i < 7; i += 1) {
      for (j = 0; j < 513; j += 1) petalDot(i, "back", false);
      for (j = 0; j < 513; j += 1) petalDot(i, "front", false);
    }
    for (i = 0; i < 6; i += 1) {
      for (j = 0; j < 297; j += 1) petalDot(i, null, true);
    }
    /* Centers: 7 flowers x 40 + 6 buds x 16 = 376. */
    BOUQUET_FLOWERS.forEach(function (f, fi) {
      for (i = 0; i < 40; i += 1) {
        var cp = bouquetEllipsePoint(f.x, f.y, 6, 5, 0);
        centerDot(cp.x, cp.y, 3700 + fi * 480 + 150, BOUQUET_CENTERS);
      }
    });
    BOUQUET_BUDS.forEach(function (b, bi) {
      for (i = 0; i < 16; i += 1) {
        var bp = bouquetEllipsePoint(b.x, b.y, 3.5, 3, 0);
        centerDot(bp.x, bp.y, 6150 + bi * 140 + 100,
          [BOUQUET_PALETTES.pink.light, BOUQUET_PALETTES.pink.base, BOUQUET_PALETTES.pink.mid]);
      }
    });
    /* Stars: 120 white sparkles, mostly below the bouquet. */
    for (i = 0; i < 96; i += 1) starDot(rand(8, 352), rand(345, 425));
    for (i = 0; i < 24; i += 1) {
      starDot(Math.random() < 0.5 ? rand(8, 60) : rand(300, 352), rand(10, 200));
    }
    return list;
  }

  function bouquetEaseOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function bouquetEaseOutBack(t) {
    var c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  function bouquetClamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

  /* Position + alpha of one dot at elapsed ms t. */
  function bouquetDotAt(p, t) {
    if (p.kind === "star") {
      var tw = 0.35 + 0.65 * Math.abs(Math.sin(t / 900 + p.phase));
      return { x: p.tx, y: p.ty, alpha: bouquetClamp01(t / 1500) * tw };
    }
    var lt = bouquetClamp01((t - p.lockDelay) / p.lockDur);
    var e = bouquetEaseOutCubic(lt);
    var x = p.x0 + (p.cx - p.x0) * e;
    var y = p.y0 + (p.cy - p.y0) * e;
    var alpha = bouquetClamp01((t - p.lockDelay) / 200);
    if (p.kind === "struct") return { x: x, y: y, alpha: alpha };
    if (p.kind === "center") {
      var ca = bouquetClamp01((t - p.bloomStart) / p.bloomDur);
      var ce = bouquetEaseOutCubic(ca);
      return { x: p.cx + (p.tx - p.cx) * ce, y: p.cy + (p.ty - p.cy) * ce, alpha: alpha * ca };
    }
    var bt = bouquetClamp01((t - p.bloomStart) / p.bloomDur);
    var be = bouquetEaseOutBack(bt);
    return {
      x: p.cx + (p.tx - p.cx) * be,
      y: p.cy + (p.ty - p.cy) * be,
      alpha: alpha
    };
  }

  function drawBouquetAt(ctx, t, finalOnly) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, BOUQUET_W, BOUQUET_H);
    ctx.globalCompositeOperation = "lighter";
    var sprites = getBouquetSprites();
    for (var i = 0; i < bouquetParticles.length; i += 1) {
      var p = bouquetParticles[i];
      var at = finalOnly ? { x: p.tx, y: p.ty, alpha: 1 } : bouquetDotAt(p, t);
      if (at.alpha <= 0.01) continue;
      var s = p.size * 2;
      ctx.globalAlpha = at.alpha;
      var spr = sprites[p.color];
      if (spr) ctx.drawImage(spr, at.x - s / 2, at.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function bakeBouquet() {
    var canvas = document.getElementById("bouquetCanvas");
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var baked = document.createElement("canvas");
    baked.width = Math.floor(BOUQUET_W * dpr);
    baked.height = Math.floor(BOUQUET_H * dpr);
    var ctx = baked.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBouquetAt(ctx, 0, true);
    bouquetBaked = baked;
  }

  function bouquetFrame(ts) {
    if (!bouquetStart) bouquetStart = ts;
    var t = ts - bouquetStart;
    var canvas = document.getElementById("bouquetCanvas");
    var ctx = canvas && canvas.getContext("2d");
    if (!canvas || !ctx) { bouquetRaf = 0; return; }
    drawBouquetAt(ctx, t, false);
    if (t < BOUQUET_COMPLETE_MS) {
      bouquetRaf = window.requestAnimationFrame(bouquetFrame);
    } else {
      bakeBouquet();
      bouquetState = "complete";
      bouquetRaf = window.requestAnimationFrame(bouquetIdle);
    }
  }

  function bouquetIdle(ts) {
    var canvas = document.getElementById("bouquetCanvas");
    var ctx = canvas && canvas.getContext("2d");
    if (!canvas || !ctx || !bouquetBaked) { bouquetRaf = 0; return; }
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, BOUQUET_W, BOUQUET_H);
    ctx.globalAlpha = 0.94 + 0.06 * Math.sin(ts / 900);
    ctx.drawImage(bouquetBaked, 0, 0, BOUQUET_W, BOUQUET_H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "lighter";
    var sprites = getBouquetSprites();
    for (var i = 0; i < bouquetParticles.length; i += 1) {
      var p = bouquetParticles[i];
      if (p.kind !== "star") continue;
      var tw = 0.35 + 0.65 * Math.abs(Math.sin(ts / 900 + p.phase));
      var s = p.size * 2;
      ctx.globalAlpha = tw;
      var spr = sprites[p.color];
      if (spr) ctx.drawImage(spr, p.tx - s / 2, p.ty - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    bouquetRaf = window.requestAnimationFrame(bouquetIdle);
  }

  function startBouquet() {
    var canvas = document.getElementById("bouquetCanvas");
    var scene = sceneEl(4);
    if (!canvas || !scene || !scene.classList.contains("is-active")) return;
    stopBouquet();
    if (!bouquetParticles) bouquetParticles = buildBouquetParticles();
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.floor(BOUQUET_W * dpr);
    canvas.height = Math.floor(BOUQUET_H * dpr);
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduceMotion) {
      drawBouquetAt(ctx, 0, true);
      bouquetState = "static";
      return;
    }
    bouquetStart = 0;
    bouquetState = "playing";
    bouquetRaf = window.requestAnimationFrame(bouquetFrame);
  }

  function stopBouquet() {
    if (bouquetRaf) window.cancelAnimationFrame(bouquetRaf);
    bouquetRaf = 0;
    bouquetStart = 0;
    bouquetState = "idle";
    var canvas = document.getElementById("bouquetCanvas");
    var ctx = canvas && canvas.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, BOUQUET_W, BOUQUET_H);
  }

  /* Inspection state for tests: exact counts and per-head bloom windows. */
  function getBouquetState() {
    var counts = { struct: 0, petal: 0, center: 0, star: 0 };
    var heads = [];
    var i;
    for (i = 0; i < 7; i += 1) heads.push({ kind: "flower", index: i, bloomStart: 0, bloomEnd: 0, backBloomStart: 0, backBloomEnd: 0, frontBloomStart: 0, frontBloomEnd: 0, spread: 0, open: false });
    for (i = 0; i < 6; i += 1) heads.push({ kind: "bud", index: i, bloomStart: 0, bloomEnd: 0, backBloomStart: 0, backBloomEnd: 0, frontBloomStart: 0, frontBloomEnd: 0, spread: 0, open: false });
    if (bouquetParticles) {
      bouquetParticles.forEach(function (p) {
        counts[p.kind] += 1;
        if (p.kind !== "petal") return;
        var h = p.bud ? heads[7 + p.head] : heads[p.head];
        if (!h) return;
        if (!h.bloomStart || p.bloomStart < h.bloomStart) h.bloomStart = p.bloomStart;
        if (p.bloomEnd > h.bloomEnd) h.bloomEnd = p.bloomEnd;
        if (p.layer === "back") {
          if (!h.backBloomStart || p.bloomStart < h.backBloomStart) h.backBloomStart = p.bloomStart;
          if (p.bloomEnd > h.backBloomEnd) h.backBloomEnd = p.bloomEnd;
        } else {
          if (!h.frontBloomStart || p.bloomStart < h.frontBloomStart) h.frontBloomStart = p.bloomStart;
          if (p.bloomEnd > h.frontBloomEnd) h.frontBloomEnd = p.bloomEnd;
        }
        var c = p.bud ? BOUQUET_BUDS[p.head] : BOUQUET_FLOWERS[p.head];
        var d = Math.max(Math.abs(p.tx - c.x), Math.abs(p.ty - c.y));
        if (d > h.spread) h.spread = d;
      });
      heads.forEach(function (h) {
        h.open = h.bloomEnd > 0 && h.bloomEnd <= 7700 && h.spread > 10;
      });
    }
    return {
      total: bouquetParticles ? bouquetParticles.length : 0,
      counts: counts,
      heads: heads,
      state: bouquetState,
      playing: bouquetState === "playing" || bouquetState === "complete"
    };
  }

  /* ---------------- envelope and bloom ---------------- */
  /* Strict opening order (approved demo): the wax seal shakes and cracks
     FIRST, its shards fly apart; only then does the flap open; the flower
     flood starts only after the flap has finished; then the envelope
     fades away and the paper appears ALONE — never under the envelope. */
  const bigEnvelope = document.getElementById("bigEnvelope");
  const envelopeLetter = document.getElementById("envelopeLetter");
  const envelopeInstruction = bigEnvelope?.querySelector(".envelope-instruction");
  const envelopeInstructionText = envelopeInstruction?.textContent || "";
  bigEnvelope?.addEventListener("click", () => {
    if (bigEnvelope.getAttribute("aria-expanded") === "true") return;
    bigEnvelope.setAttribute("aria-expanded", "true");
    if (reduceMotion) {
      // Static paper, no flood animation.
      bigEnvelope.classList.add("is-dismissed");
      bigEnvelope.hidden = true;
      if (envelopeLetter) {
        envelopeLetter.classList.add("is-visible");
        envelopeLetter.setAttribute("aria-hidden", "false");
      }
      envelopeLetter?.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }
    bigEnvelope.classList.add("is-opening", "is-cracking");
    if (envelopeInstruction) envelopeInstruction.textContent = "الختم بيتكسّر…";
    later(() => { // seal cracked: the wax shards fly apart (0.8s)
      bigEnvelope.classList.add("is-cracked");
      if (envelopeInstruction) envelopeInstruction.textContent = "الختم اتكسّر…";
    }, 320);
    later(() => { // flap opens only after the seal is fully gone
      bigEnvelope.classList.add("is-flap-open");
    }, 1250);
    later(() => { // flower flood, only after the flap finished opening
      burstPetals(sceneEl(2));
    }, 2300);
    later(() => { // envelope fades away; the paper appears alone
      bigEnvelope.classList.add("is-dismissed");
      if (envelopeLetter) {
        envelopeLetter.classList.add("is-visible");
        envelopeLetter.setAttribute("aria-hidden", "false");
      }
      envelopeLetter?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 3000);
    later(() => { bigEnvelope.hidden = true; }, 3650);
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
    /* If anything in the rain path throws (a browser whose canvas balks),
       the boot must still reach the loading screen — never a dead dark CRT. */
    try {
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
    } catch (e) {
      finish();
    }
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
    function showLoading() {
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
    }
    /* The matrix rain must never strand the boot on a dark screen: if it
       throws on some browser, go straight to the loading screen. */
    try { startComputerMatrix(showLoading); } catch (e) { showLoading(); }
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
    document.querySelectorAll(".retro-window").forEach(function (w) { w.classList.add("is-hidden"); w.setAttribute("aria-hidden", "true"); w.style.left = ""; w.style.top = ""; w.style.right = ""; w.style.bottom = ""; w.style.width = ""; w.style.height = ""; w.classList.remove("is-maximized"); delete w.dataset.prevGeom; });
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
      // If the window was maximized by a drag-to-top, restore its old
      // geometry first so this drag moves the window as a unit again.
      if (win.classList.contains("is-maximized")) {
        var prev = null;
        try { prev = JSON.parse(win.dataset.prevGeom || "null"); } catch (err) { prev = null; }
        win.classList.remove("is-maximized");
        if (prev) {
          win.style.left = prev.left; win.style.top = prev.top;
          win.style.width = prev.width; win.style.height = prev.height;
        } else {
          win.style.left = ""; win.style.top = ""; win.style.width = ""; win.style.height = "";
        }
        delete win.dataset.prevGeom;
      }
      var wRect = win.getBoundingClientRect();
      var startX = e.clientX, startY = e.clientY;
      var startL = wRect.left - dRect.left, startT = wRect.top - dRect.top;
      // Freeze the current pixel geometry: on phones the window is placed
      // with top/bottom + inset-inline, so without explicit width/height
      // a drag would stretch it instead of moving it as a unit — the
      // title bar moved but the text never came up with it.
      win.style.left = startL + "px"; win.style.top = startT + "px";
      win.style.width = wRect.width + "px"; win.style.height = wRect.height + "px";
      win.style.right = "auto"; win.style.bottom = "auto"; win.style.insetInlineStart = "auto"; win.style.insetInlineEnd = "auto";
      win.style.margin = "0"; win.style.zIndex = ++computerZTop;
      var movedTop = startT;
      var pointerTop = startY - dRect.top;
      var dragged = false;
      function move(ev) {
        if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) > 6) dragged = true;
        pointerTop = ev.clientY - dRect.top;
        var nl = Math.max(-wRect.width * .35, Math.min(dRect.width - 60, startL + ev.clientX - startX));
        var nt = Math.max(0, Math.min(dRect.height - 34, startT + ev.clientY - startY));
        movedTop = nt;
        win.style.left = nl + "px"; win.style.top = nt + "px";
      }
      function up() {
        window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
        // Dragged to the top edge: maximize to fill the computer screen
        // so all the text shows. A mere click on the title bar never
        // maximizes (dragged is false / the pointer never reached the top).
        if (dragged && (pointerTop <= 12 || movedTop <= 0)) {
          win.dataset.prevGeom = JSON.stringify({ left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height });
          win.classList.add("is-maximized");
          win.style.left = "0px"; win.style.top = "0px";
          win.style.width = "100%"; win.style.height = "100%";
        }
      }
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

  /* Reduced motion must mean "less motion", not "no flowers": with
     animations off the flying/falling petals are skipped, but the rose
     field still appears — the site's reduced-motion CSS forces every
     animation to finish in .001ms, so rosePop lands instantly at full
     opacity and the roses simply sit there, fully open. */
  function burstPetals(scene) {
    if (!scene) return;
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
    if (!reduceMotion) burstWave(90, 0, .5, true);      // wave 1: fast, upward
    if (!reduceMotion) burstWave(60, .45, 1.1, false);  // wave 2: wider, drifts down too

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
          // Staggered fade-out: each rose fades at its own moment from
          // ~2s after the flood starts, one by one, until the screen is
          // clear (~6.1s). Only used with motion on (has-fade class).
          rose.style.setProperty("--rfade", `${rand(2.0, 5.4).toFixed(2)}s`);
          const sprite = roseSprite((r * cols + cI + pass) % ROSE_PALETTES.length);
          if (sprite) rose.style.backgroundImage = `url(${sprite})`;
          else rose.style.background = "radial-gradient(circle at 35% 30%, #f6cdd4, #c65a72 55%, #8c2f45)";
          layer.appendChild(rose);
        }
      }
    }

    // Falling petals afterward, raining down over the roses (motion only).
    if (!reduceMotion) for (i = 0; i < 120; i += 1) {
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
    // With motion on, the roses fade one by one (has-fade) and the layer
    // is gone once the last rose has faded (~6.1s + 0.7s fade). With
    // reduced motion the static rose field stays (no fade class) and is
    // removed on the old 8s schedule.
    if (!reduceMotion) layer.classList.add("has-fade");
    later(() => layer.remove(), reduceMotion ? 8000 : 6800);
  }

  /* ---------------- birthday cake candle: blow out / relight ---------------- */
  const celebrationCake = document.querySelector(".celebration-cake");
  const cakeFlameBtn = document.getElementById("cakeFlameBtn");
  cakeFlameBtn?.addEventListener("click", () => {
    if (!celebrationCake) return;
    const out = celebrationCake.classList.toggle("is-out");
    cakeFlameBtn.setAttribute("aria-pressed", String(!out));
    cakeFlameBtn.textContent = out ? "ولّعي الشمعة تاني ✨" : "اطفي الشمعة 🕯️";
  });

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
    if (event.detail.previousIndex === 4) { stopMatrix(); stopBouquet(); }
    if (event.detail.previousIndex === 8) stopMemories();
    if (event.detail.previousIndex === 13) stopCelebration();

    switch (index) {
      case 4: later(startMatrix, 220); later(startBouquet, 220); break;
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
    stopBouquet();
    stopMemories();
    stopCelebration();

    // Gate
    window.dodyGate?.reset();

    // First envelope
    bigEnvelope?.setAttribute("aria-expanded", "false");
    bigEnvelope?.classList.remove("is-opening", "is-cracking", "is-cracked", "is-flap-open", "is-dismissed");
    if (bigEnvelope) bigEnvelope.hidden = false;
    if (envelopeInstruction) envelopeInstruction.textContent = envelopeInstructionText;
    envelopeLetter?.classList.remove("is-visible");
    envelopeLetter?.setAttribute("aria-hidden", "true");

    // Birthday cake candle back to lit
    celebrationCake?.classList.remove("is-out");
    if (cakeFlameBtn) { cakeFlameBtn.setAttribute("aria-pressed", "true"); cakeFlameBtn.textContent = "اطفي الشمعة 🕯️"; }

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
    startBouquet,
    stopBouquet,
    getBouquetState,
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
