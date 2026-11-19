/* Boot the little universe and expose a small inspection-friendly app API. */
(function () {
  "use strict";

  const toast = document.getElementById("toast");
  let toastTimer = 0;

  function notify(message, duration = 3000) {
    if (!toast || !message) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), duration);
  }

  // Shared app facade used by the other modules.
  window.dodyApp = {
    notify,
    version: "1.0.0",
    title: "Dody's 20th Birthday",
    unlock: () => window.dodyGate?.unlock(),
    openMusic: () => window.dodyMusic?.openDock(),
    goTo: (index) => window.dodyScenes?.goTo(index),
    reset: () => window.dodyInteractions?.resetJourney()
  };

  // A gentle initial focus for keyboard and screen-reader users without opening a mobile keyboard.
  window.addEventListener("load", () => {
    const gateHeading = document.querySelector('.scene[data-scene="0"] h1');
    if (gateHeading) {
      gateHeading.setAttribute("tabindex", "-1");
      gateHeading.focus({ preventScroll: true });
    }
    document.body.classList.add("is-ready");
  });

  // The whole experience is local. If a media/font request fails, keep navigating gracefully.
  window.addEventListener("error", (event) => {
    if (event.target instanceof HTMLAudioElement) {
      notify("ملف صوتي مش قادر يتحمل… راجعي مجلد assets/audio.", 4800);
    }
  }, true);

  // Keep background canvas work from competing with the reader when the tab is hidden.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      const scene = document.body.dataset.scene;
      if (scene === "4") window.dodyInteractions?.startMatrix?.();
      if (scene === "4") window.dodyInteractions?.startBouquet?.();
      if (scene === "13") window.dodyInteractions?.startCelebration?.();
    }
  });

  // Register the optional offline cache on supported origins.
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {
        // Offline caching is a progressive enhancement; the site still works without it.
      });
    });
  }

  window.dodyApp.isReady = true;
})();
