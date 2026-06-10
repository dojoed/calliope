/* Calliope — custom words with the family's own photos.
 *
 * Real photos (Mama, the dog, her actual cup) are far more motivating and
 * recognizable for a young autistic child than generic symbols. Photos are
 * resized and stored locally in IndexedDB; nothing leaves the device.
 */
window.CustomWords = (function () {
  const DB = 'calliope', STORE = 'words';
  let db = null;
  let cache = [];
  let readyResolve;
  const ready = new Promise(res => { readyResolve = res; });

  function open() {
    return new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('no idb'));
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => {
        if (!r.result.objectStoreNames.contains(STORE)) {
          r.result.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }

  function getAll() {
    return new Promise((res) => {
      try {
        const req = db.transaction(STORE).objectStore(STORE).getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => res([]);
      } catch (e) { res([]); }
    });
  }

  function notify() {
    window.dispatchEvent(new CustomEvent('calliope:customwords'));
  }

  (async function init() {
    try {
      db = await open();
      cache = await getAll();
      cache.sort((a, b) => (a.created || 0) - (b.created || 0));
    } catch (e) { cache = []; }
    readyResolve();
    notify();
  })();

  // Downscale a photo so storage stays small and rendering stays fast.
  function fileToDataURL(file, maxSide) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, (maxSide || 640) / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
          const cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          cv.getContext('2d').drawImage(img, 0, 0, w, h);
          res(cv.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = rej;
        img.src = fr.result;
      };
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }

  function put(word) {
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(word);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  }

  return {
    ready,
    list() { return cache.slice(); },

    async add(label, file, sayText) {
      await ready;
      if (!db) throw new Error('Storage unavailable');
      const img = await fileToDataURL(file, 640);
      const word = {
        id: 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        label: label.trim(),
        say: (sayText || '').trim() || null,
        img,
        created: Date.now(),
      };
      await put(word);
      cache.push(word);
      notify();
      return word;
    },

    async remove(id) {
      await ready;
      if (!db) return;
      await new Promise((res) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = res; tx.onerror = res;
      });
      cache = cache.filter(w => w.id !== id);
      notify();
    },
  };
})();
