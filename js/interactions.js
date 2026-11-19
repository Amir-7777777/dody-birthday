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
  let bootTimer = 0;
  let loadingInterval = 0;
  let typeTimer = 0;
  let heartPopupTimer = 0;
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
    later(() => {
      bigEnvelope.classList.remove("is-opening");
    }, 2300);
  });

  /* ---------------- retro computer ---------------- */
  const crtBoot = document.getElementById("crtBoot");
  const retroDesktop = document.getElementById("retroDesktop");
  const loadBar = document.getElementById("loadBar");
  const loadPercent = document.getElementById("loadPercent");
  const letterTypewriter = document.getElementById("letterTypewriter");
  const letterDynamic = document.getElementById("letterDynamic");
  let lastWindowTrigger = null;

  function startComputer() {
    const scene = sceneEl(5);
    if (!scene || !scene.classList.contains("is-active") || computerBooted) return;
    window.clearInterval(loadingInterval);
    window.clearTimeout(bootTimer);
    loadingInterval = window.setInterval(() => {
      const currentValue = Number(loadBar?.dataset.progress || 0);
      const step = currentValue > 82 ? 2 : rand(4, 8);
      const nextValue = Math.min(100, Math.round(currentValue + step));
      if (loadBar) {
        loadBar.style.width = `${nextValue}%`;
        loadBar.dataset.progress = String(nextValue);
      }
      if (loadPercent) loadPercent.textContent = `${nextValue}%`;
      if (nextValue >= 100) {
        window.clearInterval(loadingInterval);
        loadingInterval = 0;
        bootTimer = window.setTimeout(finishComputerBoot, reduceMotion ? 80 : 700);
      }
    }, 260);
  }

  function finishComputerBoot() {
    computerBooted = true;
    crtBoot?.classList.add("is-done");
    retroDesktop?.classList.add("is-visible");
    retroDesktop?.setAttribute("aria-hidden", "false");
    openRetroWindow("letterWindow", { focus: false });
    startTypewriter();
    window.dodyApp?.notify?.("سطح المكتب جاهز… دوسي على الأيقونات 💻", 2800);
  }

  function startTypewriter() {
    if (!letterTypewriter || computerTyped) return;
    const fullText = "يا دعاء…";
    if (reduceMotion) {
      letterTypewriter.textContent = fullText;
      showDynamicLetter();
      return;
    }
    letterTypewriter.textContent = "";
    let cursor = 0;
    const type = () => {
      letterTypewriter.textContent = fullText.slice(0, cursor);
      cursor += 1;
      if (cursor <= fullText.length) {
        typeTimer = window.setTimeout(type, 105);
      } else {
        showDynamicLetter();
      }
    };
    typeTimer = window.setTimeout(type, 400);
  }

  function showDynamicLetter() {
    if (!letterDynamic || computerTyped) return;
    computerTyped = true;
    letterDynamic.hidden = false;
    letterDynamic.classList.add("is-visible");
    window.clearTimeout(heartPopupTimer);
    heartPopupTimer = window.setTimeout(() => {
      if (document.body.dataset.scene === "5" && !document.getElementById("heartWindow")?.classList.contains("is-hidden")) return;
      if (document.body.dataset.scene === "5") openRetroWindow("heartWindow", { focus: false, automatic: true });
    }, reduceMotion ? 1200 : 7000);
  }

  function openRetroWindow(id, options = {}) {
    const win = document.getElementById(id);
    if (!win) return;
    lastWindowTrigger = options.focus === false ? lastWindowTrigger : document.activeElement;
    $$(".retro-window").forEach((other) => other.classList.remove("is-front"));
    win.classList.remove("is-hidden");
    win.setAttribute("aria-hidden", "false");
    win.classList.add("is-front");
    if (options.focus !== false) {
      win.querySelector("[data-window-close]")?.focus({ preventScroll: true });
    }
    if (id === "letterWindow" && computerBooted && !computerTyped) startTypewriter();
  }

  function closeRetroWindow(id, options = {}) {
    const win = document.getElementById(id);
    if (!win) return;
    win.classList.add("is-hidden");
    win.setAttribute("aria-hidden", "true");
    win.classList.remove("is-front");
    if (options.restoreFocus !== false && lastWindowTrigger instanceof HTMLElement) {
      lastWindowTrigger.focus({ preventScroll: true });
    }
  }

  document.addEventListener("click", (event) => {
    const openTrigger = event.target.closest("[data-window-open]");
    if (openTrigger) {
      event.preventDefault();
      openRetroWindow(openTrigger.dataset.windowOpen);
      return;
    }
    const closeTrigger = event.target.closest("[data-window-close]");
    if (closeTrigger) {
      event.preventDefault();
      closeRetroWindow(closeTrigger.dataset.windowClose);
    }
  });

  $$(".retro-window").forEach((win) => {
    win.addEventListener("pointerdown", () => {
      $$(".retro-window").forEach((other) => other.classList.remove("is-front"));
      win.classList.add("is-front");
    });
  });

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
    burstPetals(sceneEl(7), 46);
    later(() => {
      if (!giftLetter) return;
      giftLetter.classList.add("is-visible");
      giftLetter.setAttribute("aria-hidden", "false");
      giftLetter.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }, reduceMotion ? 100 : 900);
    window.dodyApp?.notify?.("كل اللي جوايا… في الجواب ده 💌", 2600);
  });

  function burstPetals(scene, count) {
    if (!scene || reduceMotion) return;
    const layer = document.createElement("div");
    layer.className = "petal-burst-layer";
    layer.setAttribute("aria-hidden", "true");
    for (let i = 0; i < count; i += 1) {
      const petal = document.createElement("span");
      petal.className = "burst-petal";
      petal.style.setProperty("--bx", `${rand(-70, 70)}vw`);
      petal.style.setProperty("--by", `${rand(-75, -15)}vh`);
      petal.style.setProperty("--br", `${rand(-540, 540)}deg`);
      petal.style.setProperty("--bd", `${rand(1.8, 4.2)}s`);
      petal.style.setProperty("--bdelay", `${rand(0, .7)}s`);
      petal.style.setProperty("--bcolor", ["#d6a5ad", "#b96e79", "#f6dde2", "#fff9f5", "#7d4e63", "#e8c0b6"][i % 6]);
      petal.style.insetInlineStart = `${rand(35, 65)}%`;
      petal.style.insetBlockStart = `${rand(32, 58)}%`;
      layer.appendChild(petal);
    }
    scene.appendChild(layer);
    later(() => layer.remove(), 4800);
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
  const sparkleLayer = document.getElementById("sparkleLayer");

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
    const candles = ["left", "center", "right"];
    candles.forEach((name, index) => {
      later(() => {
        const candle = chandelierSvg?.querySelector(`.candle--${name}`);
        candle?.classList.add("is-lit");
        if (index === candles.length - 1) {
          chandelierSvg?.classList.add("is-lit");
          chandelierGlow?.classList.add("is-lit");
          if (chandelierPrompt) chandelierPrompt.hidden = false;
          createChandelierSparkles();
          window.dodyApp?.notify?.("اتمني أمنيتك… الشموع سامعاها ✨", 3600);
        }
      }, reduceMotion ? 50 : 720 + index * 780);
    });
    lightCandles?.classList.add("is-lit");
    lightCandles?.setAttribute("aria-pressed", "true");
    if (lightCandles) lightCandles.disabled = true;
    document.dispatchEvent(new CustomEvent("dody:chandelier-lit"));
  }

  function createChandelierSparkles() {
    if (!sparkleLayer || reduceMotion) return;
    sparkleLayer.innerHTML = "";
    for (let i = 0; i < 18; i += 1) {
      const spark = document.createElement("i");
      spark.className = "star-spark";
      spark.style.left = `${rand(9, 91)}%`;
      spark.style.top = `${rand(4, 68)}%`;
      spark.style.setProperty("--spark-delay", `${rand(-3, 0)}s`);
      spark.style.width = `${rand(7, 16)}px`;
      spark.style.height = spark.style.width;
      sparkleLayer.appendChild(spark);
    }
  }

  lightCandles?.addEventListener("click", lightChandelier);

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
      case 5: if (!computerBooted) startComputer(); break;
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
    window.clearInterval(loadingInterval);
    window.clearTimeout(bootTimer);
    window.clearTimeout(typeTimer);
    window.clearTimeout(heartPopupTimer);

    // Gate
    window.dodyGate?.reset();

    // First envelope
    bigEnvelope?.setAttribute("aria-expanded", "false");
    bigEnvelope?.classList.remove("is-opening");
    envelopeLetter?.classList.remove("is-visible");
    envelopeLetter?.setAttribute("aria-hidden", "true");

    // Computer
    computerBooted = false;
    computerTyped = false;
    crtBoot?.classList.remove("is-done");
    retroDesktop?.classList.remove("is-visible");
    retroDesktop?.setAttribute("aria-hidden", "true");
    if (loadBar) { loadBar.style.width = "0%"; loadBar.dataset.progress = "0"; }
    if (loadPercent) loadPercent.textContent = "0%";
    $$(".retro-window").forEach((win) => { win.classList.add("is-hidden"); win.setAttribute("aria-hidden", "true"); win.classList.remove("is-front"); });
    if (letterDynamic) { letterDynamic.hidden = true; letterDynamic.classList.remove("is-visible"); }
    if (letterTypewriter) letterTypewriter.textContent = "يا دعاء…";

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
    chandelierLit = false;
    chandelierSvg?.classList.remove("is-lit");
    chandelierGlow?.classList.remove("is-lit");
    $$(".candle", chandelierSvg || document).forEach((candle) => candle.classList.remove("is-lit"));
    if (lightCandles) { lightCandles.classList.remove("is-lit"); lightCandles.disabled = false; lightCandles.setAttribute("aria-pressed", "false"); }
    if (chandelierPrompt) chandelierPrompt.hidden = true;
    if (sparkleLayer) sparkleLayer.innerHTML = "";

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
    startComputer,
    startCelebration,
    startMemories,
    revealWishes,
    lightChandelier,
    burstPetals,
    getState: () => ({ computerBooted, computerTyped, chandelierLit, gardenEntered, memoryIndex })
  };
})();
