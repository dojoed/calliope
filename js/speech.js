/* Calliope — voice + sound engine
 *
 * Uses the device's built-in text-to-speech (no audio files needed, works
 * offline). All sounds respect the parent's volume setting, are gentle, and
 * never sudden/loud — per autism-friendly design guidance.
 */
window.Sound = (function () {
  let voice = null;
  let warmed = false;
  let audioCtx = null;
  const voiceListeners = [];

  // macOS/iOS ship novelty/robotic voices we never want to pick automatically.
  // Siri voices are also excluded: they appear in getVoices() but are
  // restricted by the OS and produce *silence* when used from a web page.
  const BAD = /(Siri|Albert|Bad News|Good News|Bahh|Bells|Boing|Bubbles|Cellos|Wobble|Jester|Organ|Superstar|Trinoids|Whisper|Zarvox|Deranged|Hysterical|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley|Junior|Ralph|Fred|Kathy|Novelty)/i;

  function allEnglishVoices() {
    const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    return voices
      .filter(v => /^en/i.test(v.lang) && !BAD.test(v.name))
      .sort((a, b) => score(b) - score(a));
  }

  const IS_CHROME = /Chrome\//.test(navigator.userAgent) && !/Edg|OPR/.test(navigator.userAgent);

  // Higher score = nicer. Enhanced/premium/natural voices win; US English next.
  // EXCEPT in Chrome on macOS: Chrome lists the system's Enhanced voices but
  // renders them as silence — there, its own Google voices are the good ones.
  function score(v) {
    let s = 0;
    const n = v.name || '';
    if (IS_CHROME) {
      if (/Google/i.test(n)) s += 200;
      if (/Enhanced|Premium/i.test(n)) s -= 50;
    } else if (/Enhanced|Premium|Neural|Natural/i.test(n)) s += 100;
    if (['Samantha', 'Ava', 'Allison', 'Joelle', 'Nicky', 'Karen', 'Moira', 'Serena'].some(x => n.includes(x))) s += 30;
    if (/Google US English/i.test(n)) s += 40;
    if (/Google UK English Female/i.test(n)) s += 25;
    if (/^en[-_]US/i.test(v.lang)) s += 20;
    else if (/^en[-_]GB/i.test(v.lang)) s += 12;
    if (/female/i.test(n)) s += 5; // warmer default for a small child
    if (v.localService) s += 2;
    return s;
  }

  function chooseVoice() {
    const all = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    if (!all.length) return null;
    const savedURI = Store.get('voice');
    if (savedURI) {
      const saved = all.find(v => v.voiceURI === savedURI);
      if (saved && !BAD.test(saved.name)) return saved;
    }
    const eng = allEnglishVoices();
    return eng[0] || all.find(v => /^en/i.test(v.lang)) || all[0];
  }

  if (window.speechSynthesis) {
    voice = chooseVoice();
    speechSynthesis.onvoiceschanged = () => {
      voice = chooseVoice();
      voiceListeners.forEach(cb => { try { cb(); } catch (e) {} });
    };
  }

  function ctx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // Play a soft tone. gain stays low; quick fade in/out so it never "pops".
  function tone(freq, when, dur, peak) {
    const c = ctx();
    if (!c) return;
    const vol = Store.get('volume');
    if (vol <= 0) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const top = (peak == null ? 0.18 : peak) * vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(top, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // Telemetry for the on-page debug panel (?debug=1).
  function emit(phase, detail) {
    try { window.dispatchEvent(new CustomEvent('calliope:tts', { detail: Object.assign({ phase }, detail || {}) })); } catch (e) {}
  }

  return {
    // Call once from a user gesture so iOS allows speech later.
    warmup() {
      if (warmed) return;
      warmed = true;
      ctx();
      if (window.speechSynthesis) {
        try {
          // A near-silent (not zero — iOS may skip volume-0) utterance spoken
          // inside the gesture unlocks the synthesizer for later calls.
          speechSynthesis.resume();
          const u = new SpeechSynthesisUtterance('a');
          u.volume = 0.01;
          speechSynthesis.speak(u);
        } catch (e) {}
      }
    },

    speak(text, opts) {
      if (!window.speechSynthesis || !text) return;
      const vol = Store.get('volume');
      if (vol <= 0) return;
      opts = opts || {};
      const u = new SpeechSynthesisUtterance(String(text));
      if (!voice) voice = chooseVoice();
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || 'en-US';
      u.rate = opts.rate != null ? opts.rate : Store.get('speechRate');
      u.pitch = opts.pitch != null ? opts.pitch : 1.0;
      u.volume = vol;
      let started = false;
      u.onstart = () => { started = true; emit('start', { text }); };
      u.onend = () => { emit('end', { text }); if (opts.onend) opts.onend(); };

      const synth = speechSynthesis;
      const self = this;
      // Retry with the browser's own default voice (no voice object at all) —
      // used when a listed voice turns out to be unusable.
      function retryDefault(why) {
        emit('retry-default', { text, why });
        const fallback = new SpeechSynthesisUtterance(String(text));
        fallback.lang = 'en-US';
        fallback.rate = u.rate; fallback.pitch = u.pitch; fallback.volume = u.volume;
        fallback.onstart = () => { started = true; emit('start', { text, via: 'fallback' }); };
        if (opts.onend) fallback.onend = opts.onend;
        self._u = fallback;
        try { synth.cancel(); } catch (e) {}
        try { synth.resume(); synth.speak(fallback); } catch (e) {}
      }
      u.onerror = (ev) => {
        const code = (ev && ev.error) || '?';
        emit('error', { text, error: code });
        // 'interrupted'/'canceled' just mean we started saying something new.
        if (code === 'interrupted' || code === 'canceled') return;
        retryDefault('error:' + code);
      };

      // Keep a reference so Chrome's GC can't reap the utterance mid-speech.
      this._u = u;
      const fire = () => { try { synth.resume(); synth.speak(u); } catch (e) { emit('throw', { text }); } };
      const wasBusy = synth.speaking || synth.pending;
      emit('try', { text, voice: (u.voice && u.voice.name) || '(default)', busy: wasBusy });
      try { synth.cancel(); } catch (e) {}
      if (wasBusy) {
        // iOS/Chrome quirk: speak() in the same tick as cancel() is often
        // silently dropped — defer just past the cancellation.
        setTimeout(fire, 60);
      } else {
        // Speak synchronously so Safari still sees the user gesture (its
        // first-speech unlock requires speak() inside the tap handler).
        fire();
      }
      // Watchdog: Chrome can fail a bad voice with NO error event — the
      // utterance simply never starts. If nothing started after 900ms, fall
      // back to the default voice (once).
      if (u.voice) {
        setTimeout(() => {
          if (!started && self._u === u && !synth.speaking) retryDefault('watchdog');
        }, 900);
      }
    },

    ctxState() { return audioCtx ? audioCtx.state : 'none'; },

    // A soft two-note "well done" chime.
    chime() {
      tone(660, 0, 0.18);
      tone(880, 0.12, 0.22);
    },

    // A short, soft blip for taps / pops.
    pop() {
      tone(520, 0, 0.12, 0.14);
    },

    // A gentle little rising arpeggio for finishing an activity.
    celebrate() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.22));
    },

    // ---- voice selection (used by Parent Settings) ----
    englishVoices() { return allEnglishVoices(); },
    currentVoiceURI() { return (voice && voice.voiceURI) || null; },
    setVoice(uri) { Store.set('voice', uri || null); voice = chooseVoice(); },
    onVoices(cb) { voiceListeners.push(cb); if (voice) cb(); },
  };
})();
