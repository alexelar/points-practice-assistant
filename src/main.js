import { MicVAD } from "@ricky0123/vad-web";
import { translations } from "./translations.js";
import { Settings } from "./settings.js";

class ExerciseAssistant {
  constructor() {
    this.initState();
    this.settings = new Settings();
    this.initUI();
  }

  initState() {
    this.state = "idle";
    this.cycleCount = 0;
    this.isRunning = false;
    this.vad = null;
    this.voiceDetected = false;
    this.wakeLock = null;
    this.sessionStartTime = null;
    this.durationInterval = null;
    this.commandPath = "./assets/audio";
    this.commands = {
      inspect: { filename: "command1.mp3" },
      find: { filename: "command2.mp3" },
      touch: { filename: "command3.mp3" },
      finger: { filename: "command4.mp3" },
      body: { filename: "command5.mp3" },
      temp: { filename: "command6.mp3" },
      release: { filename: "command7.mp3" },
    };
    this.confirmations = [
      { filename: "confirmation1.mp3" },
      { filename: "confirmation2.mp3" },
      { filename: "confirmation3.mp3" },
      { filename: "confirmation4.mp3" },
      { filename: "confirmation5.mp3" },
    ];
    this.audioCache = {};
    this.audioContext = null;
  }

  initUI() {
    this.startBtn = document.getElementById("startBtn");
    this.stopBtn = document.getElementById("stopBtn");
    this.statusEl = document.getElementById("status");
    this.cycleCountEl = document.getElementById("cycleCount");
    this.durationEl = document.getElementById("duration");
    this.settingsBtn = document.getElementById("settingsBtn");
    this.settingsModal = document.getElementById("settingsModal");

    this.startBtn.addEventListener("click", () => this.startSession());
    this.stopBtn.addEventListener("click", () => this.stopSession());
    document.getElementById("language").addEventListener("change", (e) => {
      this.settings.changeLanguage(e.target.value);
      this.updateLanguage();
    });

    document.getElementById("version").textContent = `v${__BUILD_TIME__}`;
    this.updateLanguage();
  }

  t(key) {
    if (!key) return "";
    return translations[this.settings.lang]?.[key] || key;
  }

  updateLanguage() {
    document.documentElement.lang = this.settings.lang;
    document.title = this.t("title");
    document.querySelectorAll("[data-i18n]").forEach(el => {
      if (el.dataset.i18n.length > 0) {
        el.textContent = this.t(el.dataset.i18n);
      }
    });
  }

