/* Scene state machine, progress, chapter menu and accessible navigation. */
(function () {
  "use strict";

  const scenes = Array.from(document.querySelectorAll(".scene[data-scene]"));
  const prevButton = document.getElementById("prevScene");
  const nextButton = document.getElementById("nextScene");
  const progressBar = document.getElementById("progressBar");
  const progressHeart = document.getElementById("progressHeart");
  const progressTrack = document.getElementById("progressTrack");
  const chapterName = document.getElementById("chapterName");
  const chapterCount = document.getElementById("chapterCount");
  const menuButton = document.getElementById("sceneMenuButton");
  const menu = document.getElementById("sceneMenu");
  const menuClose = document.getElementById("sceneMenuClose");
  const menuList = document.getElementById("sceneMenuList");
  const journey = document.getElementById("journey");
  const body = document.body;

  if (!scenes.length) return;

  let current = 0;
  let gateUnlocked = false;
  let menuOpen = false;
  let transitionTimer = 0;
  let lastFocused = null;

  const darkScenes = new Set([3, 4, 6, 8, 9, 10]);
  const middleScenes = new Set([5]);
  const pad = (number) => String(number).padStart(2, "0");

  function chapterAt(index) {
    return scenes[index].dataset.chapter || `فصل ${index + 1}`;
  }

  function updateChrome() {
    const count = `${pad(current + 1)} / ${pad(scenes.length)}`;
    if (chapterName) chapterName.textContent = chapterAt(current);
    if (chapterCount) chapterCount.textContent = count;
    if (progressBar) progressBar.style.width = `${(current / (scenes.length - 1)) * 100}%`;
    if (progressHeart) progressHeart.style.insetInlineStart = `${(current / (scenes.length - 1)) * 100}%`;
    if (progressTrack) progressTrack.setAttribute("aria-valuenow", String(current + 1));
    if (prevButton) prevButton.disabled = current === 0;
    if (nextButton) {
      const shouldLock = current === 0 && !gateUnlocked;
      nextButton.disabled = shouldLock;
      nextButton.style.visibility = current === scenes.length - 1 ? "hidden" : "visible";
      nextButton.setAttribute("aria-label", current === scenes.length - 1 ? "نهاية الرحلة" : "المشهد التالي");
      nextButton.querySelector(".nav-label").textContent = current === scenes.length - 1 ? "النهاية" : "التالي";
    }
    if (progressTrack) {
      progressTrack.setAttribute("aria-valuetext", `الفصل ${current + 1} من ${scenes.length}: ${chapterAt(current)}`);
    }
    if (progressBar) progressBar.style.width = `${current === 0 ? 0 : (current / (scenes.length - 1)) * 100}%`;
    if (progressHeart) progressHeart.style.insetInlineStart = `${current === 0 ? 0 : (current / (scenes.length - 1)) * 100}%`;
  }

  function setTheme() {
    body.dataset.theme = darkScenes.has(current) ? "dark" : (middleScenes.has(current) ? "cream" : "light");
    body.dataset.scene = String(current);
  }

  function applySceneState() {
    scenes.forEach((scene, index) => {
      const active = index === current;
      scene.classList.toggle("is-active", active);
      scene.classList.remove("is-entering", "is-leaving");
      scene.setAttribute("aria-hidden", String(!active));
      if (!active) scene.setAttribute("inert", "");
      else {
        scene.removeAttribute("inert");
        scene.classList.add("is-entering");
      }
    });
  }

  function goTo(index, options = {}) {
    const next = Number(index);
    if (!Number.isInteger(next) || next < 0 || next >= scenes.length) return false;
    if (next > 0 && !gateUnlocked) {
      window.dodyApp?.notify?.("البوابة الأول يا دودي… التاريخ هو المفتاح 💌");
      return false;
    }
    if (next === current && !options.force) return true;

    window.clearTimeout(transitionTimer);
    const previousScene = scenes[current];
    previousScene.classList.add("is-leaving");
    current = next;
    setTheme();
    applySceneState();
    updateChrome();
    if (journey) {
      // Scroll the page, not merely the main element, because each scene is a full page.
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    document.dispatchEvent(new CustomEvent("dody:scene-change", {
      detail: { index: current, chapter: chapterAt(current), previousIndex: Number(previousScene.dataset.scene) }
    }));
    transitionTimer = window.setTimeout(() => {
      previousScene.classList.remove("is-leaving");
    }, 300);

    const heading = scenes[current].querySelector("h1, h2");
    if (heading) {
      scenes[current].setAttribute("tabindex", "-1");
      window.setTimeout(() => scenes[current].focus({ preventScroll: true }), 80);
    }
    return true;
  }

  function nextScene() {
    if (current === scenes.length - 1) return false;
    return goTo(current + 1);
  }

  function prevScene() {
    if (current === 0) return false;
    return goTo(current - 1);
  }

  function buildMenu() {
    if (!menuList) return;
    menuList.innerHTML = "";
    scenes.forEach((scene, index) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `<span aria-hidden="true">${pad(index + 1)}</span>${chapterAt(index)}`;
      button.addEventListener("click", () => {
        closeMenu();
        if (index > 0 && !gateUnlocked) {
          window.dodyApp?.notify?.("البوابة الأول… وبعدها كل الفصول مفتوحة 💗");
          return;
        }
        goTo(index);
      });
      if (index === current) button.setAttribute("aria-current", "step");
      li.appendChild(button);
      menuList.appendChild(li);
    });
  }

  function openMenu() {
    if (!menu) return;
    buildMenu();
    lastFocused = document.activeElement;
    menu.hidden = false;
    menuOpen = true;
    body.classList.add("is-locked");
    menuButton?.setAttribute("aria-expanded", "true");
    menuClose?.focus();
  }

  function closeMenu() {
    if (!menu) return;
    menu.hidden = true;
    menuOpen = false;
    body.classList.remove("is-locked");
    menuButton?.setAttribute("aria-expanded", "false");
    if (lastFocused instanceof HTMLElement) lastFocused.focus({ preventScroll: true });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuOpen) {
      closeMenu();
      return;
    }
    if (event.key === "Tab" && menuOpen && menu) {
      const focusables = menu.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (event.key === "ArrowLeft" && !menuOpen && gateUnlocked) {
      const tag = document.activeElement?.tagName;
      if (!["INPUT", "TEXTAREA", "SELECT"].includes(tag)) nextScene();
    }
    if (event.key === "ArrowRight" && !menuOpen && gateUnlocked) {
      const tag = document.activeElement?.tagName;
      if (!["INPUT", "TEXTAREA", "SELECT"].includes(tag)) prevScene();
    }
  });

  prevButton?.addEventListener("click", prevScene);
  nextButton?.addEventListener("click", nextScene);
  menuButton?.addEventListener("click", openMenu);
  menuClose?.addEventListener("click", closeMenu);
  menu?.addEventListener("click", (event) => {
    if (event.target === menu) closeMenu();
  });

  document.addEventListener("click", (event) => {
    const nextTrigger = event.target.closest("[data-next]");
    if (nextTrigger) {
      event.preventDefault();
      nextScene();
      return;
    }
    const goTrigger = event.target.closest("[data-go-scene]");
    if (goTrigger) {
      event.preventDefault();
      const target = Number(goTrigger.dataset.goScene);
      if (target > 0 && !gateUnlocked) {
        window.dodyApp?.notify?.("لسه محتاجين التاريخ يا دودي 💗");
        return;
      }
      goTo(target);
    }
  });

  document.addEventListener("dody:gate-unlocked", () => {
    gateUnlocked = true;
    updateChrome();
  });

  applySceneState();
  setTheme();
  updateChrome();

  window.dodyScenes = {
    goTo,
    next: nextScene,
    previous: prevScene,
    current: () => current,
    count: scenes.length,
    unlockGate() {
      gateUnlocked = true;
      updateChrome();
    },
    isGateUnlocked: () => gateUnlocked,
    openMenu,
    closeMenu,
    reset() {
      window.clearTimeout(transitionTimer);
      current = 0;
      gateUnlocked = false;
      setTheme();
      applySceneState();
      updateChrome();
      window.scrollTo(0, 0);
    }
  };
})();
