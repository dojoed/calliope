/* Calliope — progress tracking + sticker book.
 *
 * Lightweight daily counters in localStorage. No accounts, nothing leaves the
 * device. The parent dashboard summarizes the last 7 days — useful to share
 * with an SLP/OT ("she heard 240 modeled words this week").
 */
window.Stats = (function () {
  const KEY = 'calliope.stats.v1';
  const STICKER_KEY = 'calliope.stickers.v1';

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function loadAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function saveAll(all) {
    // Keep at most ~60 days so storage stays tiny.
    const keys = Object.keys(all).sort();
    while (keys.length > 60) delete all[keys.shift()];
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) {}
  }

  // Counter keys:
  //   wordsHeard   — words/sounds modeled aloud to her (First Words, Fun Sounds, Find It prompts)
  //   aacTaps      — words she tapped on the Talk board
  //   aacSpeaks    — sentences she played back
  //   finditRight / finditTries
  //   traceDone, feedDone, popTaps, moveDone, dayDone
  function bump(key, n) {
    const all = loadAll();
    const t = todayKey();
    if (!all[t]) all[t] = {};
    all[t][key] = (all[t][key] || 0) + (n == null ? 1 : n);
    saveAll(all);
  }

  function lastNDays(n) {
    const all = loadAll();
    const out = [];
    const d = new Date();
    for (let i = 0; i < n; i++) {
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      out.unshift({ date: k, data: all[k] || {} });
      d.setDate(d.getDate() - 1);
    }
    return out;
  }

  // ---- stickers ----------------------------------------------------------
  const STICKER_POOL = ['🦋', '🌈', '⭐', '🐢', '🌻', '🐙', '🦄', '🐞', '🌟', '🐬', '🍓', '🦊', '🐧', '🌸', '🚀', '🐝', '🍀', '🦒', '🎀', '🐳', '🦜', '🧁', '🌺', '🐨'];
  function stickers() {
    try { return JSON.parse(localStorage.getItem(STICKER_KEY)) || []; } catch (e) { return []; }
  }
  function addSticker() {
    const have = stickers();
    // Prefer a sticker she doesn't have yet; repeat once the pool is collected.
    const missing = STICKER_POOL.filter(s => !have.includes(s));
    const pool = missing.length ? missing : STICKER_POOL;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    have.push(pick);
    try { localStorage.setItem(STICKER_KEY, JSON.stringify(have)); } catch (e) {}
    return pick;
  }

  // Award pacing: a sticker roughly every `every` increments of a counter.
  // Returns the sticker emoji when one is earned, else null.
  const meter = {};
  function progress(key, every) {
    meter[key] = (meter[key] || 0) + 1;
    if (meter[key] >= every) {
      meter[key] = 0;
      return addSticker();
    }
    return null;
  }

  return { bump, lastNDays, stickers, addSticker, progress };
})();
