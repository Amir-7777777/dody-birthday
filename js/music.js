/* Single-source music controller: only one track can ever play at a time. */
(function () {
  "use strict";

  const birthdayAudio = document.getElementById("birthdayAudio");
  const personalAudio = document.getElementById("personalAudio");
  if (!birthdayAudio || !personalAudio) return;

  const tracks = [
    {
      id: "birthday",
      audio: birthdayAudio,
      title: "Birthday Song",
      subtitle: "أغنية عيد الميلاد • For Dody",
      label: "birthday"
    },
    {
      id: "personal",
      audio: personalAudio,
      title: "Rewrite The Stars",
      subtitle: "Anne-Marie & James Arthur • Our Song",
      label: "personal"
    }
  ];

  const dock = document.getElementById("musicDock");
  const tab = document.getElementById("musicTab");
  const tabLabel = document.getElementById("musicTabLabel");
  const title = document.getElementById("trackTitle");
  const subtitle = document.getElementById("trackSubtitle");
  const seek = document.getElementById("musicSeek");
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl = document.getElementById("duration");
  const playIcon = document.getElementById("playIcon");
  const muteButton = document.getElementById("muteButton");
  const cassette = document.getElementById("cassette");
  const cassetteStatus = document.getElementById("cassetteStatus");
  const birthdayPlayBtn = document.getElementById("birthdayPlayBtn");
  const toast = document.getElementById("toast");

  let current = 0;
  let isMuted = false;
  let isLoadingSeek = false;
  let errorAnnounced = {};
  let toastTimer = 0;

  tracks.forEach((track) => {
    track.audio.volume = .78;
    track.audio.preload = "metadata";
  });

  function notify(message, duration = 3000) {
    if (typeof window.dodyApp?.notify === "function") {
      window.dodyApp.notify(message, duration);
      return;
    }
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), duration);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${rest}`;
  }

  function isPlaying(track = tracks[current]) {
    return Boolean(track && !track.audio.paused && !track.audio.ended);
  }

  function updateUI() {
    const track = tracks[current];
    const playing = isPlaying(track);
    if (title) title.textContent = track.title;
    if (subtitle) subtitle.textContent = track.subtitle;
    if (tabLabel) tabLabel.textContent = playing ? track.title : "Music";
    if (playIcon) playIcon.textContent = playing ? "Ⅱ" : "▶";
    document.querySelectorAll('[data-music-action="toggle"]').forEach((button) => {
      button.setAttribute("aria-pressed", String(playing));
      button.setAttribute("aria-label", playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى");
    });
    dock?.classList.toggle("is-playing", playing);
    cassette?.classList.toggle("is-playing", track.id === "personal" && playing);
    if (cassetteStatus) {
      cassetteStatus.textContent = track.id === "personal"
        ? (playing ? "شغال… Rewrite The Stars ♫" : (track.audio.currentTime > 0 ? "متوقف مؤقتًا" : "جاهز للتشغيل"))
        : (playing ? "أغنية عيد الميلاد شغالة الآن" : "جاهز للتشغيل");
    }
    if (birthdayPlayBtn) {
      birthdayPlayBtn.innerHTML = track.id === "birthday" && playing
        ? 'أغنية عيد الميلاد شغالة <span aria-hidden="true">♫</span>'
        : 'شغّلي أغنية عيد الميلاد <span aria-hidden="true">♫</span>';
    }
    muteButton?.setAttribute("aria-pressed", String(isMuted || track.audio.muted));
    muteButton?.classList.toggle("is-muted", isMuted);
    if (muteButton) muteButton.textContent = (isMuted || track.audio.muted) ? "♫ مكتوم" : "♫ الصوت";
    updateTimes();
  }

  function updateTimes() {
    const audio = tracks[current].audio;
    if (!seek || isLoadingSeek) return;
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    seek.max = duration || 100;
    seek.value = duration ? audio.currentTime : 0;
    seek.disabled = !duration;
    seek.style.setProperty("--seek-progress", `${duration ? (audio.currentTime / duration) * 100 : 0}%`);
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
    if (durationEl) durationEl.textContent = duration ? formatTime(duration) : "0:00";
  }

  function pauseAll(except = null) {
    tracks.forEach((track) => {
      if (track.audio !== except) track.audio.pause();
    });
  }

  async function playTrack(index, options = {}) {
    const next = tracks[index];
    if (!next) return;
    const audio = next.audio;

    if (options.restart) {
      try { audio.currentTime = 0; } catch (_) { /* metadata may not be ready */ }
    }

    // Pause the other audio BEFORE requesting playback. This is the one-track guarantee.
    pauseAll(audio);
    current = index;

    if (isPlaying(next) && !options.restart) {
      updateUI();
      return;
    }

    try {
      await audio.play();
      errorAnnounced[trackKey(next)] = false;
      updateUI();
      document.dispatchEvent(new CustomEvent("dody:track-change", { detail: { id: next.id, playing: true } }));
    } catch (error) {
      if (error?.name === "AbortError") return;
      updateUI();
      const message = error?.name === "NotAllowedError"
        ? "المتصفح محتاج لمسة منك الأول… دوسي Play تاني 💗"
        : "مش قادرة أشغّل الأغنية دلوقتي. اتأكدي إن ملفات الصوت موجودة في assets/audio.";
      notify(message, 4800);
      if (!errorAnnounced[trackKey(next)]) {
        errorAnnounced[trackKey(next)] = true;
        console.warn("[Dody music]", error?.message || error);
      }
    }
  }

  function trackKey(track) { return track.id; }

  function pauseCurrent() {
    tracks[current].audio.pause();
    updateUI();
  }

  function toggle() {
    if (isPlaying()) pauseCurrent();
    else playTrack(current, { restart: tracks[current].audio.ended });
  }

  function toggleMute() {
    isMuted = !isMuted;
    tracks.forEach((track) => { track.audio.muted = isMuted; });
    updateUI();
  }

  function changeTrack(direction) {
    const nextIndex = (current + direction + tracks.length) % tracks.length;
    playTrack(nextIndex);
  }

  function openDock() {
    dock?.classList.remove("is-collapsed");
    dock?.removeAttribute("inert");
    if (tab) tab.hidden = true;
    document.getElementById("musicDockCollapse")?.setAttribute("aria-expanded", "true");
    document.getElementById("soundPeek")?.setAttribute("aria-expanded", "true");
  }

  function closeDock() {
    dock?.classList.add("is-collapsed");
    dock?.setAttribute("inert", "");
    if (tab) tab.hidden = false;
    document.getElementById("musicDockCollapse")?.setAttribute("aria-expanded", "false");
    document.getElementById("soundPeek")?.setAttribute("aria-expanded", "false");
  }

  tracks.forEach((track) => {
    const audio = track.audio;
    audio.addEventListener("play", () => {
      pauseAll(audio);
      updateUI();
    });
    audio.addEventListener("pause", updateUI);
    audio.addEventListener("ended", () => {
      updateUI();
      notify(track.id === "birthday" ? "خلصت الأغنية… عيديها لو حبيتي 💗" : "خلصت Rewrite The Stars… سيبها ذكرى حلوة 🎧");
    });
    audio.addEventListener("timeupdate", () => {
      if (tracks[current].audio === audio) updateTimes();
    });
    audio.addEventListener("loadedmetadata", () => {
      if (tracks[current].audio === audio) updateTimes();
    });
    audio.addEventListener("durationchange", () => {
      if (tracks[current].audio === audio) updateTimes();
    });
    audio.addEventListener("error", () => {
      if (tracks[current].audio === audio) {
        notify("ملف الأغنية مش ظاهر… راجعي assets/audio وتأكدي من اسم الملف.", 5000);
      }
    });
  });

  document.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-music-action]");
    if (!actionButton) return;
    event.preventDefault();
    const action = actionButton.dataset.musicAction;
    switch (action) {
      case "play-personal": playTrack(1); break;
      case "play-birthday": playTrack(0); break;
      case "toggle": toggle(); break;
      case "pause": pauseCurrent(); break;
      case "restart": playTrack(current, { restart: true }); break;
      case "restart-personal": playTrack(1, { restart: true }); break;
      case "previous": changeTrack(-1); break;
      case "next": changeTrack(1); break;
      case "forward": {
        const audio = tracks[current].audio;
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
        updateTimes();
        break;
      }
      case "rewind": {
        const audio = tracks[current].audio;
        audio.currentTime = Math.max(0, audio.currentTime - 10);
        updateTimes();
        break;
      }
      case "mute": toggleMute(); break;
      default: break;
    }
  });

  if (seek) {
    seek.addEventListener("pointerdown", () => { isLoadingSeek = true; });
    seek.addEventListener("input", () => {
      const audio = tracks[current].audio;
      if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, Math.max(0, Number(seek.value)));
      if (currentTimeEl && Number.isFinite(audio.duration)) currentTimeEl.textContent = formatTime(audio.currentTime);
    });
    const finishSeek = () => { isLoadingSeek = false; updateTimes(); };
    seek.addEventListener("pointerup", finishSeek);
    seek.addEventListener("change", finishSeek);
  }

  document.getElementById("musicDockCollapse")?.addEventListener("click", closeDock);
  document.getElementById("soundPeek")?.addEventListener("click", () => {
    if (dock?.classList.contains("is-collapsed")) openDock();
    else closeDock();
  });
  tab?.addEventListener("click", openDock);

  // The dock starts folded into the header so it never covers a scene.
  closeDock();

  updateUI();
  updateTimes();

  window.dodyMusic = {
    playBirthday: (restart = false) => playTrack(0, { restart }),
    playPersonal: (restart = false) => playTrack(1, { restart }),
    pause: pauseCurrent,
    toggle,
    current: () => tracks[current].id,
    isPlaying: () => isPlaying(),
    openDock,
    closeDock,
    tracks: tracks.map(({ id, title, subtitle }) => ({ id, title, subtitle }))
  };
})();
