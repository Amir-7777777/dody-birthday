/* Cairo-accurate age counter and pre-birthday countdown. */
(function () {
  "use strict";

  const TZ = "Africa/Cairo";
  const BIRTH = { year: 2006, month: 11, day: 21, hour: 0, minute: 0, second: 0 };
  const MILESTONE = { year: 2026, month: 11, day: 21, hour: 0, minute: 0, second: 0 };
  const DAY_MS = 86400000;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });

  function cairoParts(date) {
    const out = {};
    for (const part of formatter.formatToParts(date)) {
      if (part.type !== "literal") out[part.type] = Number(part.value);
    }
    return {
      year: out.year,
      month: out.month,
      day: out.day,
      hour: out.hour,
      minute: out.minute,
      second: out.second
    };
  }

  // Convert a Cairo wall-clock moment to a true UTC timestamp, DST included.
  function cairoToTimestamp(parts) {
    const desiredWall = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour || 0, parts.minute || 0, parts.second || 0);
    let guess = desiredWall;
    for (let i = 0; i < 3; i += 1) {
      const actual = cairoParts(new Date(guess));
      const actualWall = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
      const correction = desiredWall - actualWall;
      if (correction === 0) break;
      guess += correction;
    }
    return guess;
  }

  const birthTimestamp = cairoToTimestamp(BIRTH);
  const milestoneTimestamp = cairoToTimestamp(MILESTONE);

  function snapshot(now = new Date()) {
    const nowMs = now.getTime();
    if (nowMs < milestoneTimestamp) {
      let remaining = Math.max(0, milestoneTimestamp - nowMs);
      const totalSeconds = Math.floor(remaining / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return {
        mode: "countdown",
        days,
        hours,
        minutes,
        seconds,
        totalSeconds,
        atMilestone: false
      };
    }

    const c = cairoParts(now);
    let years = c.year - BIRTH.year;
    const currentWall = Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second);
    let anniversaryWall = Date.UTC(BIRTH.year + years, BIRTH.month - 1, BIRTH.day, BIRTH.hour, BIRTH.minute, BIRTH.second);
    if (currentWall < anniversaryWall) {
      years -= 1;
      anniversaryWall = Date.UTC(BIRTH.year + years, BIRTH.month - 1, BIRTH.day, BIRTH.hour, BIRTH.minute, BIRTH.second);
    }

    let months = c.month - BIRTH.month;
    if (months < 0) months += 12;
    let anchorWall = Date.UTC(BIRTH.year + years, BIRTH.month - 1 + months, BIRTH.day, BIRTH.hour, BIRTH.minute, BIRTH.second);
    if (anchorWall > currentWall) {
      months -= 1;
      if (months < 0) months = 11;
      anchorWall = Date.UTC(BIRTH.year + years, BIRTH.month - 1 + months, BIRTH.day, BIRTH.hour, BIRTH.minute, BIRTH.second);
    }

    const remainder = Math.max(0, currentWall - anchorWall);
    const days = Math.floor(remainder / DAY_MS);
    const hours = Math.floor((remainder % DAY_MS) / 3600000);
    const minutes = Math.floor((remainder % 3600000) / 60000);
    const seconds = Math.floor((remainder % 60000) / 1000);

    return {
      mode: "elapsed",
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      totalSeconds: Math.floor((nowMs - birthTimestamp) / 1000),
      atMilestone: nowMs >= milestoneTimestamp
    };
  }

  const els = {
    countdownPanel: document.getElementById("countdownPanel"),
    elapsedPanel: document.getElementById("elapsedPanel"),
    cdDays: document.getElementById("cdDays"),
    cdHours: document.getElementById("cdHours"),
    cdMinutes: document.getElementById("cdMinutes"),
    cdSeconds: document.getElementById("cdSeconds"),
    years: document.getElementById("yearsValue"),
    months: document.getElementById("monthsValue"),
    days: document.getElementById("daysValue"),
    hours: document.getElementById("hoursValue"),
    minutes: document.getElementById("minutesValue"),
    seconds: document.getElementById("secondsValue"),
    status: document.getElementById("birthdayStatus")
  };

  if (!els.elapsedPanel) return;

  const pad = (value, length = 2) => String(Math.max(0, value)).padStart(length, "0");

  function write(el, value, length = 2) {
    if (!el) return;
    const next = pad(value, length);
    if (el.textContent !== next) {
      el.textContent = next;
      el.classList.remove("is-ticking");
      void el.offsetWidth;
      el.classList.add("is-ticking");
    }
  }

  function render() {
    const data = snapshot(new Date());
    if (data.mode === "countdown") {
      if (els.countdownPanel) els.countdownPanel.hidden = false;
      if (els.elapsedPanel) els.elapsedPanel.hidden = true;
      write(els.cdDays, data.days, data.days > 99 ? 3 : 2);
      write(els.cdHours, data.hours);
      write(els.cdMinutes, data.minutes);
      write(els.cdSeconds, data.seconds);
      if (els.status) els.status.textContent = "عيد ميلادك قرب… 20 سنة 💗";
      document.body.dataset.birthdayMode = "countdown";
    } else {
      if (els.countdownPanel) els.countdownPanel.hidden = true;
      if (els.elapsedPanel) els.elapsedPanel.hidden = false;
      write(els.years, data.years);
      write(els.months, data.months);
      write(els.days, data.days);
      write(els.hours, data.hours);
      write(els.minutes, data.minutes);
      write(els.seconds, data.seconds);
      if (els.status) els.status.textContent = "Happy 20th Birthday!";
      document.body.dataset.birthdayMode = "elapsed";
    }
    document.body.dataset.ageYears = data.mode === "elapsed" ? String(data.years) : "19";
    return data;
  }

  let timer = 0;
  function start() {
    render();
    window.clearInterval(timer);
    timer = window.setInterval(render, 1000);
  }

  // Re-sync immediately after the device wakes or the tab becomes visible again.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });
  window.addEventListener("focus", render);

  start();

  window.dodyCountdown = {
    getSnapshot: (date) => snapshot(date),
    render,
    timeZone: TZ,
    birthTimestamp,
    milestoneTimestamp,
    reset: start
  };
})();
