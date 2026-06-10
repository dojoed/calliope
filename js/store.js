/* Calliope — settings store
 *
 * Persists parent settings in localStorage. Everything has a sensible default
 * so the app works on first run with nothing saved.
 */
window.Store = (function () {
  const KEY = 'calliope.settings.v1';

  const DEFAULTS = {
    volume: 0.9,          // 0..1
    speechRate: 0.95,     // a touch slower than normal — clear, still natural
    voice: null,          // chosen voiceURI (null => best auto-pick)
    reduceMotion: false,  // calmer; auto-on if the OS asks for reduced motion
    showText: true,       // show the printed word under symbols
    findItChoices: 2,     // number of options in "Find It" (starting level)
    findItAdaptive: true, // auto level 2→3→4 on success streaks
    theme: 'light',       // 'auto' | 'light' | 'dark'
    seenWelcome: false,   // first-run parent welcome shown?
    enabled: {            // which activities appear on the home screen
      pop: true, sounds: true, words: true, findit: true, talk: true, day: true,
      trace: true, color: true, move: true, feed: true,
    },
    // schedule is stored as an array of ids referencing CALLIOPE_DATA.schedule
    schedule: null,       // null => use the default order from data.js
  };

  function load() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
    const s = Object.assign({}, DEFAULTS, saved);
    s.enabled = Object.assign({}, DEFAULTS.enabled, saved.enabled || {});
    // Respect the operating system's reduce-motion preference on first run.
    if (saved.reduceMotion === undefined &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      s.reduceMotion = true;
    }
    return s;
  }

  let state = load();

  return {
    all() { return state; },
    get(k) { return state[k]; },
    set(k, v) {
      state[k] = v;
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
      window.dispatchEvent(new CustomEvent('calliope:settings', { detail: { key: k } }));
    },
    reset() {
      try { localStorage.removeItem(KEY); } catch (e) {}
      state = load();
      window.dispatchEvent(new CustomEvent('calliope:settings', { detail: { key: '*' } }));
    },
  };
})();
