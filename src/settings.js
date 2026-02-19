export class Settings {
  constructor() {
    const isAndroid = /Android/i.test(navigator.userAgent);
    this.lang = localStorage.getItem("language") || "ru";
    this.inputMode = localStorage.getItem("inputMode") || "voice";
    this.sessionMode = localStorage.getItem("sessionMode") || "full";
    this.playbackRate =
      localStorage.getItem("playbackRate") !== null ? parseFloat(localStorage.getItem("playbackRate")) : 1.2;
    this.inspectBodyInterval =
      localStorage.getItem("inspectBodyInterval") !== null ? parseInt(localStorage.getItem("inspectBodyInterval")) : 10;
    this.shuffleInterval =
      localStorage.getItem("shuffleInterval") !== null ? parseInt(localStorage.getItem("shuffleInterval")) : 3;
    this.repeatTimeout =
      localStorage.getItem("repeatTimeout") !== null ? parseInt(localStorage.getItem("repeatTimeout")) : 10;
    this.positiveSpeechThreshold =
      localStorage.getItem("positiveSpeechThreshold") !== null
        ? parseFloat(localStorage.getItem("positiveSpeechThreshold"))
        : 0.6;
    this.negativeSpeechThreshold =
      localStorage.getItem("negativeSpeechThreshold") !== null
        ? parseFloat(localStorage.getItem("negativeSpeechThreshold"))
        : 0.5;
    this.minSpeechMs =
      localStorage.getItem("minSpeechMs") !== null ? parseInt(localStorage.getItem("minSpeechMs")) : 200;
    this.redemptionMs =
      localStorage.getItem("redemptionMs") !== null ? parseInt(localStorage.getItem("redemptionMs")) : 300;
    this.postVadDelayMs =
      localStorage.getItem("postVadDelayMs") !== null
        ? parseInt(localStorage.getItem("postVadDelayMs"))
        : isAndroid
          ? 600
          : 0;

    this.settingsModal = document.getElementById("settingsModal");
    this.inputModeEl = document.getElementById("inputMode");
    this.vadSettingsEls = [
      document.getElementById("positiveSpeechThreshold"),
      document.getElementById("negativeSpeechThreshold"),
      document.getElementById("minSpeechMs"),
      document.getElementById("redemptionMs"),
    ];
    this.initEventListeners();
  }

  initEventListeners() {
    document.getElementById("settingsBtn").addEventListener("click", () => this.open());
    document.getElementById("closeSettings").addEventListener("click", () => this.close());
    document.getElementById("closeSettingsIcon").addEventListener("click", () => this.close());
    document.getElementById("language").addEventListener("change", (e) => this.changeLanguage(e.target.value));
    this.settingsModal.addEventListener("click", (e) => {
      if (e.target === this.settingsModal) this.close();
    });
  }

  changeLanguage(lang) {
    this.lang = lang;
    localStorage.setItem("language", lang);
  }

  open() {
    document.getElementById("language").value = this.lang;
    document.getElementById("inputMode").value = this.inputMode;
    document.getElementById("sessionMode").value = this.sessionMode;
    document.getElementById("playbackRate").value = this.playbackRate;
    document.getElementById("inspectBodyInterval").value = this.inspectBodyInterval;
    document.getElementById("shuffleInterval").value = this.shuffleInterval;
    document.getElementById("repeatTimeout").value = this.repeatTimeout;
    document.getElementById("positiveSpeechThreshold").value = this.positiveSpeechThreshold;
    document.getElementById("negativeSpeechThreshold").value = this.negativeSpeechThreshold;
    document.getElementById("minSpeechMs").value = this.minSpeechMs;
    document.getElementById("redemptionMs").value = this.redemptionMs;
    document.getElementById("postVadDelayMs").value = this.postVadDelayMs;

    this.settingsModal.classList.add("show");
  }

  close() {
    this.inputMode = document.getElementById("inputMode").value;
    this.sessionMode = document.getElementById("sessionMode").value;
    this.playbackRate = parseFloat(document.getElementById("playbackRate").value);
    this.inspectBodyInterval = parseInt(document.getElementById("inspectBodyInterval").value);
    this.shuffleInterval = parseInt(document.getElementById("shuffleInterval").value);
    this.repeatTimeout = parseInt(document.getElementById("repeatTimeout").value);
    this.positiveSpeechThreshold = parseFloat(document.getElementById("positiveSpeechThreshold").value);
    this.negativeSpeechThreshold = parseFloat(document.getElementById("negativeSpeechThreshold").value);
    this.minSpeechMs = parseInt(document.getElementById("minSpeechMs").value);
    this.redemptionMs = parseInt(document.getElementById("redemptionMs").value);
    this.postVadDelayMs = parseInt(document.getElementById("postVadDelayMs").value);

    localStorage.setItem("inputMode", this.inputMode);
    localStorage.setItem("sessionMode", this.sessionMode);
    localStorage.setItem("playbackRate", this.playbackRate);
    localStorage.setItem("inspectBodyInterval", this.inspectBodyInterval);
    localStorage.setItem("shuffleInterval", this.shuffleInterval);
    localStorage.setItem("repeatTimeout", this.repeatTimeout);
    localStorage.setItem("positiveSpeechThreshold", this.positiveSpeechThreshold);
    localStorage.setItem("negativeSpeechThreshold", this.negativeSpeechThreshold);
    localStorage.setItem("minSpeechMs", this.minSpeechMs);
    localStorage.setItem("redemptionMs", this.redemptionMs);
    localStorage.setItem("postVadDelayMs", this.postVadDelayMs);

    this.settingsModal.classList.remove("show");
  }

  setSessionLock(lock) {
    this.inputModeEl.disabled = lock;
    this.vadSettingsEls.forEach(el => el.disabled = lock);
  }
}