  async startSession() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      if (Object.keys(this.audioCache).length === 0) {
        this.updateUI(this.t("audioLoading"));
        await this.preloadAudio();
      }
      this.updateUI(this.t("preparation"));
      await this.initVAD();
      this.delay(3000);
      await this.requestWakeLock();
      this.isRunning = true;
      this.cycleCount = 0;
      this.sessionStartTime = Date.now();
      this.startBtn.disabled = true;
      this.stopBtn.disabled = false;
      this.updateUI(this.t("sessionStarted"));
      this.startDurationTimer();
      this.runCycle();
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        alert(this.t("micRequired"));
      } else if (err.name === 'NotFoundError') {
        alert(this.t("micNotFound"));
      } else {
        alert(this.t("sessionError") + ": " + err.message);
      }
    }
  }

  stopSession() {
    this.isRunning = false;
    this.startBtn.disabled = false;
    this.stopBtn.disabled = true;
    this.updateUI(this.t("sessionStopped"));
    this.stopDurationTimer();
    if (this.vad) {
      this.vad.destroy();
      this.vad = null;
    }
    this.releaseWakeLock();
  }

  async initVAD() {
    const base = import.meta.env.BASE_URL;
    this.vad = await MicVAD.new({
      baseAssetPath: `${base}assets/vad/`,
      onnxWASMBasePath: `${base}assets/vad/`,
      positiveSpeechThreshold: this.settings.positiveSpeechThreshold,
      negativeSpeechThreshold: this.settings.negativeSpeechThreshold,
      minSpeechMs: this.settings.minSpeechMs,
      redemptionMs: this.settings.redemptionMs,
      onSpeechRealStart: () => {
        this.updateUI(this.t("voiceDetected"));
      },
      onSpeechEnd: () => {
        this.voiceDetected = true;
      }
    });
    this.vad.pause();
  }

  async requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        this.wakeLock = await navigator.wakeLock.request("screen");
      }
    } catch (err) {
      console.log("Wake Lock not supported:", err);
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  async preloadAudio() {
    const allFiles = [
      ...Object.values(this.commands).map(c => c.filename),
      ...this.confirmations.map(c => c.filename)
    ];
    
    await Promise.all(allFiles.map(async filename => {
      const response = await fetch(this.commandPath + "/" + filename);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.audioCache[filename] = audioBuffer;
    }));
  }

  async runCycle() {
    if (!this.isRunning) return;

    this.cycleCount++;
    this.cycleCountEl.textContent = this.cycleCount;

    let commandsToPlay = [];

    const shouldShuffle = this.cycleCount % this.settings.shuffleInterval === 0;
    const feelCommands = [this.commands.finger, this.commands.body, this.commands.temp];
    if (shouldShuffle) {
      feelCommands.sort(() => Math.random() - 0.5);
    }

    if (this.cycleCount % this.settings.inspectBodyInterval === 1) {
      commandsToPlay.push(this.commands.inspect);
    }
    commandsToPlay.push(this.commands.find);
    if (this.settings.sessionMode !== "short") {
      commandsToPlay.push(this.commands.touch);
    }
    commandsToPlay = commandsToPlay.concat(feelCommands);
    commandsToPlay.push({ ...this.commands.release, ...{ deaf: this.settings.sessionMode === "short" }});

    const fields = { filename: '', deaf: false };
    while (this.isRunning && commandsToPlay.length > 0) {
      const command = { ...fields, ...commandsToPlay.shift() };
      await this.playCommandAndWait(command);
    }

    this.runCycle();
  }

  async playCommandAndWait(command) {
    if (!this.isRunning) return;
    await this.playCommand(command)
    if (command.deaf) return;
    const voiceDetected = await this.listenForVoice();
    if (!voiceDetected) {
      await this.playCommandAndWait(command);
      return;
    }
    await this.delay(300);
    const confirmation = this.confirmations[Math.floor(Math.random() * this.confirmations.length)];
    await this.playConfirmation(confirmation);
    await this.initVAD();
  }

  async playCommand(command) {
    if (!this.isRunning) return;
    const startTime = performance.now();
    const buffer = this.audioCache[command.filename];
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = this.settings.playbackRate;
    source.connect(this.audioContext.destination);
    const playStart = performance.now();
    source.start(0);
    const playDelay = Math.round(performance.now() - playStart);
    await new Promise((resolve) => (source.onended = resolve));
    const totalTime = Math.round(performance.now() - startTime);
  }

  async playConfirmation(confirmation) {
    if (!this.isRunning) return;
    const startTime = performance.now();
    const buffer = this.audioCache[confirmation.filename];
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = this.settings.playbackRate;
    source.connect(this.audioContext.destination);
    const playStart = performance.now();
    source.start(0);
    const playDelay = Math.round(performance.now() - playStart);
    await new Promise((resolve) => (source.onended = resolve));
    const totalTime = Math.round(performance.now() - startTime);
  }

  async listenForVoice() {
    if (!this.isRunning) return false;
    this.updateUI(this.t("listeningForVoice"));
    this.voiceDetected = false;
    this.vad.start();
    const result = await this.waitForVoice();
    
    // Force stop all mic tracks
    if (this.vad.stream) {
      this.vad.stream.getTracks().forEach(track => track.stop());
    }
    this.vad.destroy();
    this.vad = null;
    return result;
  }

  async waitForVoice() {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const timeout = this.settings.repeatTimeout * 1000;

      const check = () => {
        if (!this.isRunning || Date.now() - startTime > timeout) {
          resolve(false);
          return;
        }

        if (this.voiceDetected) {
          resolve(true);
          return;
        }

        requestAnimationFrame(check);
      };

      check();
    });
  }

  startDurationTimer() {
    this.updateDuration();
    this.durationInterval = setInterval(() => this.updateDuration(), 1000);
  }

  stopDurationTimer() {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
  }

  updateDuration() {
    const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    this.durationEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  updateUI(status) {
    this.statusEl.textContent = status;
  }
}

const app = new ExerciseAssistant();
