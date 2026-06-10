/* Calliope — Moving & Making (occupational-therapy) activities:
 *   Trace  ·  Color  ·  Move  ·  Feed
 *
 * Fine-motor / pre-writing follows the typical developmental order
 * (scribble → vertical → horizontal → circle → shapes). Movement uses
 * imitation + "heavy work" / proprioceptive input, which supports both
 * regulation and (via imitation) early speech.
 */
(function () {
  const el = App.el;
  const reduceMotion = () => Store.get('reduceMotion');

  // Make a crisp, full-size canvas inside a stage element.
  function makeCanvas(stage, onReady) {
    const canvas = el('canvas', { class: 'pad' });
    stage.appendChild(canvas);
    function size() {
      const r = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      onReady(ctx, r.width, r.height, canvas);
    }
    requestAnimationFrame(size);
    return canvas;
  }

  // ===== Trace ===========================================================
  App.register('trace', {
    title: 'Trace', emoji: '✏️',
    render(c) {
      // Shapes defined as functions returning normalized points in [0,1].
      const line = (x1, y1, x2, y2, n = 40) => Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1); return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
      });
      const circle = (n = 64) => Array.from({ length: n }, (_, i) => {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
        return [0.5 + 0.34 * Math.cos(a), 0.5 + 0.34 * Math.sin(a)];
      }).concat([[0.5, 0.16]]);
      const poly = (pts, n = 24) => {
        const out = [];
        for (let s = 0; s < pts.length - 1; s++) {
          const [ax, ay] = pts[s], [bx, by] = pts[s + 1];
          for (let i = 0; i < n; i++) { const t = i / n; out.push([ax + (bx - ax) * t, ay + (by - ay) * t]); }
        }
        out.push(pts[pts.length - 1]);
        return out;
      };
      const LEVELS = [
        { id: 'scribble', label: 'Scribble', emoji: '🌀', free: true },
        { id: 'vline', label: 'Down', emoji: '↕️', pts: line(0.5, 0.12, 0.5, 0.88) },
        { id: 'hline', label: 'Across', emoji: '↔️', pts: line(0.12, 0.5, 0.88, 0.5) },
        { id: 'circle', label: 'Circle', emoji: '⭕', pts: circle() },
        { id: 'square', label: 'Square', emoji: '⬜', pts: poly([[0.2, 0.2], [0.8, 0.2], [0.8, 0.8], [0.2, 0.8], [0.2, 0.2]]) },
        { id: 'tri', label: 'Triangle', emoji: '🔺', pts: poly([[0.5, 0.15], [0.85, 0.82], [0.15, 0.82], [0.5, 0.15]]) },
      ];
      let level = LEVELS[1];

      const chips = el('div', { class: 'chips' });
      LEVELS.forEach((lv, i) => chips.appendChild(el('button', { class: 'chip', onclick: () => select(i) },
        [el('span', { class: 'chip-emoji' }, lv.emoji), lv.label])));
      const stage = el('div', { class: 'canvas-stage' });
      const tools = el('div', { class: 'pad-tools' }, [
        el('button', { class: 'btn ghost', onclick: () => start() }, '↺ Again'),
      ]);
      c.appendChild(chips); c.appendChild(stage); c.appendChild(tools);

      let ctx, W, H, guide = [], hits, drawing = false, last = null, freeLen = 0, done = false;

      function select(i) {
        level = LEVELS[i];
        chips.querySelectorAll('.chip').forEach((b, k) => b.classList.toggle('on', k === i));
        start();
      }
      function toPx(p) { const m = Math.min(W, H); const ox = (W - m) / 2, oy = (H - m) / 2; return [ox + p[0] * m, oy + p[1] * m]; }
      function drawGuide() {
        ctx.clearRect(0, 0, W, H);
        if (level.free) {
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.font = Math.round(Math.min(W, H) * 0.10) + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('draw anything! 🖍️', W / 2, H / 2);
          return;
        }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.setLineDash([2, Math.round(Math.min(W, H) * 0.045)]);
        ctx.strokeStyle = 'rgba(120,120,140,0.45)';
        ctx.lineWidth = Math.min(W, H) * 0.05;
        ctx.beginPath();
        guide.forEach((g, i) => { const [x, y] = toPx(g.p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
        ctx.setLineDash([]);
        // start dot (green) + end dot
        const s = toPx(guide[0].p), e = toPx(guide[guide.length - 1].p);
        ctx.fillStyle = '#5bbf8a'; ctx.beginPath(); ctx.arc(s[0], s[1], Math.min(W, H) * 0.05, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = Math.round(Math.min(W, H) * 0.06) + 'px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('▶', s[0], s[1]);
        ctx.fillStyle = 'rgba(232,165,152,0.85)'; ctx.beginPath(); ctx.arc(e[0], e[1], Math.min(W, H) * 0.035, 0, 7); ctx.fill();
      }
      function start() {
        done = false; freeLen = 0; last = null;
        hits = 0;
        guide = level.free ? [] : level.pts.map(p => ({ p, hit: false }));
        if (ctx) drawGuide();
        Sound.speak(level.free ? 'Draw something!' : 'Trace the ' + level.label.toLowerCase() + '.');
      }
      function markNear(x, y) {
        const thresh = Math.min(W, H) * 0.09;
        guide.forEach(g => {
          if (g.hit) return;
          const [gx, gy] = toPx(g.p);
          if (Math.hypot(gx - x, gy - y) < thresh) { g.hit = true; hits++; }
        });
        if (!done && guide.length && hits / guide.length >= 0.8) succeed();
      }
      function succeed() {
        done = true;
        Sound.celebrate();
        setTimeout(() => Sound.speak('You did it!'), 500);
        ctx.fillStyle = 'rgba(91,191,138,0.18)'; ctx.fillRect(0, 0, W, H);
        Stats.bump('traceDone');
        const s = Stats.progress('trace', 4);
        if (s) setTimeout(() => App.celebrateSticker(s), 1200);
      }
      function ink(x, y) {
        ctx.strokeStyle = '#3aa3e0'; ctx.lineWidth = Math.min(W, H) * 0.045;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        if (last) ctx.moveTo(last[0], last[1]); else ctx.moveTo(x, y);
        ctx.lineTo(x, y); ctx.stroke();
        if (last) freeLen += Math.hypot(x - last[0], y - last[1]);
        last = [x, y];
      }
      function pos(e, canvas) { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

      makeCanvas(stage, (context, w, h, canvas) => {
        ctx = context; W = w; H = h;
        start();
        const down = (e) => { e.preventDefault(); drawing = true; last = null; const [x, y] = pos(e, canvas); ink(x, y); if (level.free) {} else markNear(x, y); };
        const move = (e) => {
          if (!drawing) return; e.preventDefault();
          const [x, y] = pos(e, canvas); ink(x, y);
          if (level.free) { if (!done && freeLen > Math.min(W, H) * 2.2) succeed(); }
          else markNear(x, y);
        };
        const up = () => { drawing = false; last = null; };
        canvas.addEventListener('pointerdown', down);
        canvas.addEventListener('pointermove', move);
        canvas.addEventListener('pointerup', up);
        canvas.addEventListener('pointerleave', up);
      });
      select(1);
    },
  });

  // ===== Color (finger paint) ============================================
  App.register('color', {
    title: 'Color', emoji: '🎨',
    render(c) {
      const COLORS = ['#e8736c', '#f0a04b', '#f4d35e', '#6ab04c', '#3aa3e0', '#7c6fd0', '#e57bb0', '#7a5c3e', '#3a3a3a'];
      const TEMPLATES = {
        none: null,
        heart: (ctx, W, H) => { const m = Math.min(W, H) * 0.32, cx = W / 2, cy = H / 2; ctx.beginPath(); ctx.moveTo(cx, cy + m * 0.9); ctx.bezierCurveTo(cx - m * 1.6, cy - m * 0.4, cx - m * 0.6, cy - m * 1.3, cx, cy - m * 0.4); ctx.bezierCurveTo(cx + m * 0.6, cy - m * 1.3, cx + m * 1.6, cy - m * 0.4, cx, cy + m * 0.9); ctx.stroke(); },
        star: (ctx, W, H) => { const m = Math.min(W, H) * 0.36, cx = W / 2, cy = H / 2; ctx.beginPath(); for (let i = 0; i < 11; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? m * 0.45 : m; const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.stroke(); },
        flower: (ctx, W, H) => { const m = Math.min(W, H) * 0.16, cx = W / 2, cy = H / 2; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * m * 1.4, cy + Math.sin(a) * m * 1.4, m, 0, 7); ctx.stroke(); } ctx.beginPath(); ctx.arc(cx, cy, m, 0, 7); ctx.stroke(); },
      };
      let color = COLORS[4], template = 'none';

      const palette = el('div', { class: 'palette' }, COLORS.map(col =>
        el('button', { class: 'swatch', style: 'background:' + col, onclick: (e) => { color = col; palette.querySelectorAll('.swatch').forEach(s => s.classList.remove('on')); e.currentTarget.classList.add('on'); } })));
      const stage = el('div', { class: 'canvas-stage' });
      const TMPL_LABELS = { none: '⬜ Blank', heart: '❤️ Heart', star: '⭐ Star', flower: '🌸 Flower' };
      const tmplRow = el('div', { class: 'chips' });
      Object.keys(TEMPLATES).forEach(t => {
        const b = el('button', { class: 'chip' + (t === 'none' ? ' on' : '') }, TMPL_LABELS[t]);
        b.addEventListener('click', () => {
          template = t; redraw();
          tmplRow.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
        });
        tmplRow.appendChild(b);
      });
      const tools = el('div', { class: 'pad-tools' }, [
        el('button', { class: 'btn ghost', onclick: () => redraw() }, '🧽 Clear'),
      ]);
      c.appendChild(palette); c.appendChild(tmplRow); c.appendChild(stage); c.appendChild(tools);

      let ctx, W, H, drawing = false, last = null;
      function redraw() {
        ctx.clearRect(0, 0, W, H);
        const t = TEMPLATES[template];
        if (t) { ctx.lineWidth = Math.min(W, H) * 0.012; ctx.strokeStyle = 'rgba(120,120,140,0.5)'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; t(ctx, W, H); }
      }
      function pos(e, canvas) { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      function paint(x, y) {
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.min(W, H) * 0.06; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); if (last) { ctx.moveTo(last[0], last[1]); ctx.lineTo(x, y); ctx.stroke(); } else { ctx.arc(x, y, ctx.lineWidth / 2, 0, 7); ctx.fill(); }
        last = [x, y];
      }
      makeCanvas(stage, (context, w, h, canvas) => {
        ctx = context; W = w; H = h; redraw();
        palette.firstChild && palette.querySelectorAll('.swatch')[4].classList.add('on');
        const down = (e) => { e.preventDefault(); drawing = true; last = null; const [x, y] = pos(e, canvas); paint(x, y); Sound.pop(); };
        const move = (e) => { if (!drawing) return; e.preventDefault(); const [x, y] = pos(e, canvas); paint(x, y); };
        const up = () => { drawing = false; last = null; };
        canvas.addEventListener('pointerdown', down);
        canvas.addEventListener('pointermove', move);
        canvas.addEventListener('pointerup', up);
        canvas.addEventListener('pointerleave', up);
      });
    },
  });

  // ===== Move (copy-me movement breaks) ==================================
  App.register('move', {
    title: 'Move', emoji: '🤸',
    render(c) {
      const MOVES = [
        { emoji: '🙆', label: 'Reach up high!', say: 'Reach up high!' },
        { emoji: '👏', label: 'Clap your hands!', say: 'Clap your hands!' },
        { emoji: '👣', label: 'Stomp your feet!', say: 'Stomp, stomp, stomp!' },
        { emoji: '🦘', label: 'Jump up and down!', say: 'Jump! Jump! Jump!' },
        { emoji: '🔄', label: 'Turn around!', say: 'Turn around!' },
        { emoji: '🤸', label: 'Touch your toes!', say: 'Touch your toes!' },
        { emoji: '🤗', label: 'Big squeeze hug!', say: 'Give yourself a big squeeze hug!' },
        { emoji: '🧱', label: 'Push the wall!', say: 'Push the wall, so strong!' },
        { emoji: '🚶', label: 'March, march!', say: 'March, march, march!' },
        { emoji: '👋', label: 'Wave hello!', say: 'Wave hello!' },
      ];
      let i = 0;
      const card = el('button', { class: 'move-card', onclick: () => say() });
      const emoji = el('div', { class: 'move-emoji' });
      const label = el('div', { class: 'move-label' });
      card.appendChild(emoji); card.appendChild(label);
      const next = el('button', { class: 'btn primary big', onclick: () => step() }, 'Next ▶');
      c.appendChild(el('div', { class: 'move-stage' }, [card]));
      c.appendChild(el('div', { class: 'pad-tools' }, [next]));
      function say() { const m = MOVES[i]; Sound.speak(m.say); Stats.bump('moveDone'); if (!reduceMotion()) { emoji.classList.remove('bounce'); void emoji.offsetWidth; emoji.classList.add('bounce'); } }
      function show() { const m = MOVES[i]; emoji.textContent = m.emoji; label.textContent = m.label; say(); }
      function step() { i = (i + 1) % MOVES.length; show(); }
      show();
    },
  });

  // ===== Feed (drag & drop, hand-eye coordination) =======================
  App.register('feed', {
    title: 'Feed', emoji: '🍎',
    render(c) {
      const ANIMALS = ['🐶', '🐱', '🐵', '🦖', '🐰', '🐸'];
      const FOODS = [
        { e: '🍎', n: 'apple' }, { e: '🍌', n: 'banana' }, { e: '🍪', n: 'cookie' },
        { e: '🥕', n: 'carrot' }, { e: '🍓', n: 'strawberry' }, { e: '🧀', n: 'cheese' },
        { e: '🍇', n: 'grapes' }, { e: '🥦', n: 'broccoli' },
      ];
      let animal = ANIMALS[0];
      const mouth = el('div', { class: 'feed-animal' }, animal);
      const top = el('div', { class: 'feed-top' }, [
        el('button', { class: 'btn ghost', onclick: () => { animal = ANIMALS[(ANIMALS.indexOf(animal) + 1) % ANIMALS.length]; mouth.textContent = animal; } }, '🔁 New friend'),
        mouth,
      ]);
      const tray = el('div', { class: 'feed-tray' });
      c.appendChild(top); c.appendChild(tray);

      function fill() {
        tray.innerHTML = '';
        const set = FOODS.slice().sort(() => 0.5 - ((Date.now() % 7) / 7)).slice(0, 6);
        set.forEach(f => tray.appendChild(makeFood(f)));
      }
      function makeFood(f) {
        const node = el('button', { class: 'feed-food' }, f.e);
        let ghost = null, dragging = false;
        node.addEventListener('pointerdown', (e) => {
          e.preventDefault(); dragging = true;
          node.setPointerCapture && node.setPointerCapture(e.pointerId);
          ghost = el('div', { class: 'feed-ghost' }, f.e);
          document.body.appendChild(ghost);
          moveGhost(e);
          node.style.opacity = '0.25';
        });
        node.addEventListener('pointermove', (e) => { if (dragging) moveGhost(e); });
        node.addEventListener('pointerup', (e) => {
          if (!dragging) return; dragging = false;
          node.style.opacity = '';
          if (ghost) { ghost.remove(); ghost = null; }
          const m = mouth.getBoundingClientRect();
          if (e.clientX > m.left && e.clientX < m.right && e.clientY > m.top && e.clientY < m.bottom) {
            Sound.chime(); Sound.speak(f.n + '! Yum!');
            if (!reduceMotion()) { mouth.classList.remove('chomp'); void mouth.offsetWidth; mouth.classList.add('chomp'); }
            node.remove();
            Stats.bump('wordsHeard');
            if (!tray.querySelector('.feed-food')) {
              Sound.celebrate();
              Stats.bump('feedDone');
              const s = Stats.progress('feed', 2);
              if (s) setTimeout(() => App.celebrateSticker(s), 900);
              setTimeout(fill, s ? 2200 : 700);
            }
          }
        });
        function moveGhost(e) { if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; } }
        return node;
      }
      fill();
    },
  });
})();
