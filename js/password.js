/* Interactive birthday-date gate. This is a narrative gate, not real security. */
(function () {
  "use strict";

  const form = document.getElementById("passwordForm");
  if (!form) return;

  const display = document.getElementById("passwordDisplay");
  const slots = Array.from(display.querySelectorAll(".password-slot"));
  const nativeInput = document.getElementById("passwordNative");
  const errorBox = document.getElementById("passwordError");
  const envelope = document.getElementById("passwordEnvelope");
  const card = form.closest(".gate-card");
  const success = document.getElementById("gateSuccess");
  const gateScene = document.querySelector('.scene[data-scene="0"]');
  const correctDigits = "21112006";
  const wrongMessage = "قربي شوية يا دودي، إنتِ عارفة التاريخ ده كويس 😂💗";
  let value = "";
  let isUnlocked = false;

  const normalizeDate = (input) => {
    const raw = String(input || "").trim();
    if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(raw)) return raw.replace(/[/-]/g, "");
    if (/^\d{8}$/.test(raw)) return raw;
    return raw.replace(/[^\d]/g, "").slice(0, 8);
  };

  const isValidDate = (input) => normalizeDate(input) === correctDigits;

  function render() {
    slots.forEach((slot, index) => {
      slot.textContent = value[index] || "";
      slot.classList.toggle("is-filled", Boolean(value[index]));
    });
    nativeInput.value = value;
    display.setAttribute("aria-label", value.length ? `التاريخ المدخل ${value.split("").join(" ")}` : "لم يتم إدخال التاريخ بعد");
  }

  function setError(message) {
    errorBox.textContent = message;
    nativeInput.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function resetError() {
    if (errorBox.textContent) setError("");
  }

  function addDigit(digit) {
    if (isUnlocked) return;
    if (value.length >= 8) return;
    value += digit;
    resetError();
    render();
    if (value.length === 8) {
      // Give the eighth key a moment to land visually before evaluating.
      window.setTimeout(() => submit(), 180);
    }
  }

  function clearDigits() {
    if (isUnlocked) return;
    value = "";
    setError("");
    render();
  }

  function submit() {
    if (isUnlocked) return;
    if (value.length !== 8) {
      setError("لسه فاضل أرقام… كمّلي التاريخ يا دودي 💗");
      form.classList.remove("is-shaking");
      void form.offsetWidth;
      form.classList.add("is-shaking");
      return;
    }
    if (!isValidDate(value)) {
      setError(wrongMessage);
      form.classList.remove("is-shaking");
      void form.offsetWidth;
      form.classList.add("is-shaking");
      value = "";
      window.setTimeout(render, 420);
      return;
    }
    unlock();
  }

  function unlock() {
    isUnlocked = true;
    setError("");
    envelope.classList.add("is-opening");
    card.classList.add("is-unlocked");
    display.setAttribute("aria-label", "تم إدخال التاريخ الصحيح");
    window.setTimeout(() => {
      success.classList.add("is-visible");
      success.setAttribute("aria-hidden", "false");
      form.setAttribute("aria-hidden", "true");
      form.style.visibility = "hidden";
      success.scrollIntoView({ behavior: "smooth", block: "center" });
      window.dodyApp?.notify?.("قلبي كان متأكد إنك هتعرفيها 💗");
      document.dispatchEvent(new CustomEvent("dody:gate-unlocked"));
      const firstButton = success.querySelector("button");
      firstButton?.focus({ preventScroll: true });
    }, 1150);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit();
  });

  form.querySelectorAll("[data-digit]").forEach((button) => {
    button.addEventListener("click", () => addDigit(button.dataset.digit));
  });

  form.querySelector('[data-password-action="clear"]')?.addEventListener("click", clearDigits);

  document.addEventListener("keydown", (event) => {
    if (isUnlocked || !gateScene?.classList.contains("is-active")) return;
    const activeTag = document.activeElement?.tagName;
    if (activeTag === "INPUT" && document.activeElement !== nativeInput) return;
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      addDigit(event.key);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      value = value.slice(0, -1);
      resetError();
      render();
    } else if (event.key === "Enter") {
      if (value.length) {
        event.preventDefault();
        submit();
      }
    } else if (event.key === "Escape") {
      clearDigits();
    }
  });

  // Paste or autofill support for all three accepted formats.
  nativeInput.addEventListener("input", () => {
    value = normalizeDate(nativeInput.value);
    resetError();
    render();
  });

  form.addEventListener("animationend", (event) => {
    if (event.animationName === "shakeX") form.classList.remove("is-shaking");
  });

  form.classList.add("is-ready");
  render();

  window.dodyGate = {
    validate: isValidDate,
    normalize: normalizeDate,
    get value() { return value; },
    unlock,
    reset() {
      value = "";
      isUnlocked = false;
      form.style.visibility = "";
      form.removeAttribute("aria-hidden");
      success.classList.remove("is-visible");
      success.setAttribute("aria-hidden", "true");
      envelope.classList.remove("is-opening");
      card.classList.remove("is-unlocked");
      setError("");
      render();
      form.querySelector("[data-digit]")?.focus();
    }
  };
})();
