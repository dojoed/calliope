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
  const BAD = /(Albert|Bad News|Good News|Bahh|Bells|Boing|Bubbles|Cellos|Wobble|Jester|Organ|Superstar|Trinoids|Whisper|Zarvox|Deranged|Hysterical|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley|Junior|Ralph|Fred|Kathy|Novelty)/i;

  function allEnglishVoices() {
    const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    return voices
      .filter(v => /^en/i.test(v.lang) && !BAD.test(v.name))
      .sort((a, b) => score(b) - score(a));
  }

  // Higher score = nicer. Enhanced/premium/natural voices win; US English next.
  function score(v) {
    let s = 0;
    const n = v.name || '';
    if (/Enhanced|Premium|Neural|Natural/i.test(n)) s += 100;
    if (/Siri/i.test(n)) s += 80;
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
      if (saved) return saved;
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

  return {
    // Call once from a user gesture so iOS allows speech later.
    warmup() {
      if (warmed) return;
      warmed = true;
      ctx();
      if (window.speechSynthesis) {
        try {
          const u = new SpeechSynthesisUtterance(' ');
          u.volume = 0;
          speechSynthesis.speak(u);
        } catch (e) {}
      }
    },

    speak(text, opts) {
      if (!window.speechSynthesis || !text) return;
      const vol = Store.get('volume');
      if (vol <= 0) return;
      opts = opts || {};
      try { speechSynthesis.cancel(); } catch (e) {}
      const u = new SpeechSynthesisUtterance(String(text));
      if (!voice) voice = chooseVoice();
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || 'en-US';
      u.rate = opts.rate != null ? opts.rate : Store.get('speechRate');
      u.pitch = opts.pitch != null ? opts.pitch : 1.0;
      u.volume = vol;
      if (opts.onend) u.onend = opts.onend;
      try { speechSynthesis.speak(u); } catch (e) {}
    },

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
