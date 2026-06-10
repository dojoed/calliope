/* Calliope — bootstrap */
(function () {
  function boot() {
    App.applySettings();
    // Optional deep link, e.g. ?go=talk — handy for testing or a custom shortcut.
    const go = new URLSearchParams(location.search).get('go');
    if (go) App.go(go); else App.home();

    // Warm up speech/audio on the very first touch (required by iOS Safari).
    const warm = () => { Sound.warmup(); window.removeEventListener('pointerdown', warm); };
    window.addEventListener('pointerdown', warm, { once: true });

    // React to theme/reduce-motion changes made in Settings.
    window.addEventListener('calliope:settings', () => App.applySettings());

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
