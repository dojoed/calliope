/* Calliope — bootstrap */
(function () {
  const APP_VERSION = '1.2.1';
  window.CALLIOPE_VERSION = APP_VERSION;

  // On-page diagnostics: open with ?debug=1, tap "RUN SOUND TEST".
  function initDebug() {
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:45%;overflow:auto;background:rgba(0,0,0,.9);color:#8f8;font:12px/1.5 monospace;padding:10px;z-index:9999;white-space:pre-wrap;';
    const log = (m) => { panel.appendChild(document.createTextNode(m + '\n')); panel.scrollTop = 1e9; };
    const btn = document.createElement('button');
    btn.textContent = '▶ RUN SOUND TEST';
    btn.style.cssText = 'display:block;font:bold 14px monospace;padding:10px 14px;margin:0 0 8px;background:#8f8;color:#000;border-radius:6px;';
    panel.appendChild(btn);
    document.body.appendChild(panel);

    log('Calliope v' + APP_VERSION);
    log('UA: ' + navigator.userAgent);
    log('speechSynthesis: ' + (window.speechSynthesis ? 'available' : 'MISSING'));
    window.addEventListener('error', (e) => log('JS ERROR: ' + e.message + ' @ ' + String(e.filename).split('/').pop() + ':' + e.lineno));
    window.addEventListener('calliope:tts', (e) => log('tts ' + e.detail.phase + ' ' + JSON.stringify(e.detail)));

    function dumpVoices() {
      const v = window.speechSynthesis ? speechSynthesis.getVoices() : [];
      log('voices(' + v.length + '): ' + v.slice(0, 10).map(x => x.name).join(' | ') + (v.length > 10 ? ' …' : ''));
      const eng = Sound.englishVoices();
      log('auto-pick: ' + (eng[0] ? eng[0].name : '(none — browser default)'));
    }
    if (window.speechSynthesis && speechSynthesis.addEventListener) {
      speechSynthesis.addEventListener('voiceschanged', dumpVoices);
    }
    setTimeout(dumpVoices, 300);

    btn.addEventListener('click', () => {
      log('--- tone test (no speech engine involved) ---');
      Sound.warmup();
      Sound.pop();
      setTimeout(() => log('audio context: ' + Sound.ctxState() + '  (should be "running"; "suspended" = browser is blocking audio)'), 200);
      setTimeout(() => {
        log('--- speech test via app engine ---');
        Sound.speak('Hello! Can you hear me now?');
        setTimeout(() => log('state: speaking=' + speechSynthesis.speaking + ' pending=' + speechSynthesis.pending + ' paused=' + speechSynthesis.paused), 1500);
      }, 600);
    });
  }

  function boot() {
    if (new URLSearchParams(location.search).get('debug')) {
      try { initDebug(); } catch (e) {}
    }
    App.applySettings();
    // Optional deep link, e.g. ?go=talk — handy for testing or a custom shortcut.
    const go = new URLSearchParams(location.search).get('go');
    if (go) App.go(go); else App.home();

    // Warm up speech/audio on the very first touch (required by iOS Safari).
    const warm = () => { Sound.warmup(); window.removeEventListener('pointerdown', warm); };
    window.addEventListener('pointerdown', warm, { once: true });

    // React to theme/reduce-motion changes made in Settings.
    window.addEventListener('calliope:settings', () => App.applySettings());

    // iOS can leave the speech synthesizer paused after the app is backgrounded;
    // nudge it back to life whenever she returns to the app.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && window.speechSynthesis) {
        try { speechSynthesis.resume(); } catch (e) {}
      }
    });

    // Keep the OS auto theme live.
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener && mq.addEventListener('change', () => {
        if (Store.get('theme') === 'auto') App.applySettings();
      });
    }

    // Toddler-proofing: block long-press context menu and pinch/double-tap zoom.
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());
    let lastTouch = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouch < 300) e.preventDefault();
      lastTouch = now;
    }, { passive: false });

    // Register the offline service worker (ignored on file://).
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
