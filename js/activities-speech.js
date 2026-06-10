/* Calliope — Talking & Learning activities:
 *   Pop!  ·  Fun Sounds  ·  First Words  ·  Find It  ·  Talk (AAC)  ·  My Day
 */
(function () {
  const el = App.el;
  const D = window.CALLIOPE_DATA;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const reduceMotion = () => Store.get('reduceMotion');
  const showText = () => Store.get('showText');
  const allWords = () => D.categories.reduce((acc, c) => acc.concat(c.words), []);

  // Render a word's visual: a family photo if it has one, else its emoji.
  function wordVisual(w, cls) {
    if (w.img) return el('img', { class: cls + ' is-photo', src: w.img, alt: w.label });
    return el('span', { class: cls }, w.emoji);
  }

  // ===== Pop! ============================================================
  App.register('pop', {
    title: 'Pop!', emoji: '🫧',
    render(c) {
      const area = el('div', { class: 'pop-area', aria: { label: 'Tap anywhere to pop' } },
        el('div', { class: 'pop-hint' }, 'Tap anywhere! 👆'));
      let live = 0;
      area.addEventListener('pointerdown', (e) => {
        const r = area.getBoundingClientRect();
        const hint = area.querySelector('.pop-hint');
        if (hint) hint.remove();
        if (live > 14) return;
        live++;
        const item = pick(D.pop);
        const span = el('span', { class: 'pop-item' + (reduceMotion() ? ' rm' : '') }, item.emoji);
        span.style.left = (e.clientX - r.left) + 'px';
        span.style.top = (e.clientY - r.top) + 'px';
        area.appendChild(span);
        Sound.pop();
        Sound.speak(item.say);
        Stats.bump('popTaps');
        Stats.bump('wordsHeard');
        const s = Stats.progress('pop', 25);
        if (s) App.celebrateSticker(s);
        setTimeout(() => { span.remove(); live--; }, reduceMotion() ? 700 : 1400);
      });
      c.appendChild(area);
    },
  });

  // ===== Fun Sounds ======================================================
  // Symbolic sounds & exclamations — the bridge to first words. Tap a card:
  // it says the sound, then after a beat shows "your turn!" (time delay) to
  // invite imitation without pressure.
  App.register('sounds', {
    title: 'Fun Sounds', emoji: '😮',
    render(c) {
      const grid = el('div', { class: 'sounds-grid' });
      let turnTimer = null;
      D.sounds.forEach(snd => {
        const turn = el('span', { class: 'sound-turn' }, 'your turn! 🎤');
        const card = el('button', { class: 'sound-card' }, [
          el('span', { class: 'sound-emoji' }, snd.emoji),
          el('span', { class: 'sound-label' }, snd.label),
          turn,
        ]);
        card.addEventListener('click', () => {
          if (turnTimer) clearTimeout(turnTimer);
          grid.querySelectorAll('.sound-turn.show').forEach(t => t.classList.remove('show'));
          Sound.speak(snd.say);
          Stats.bump('wordsHeard');
          if (!reduceMotion()) { card.classList.remove('tap'); void card.offsetWidth; card.classList.add('tap'); }
          // The pause-and-wait: surface a gentle "your turn" cue, then fade.
          turnTimer = setTimeout(() => {
            turn.classList.add('show');
            setTimeout(() => turn.classList.remove('show'), 3500);
          }, 1100);
          const s = Stats.progress('sounds', 18);
          if (s) App.celebrateSticker(s);
        });
        grid.appendChild(card);
      });
      c.appendChild(grid);
    },
  });

  // ===== First Words =====================================================
  App.register('words', {
    title: 'First Words', emoji: '🗣️',
    render(c) {
      // Categories = built-ins plus "My Words" when the family has added some.
      function cats() {
        const list = D.categories.slice();
        const mine = CustomWords.list();
        if (mine.length) list.push({ id: 'mine', label: 'My Words', emoji: '📷', words: mine });
        return list;
      }
      let ci = 0, wi = 0;
      const chips = el('div', { class: 'chips' });
      const stage = el('div', { class: 'word-stage' });
      const card = el('button', { class: 'word-card', onclick: () => speak() });
      const visual = el('div', { class: 'word-visual' });
      const label = el('div', { class: 'word-label' });
      card.appendChild(visual); card.appendChild(label);
      const prev = el('button', { class: 'nav-btn', aria: { label: 'Previous' }, onclick: () => step(-1) }, '◀');
      const next = el('button', { class: 'nav-btn', aria: { label: 'Next' }, onclick: () => step(1) }, '▶');
      stage.appendChild(prev); stage.appendChild(card); stage.appendChild(next);

      function curWord() { return cats()[ci].words[wi]; }
      function speak() {
        const w = curWord();
        Sound.speak(w.say || w.label);
        Stats.bump('wordsHeard');
        if (!reduceMotion()) { card.classList.remove('tap'); void card.offsetWidth; card.classList.add('tap'); }
        const s = Stats.progress('words', 20);
        if (s) App.celebrateSticker(s);
      }
      function show(speakIt) {
        const w = curWord();
        visual.innerHTML = '';
        visual.appendChild(wordVisual(w, 'word-emoji'));
        label.textContent = w.label;
        label.style.display = showText() ? '' : 'none';
        if (speakIt) speak();
      }
      function step(d) {
        const words = cats()[ci].words;
        wi = (wi + d + words.length) % words.length;
        show(true);
      }
      function drawChips() {
        chips.innerHTML = '';
        cats().forEach((cat, i) => {
          chips.appendChild(el('button', { class: 'chip' + (i === ci ? ' on' : ''), onclick: () => { ci = i; wi = 0; drawChips(); show(true); } },
            [el('span', { class: 'chip-emoji' }, cat.emoji), cat.label]));
        });
      }
      window.addEventListener('calliope:customwords', drawChips);
      c.appendChild(chips); c.appendChild(stage);
      drawChips();
      show(true);
    },
  });

  // ===== Find It =========================================================
  // Receptive language. Adaptive: 3 correct in a row → one more choice
  // (up to 4); two struggles → one fewer (down to 2). Mixes in family photos.
  App.register('findit', {
    title: 'Find It', emoji: '🔎',
    render(c) {
      const bar = el('div', { class: 'findit-bar' });
      const replay = el('button', { class: 'btn ghost big', onclick: () => ask() }, '🔊 Say it again');
      bar.appendChild(replay);
      const grid = el('div', { class: 'findit-grid' });
      c.appendChild(bar); c.appendChild(grid);

      let target = null, misses = 0, streak = 0, struggles = 0;
      let level = Math.max(2, Math.min(4, Store.get('findItChoices') | 0 || 2));

      function pool() { return allWords().concat(CustomWords.list()); }
      function ask() {
        if (!target) return;
        Sound.speak('Find the ' + target.label + '.');
        Stats.bump('wordsHeard');
      }
      function newRound() {
        misses = 0;
        const choices = shuffle(pool()).slice(0, level);
        target = pick(choices);
        grid.className = 'findit-grid n' + level;
        grid.innerHTML = '';
        choices.forEach(w => {
          const b = el('button', { class: 'find-card', 'data-id': w.id, onclick: () => choose(w, b) },
            wordVisual(w, 'find-emoji'));
          grid.appendChild(b);
        });
        setTimeout(ask, 350);
      }
      function adapt(correctFirstTry) {
        if (Store.get('findItAdaptive') === false) return;
        if (correctFirstTry) {
          streak++; struggles = 0;
          if (streak >= 3 && level < 4) { level++; streak = 0; }
        } else {
          streak = 0; struggles++;
          if (struggles >= 2 && level > 2) { level--; struggles = 0; }
        }
      }
      function choose(w, b) {
        Stats.bump('finditTries');
        if (w.id === target.id) {
          b.classList.add('correct');
          Sound.chime();
          Sound.speak('Yes! ' + target.label + '!');
          Stats.bump('finditRight');
          adapt(misses === 0);
          const s = Stats.progress('findit', 8);
          if (s) setTimeout(() => App.celebrateSticker(s), 1100);
          setTimeout(newRound, s ? 2400 : 1300);
        } else {
          b.classList.add('nudge');
          setTimeout(() => b.classList.remove('nudge'), 500);
          misses++;
          Sound.speak('Try again.');
          if (misses >= 2) { // errorless support: show her the answer
            const right = grid.querySelector('[data-id="' + target.id + '"]');
            if (right) right.classList.add('hint');
          }
        }
      }
      newRound();
    },
  });

  // ===== Talk (AAC core board) ===========================================
  App.register('talk', {
    title: 'Talk', emoji: '💬',
    render(c) {
      const sentence = [];
      const strip = el('div', { class: 'aac-strip' });
      const speakBtn = el('button', { class: 'aac-speak', aria: { label: 'Speak' }, onclick: speakAll }, '🔊');
      const back = el('button', { class: 'aac-back', aria: { label: 'Delete' }, onclick: () => { sentence.pop(); drawStrip(); } }, '⌫');
      const clear = el('button', { class: 'aac-clear', aria: { label: 'Clear' }, onclick: () => { sentence.length = 0; drawStrip(); } }, '🗑️');
      const stripWrap = el('div', { class: 'aac-stripwrap' }, [strip, back, clear, speakBtn]);

      // Quick phrase starters — "grow from one word to sentences".
      const PHRASES = [
        { label: 'I want…', ids: ['i', 'want'] },
        { label: 'More please', ids: ['more'] },
        { label: 'Help me', ids: ['help'] },
        { label: 'All done', ids: ['all-done'] },
      ];
      const phraseRow = el('div', { class: 'aac-phrases' }, PHRASES.map(p =>
        el('button', {
          class: 'aac-phrase', onclick: () => {
            sentence.length = 0;
            p.ids.forEach(id => { const w = D.aac.core.find(x => x.id === id); if (w) sentence.push(w); });
            drawStrip();
            Sound.speak(sentence.map(w => w.label).join(' '));
            Stats.bump('aacTaps', p.ids.length);
          },
        }, p.label)));

      function drawStrip() {
        strip.innerHTML = '';
        if (!sentence.length) { strip.appendChild(el('span', { class: 'aac-placeholder' }, 'Tap words to talk…')); return; }
        sentence.forEach(w => strip.appendChild(
          el('span', { class: 'aac-chip type-' + (w.type || 'noun') }, [el('span', { class: 'mini' }, w.emoji || '📷'), w.label])));
      }
      function speakAll() {
        if (!sentence.length) return;
        Sound.speak(sentence.map(w => w.label).join(' '));
        Stats.bump('aacSpeaks');
      }
      function tile(w) {
        const inner = w.img
          ? el('img', { class: 'aac-photo', src: w.img, alt: w.label })
          : el('span', { class: 'aac-emoji' }, w.emoji);
        return el('button', {
          class: 'aac-tile type-' + (w.type || 'noun'),
          onclick: () => { sentence.push(w); drawStrip(); Sound.speak(w.label); Stats.bump('aacTaps'); },
        }, [inner, el('span', { class: 'aac-word' }, w.label)]);
      }

      const board = el('div', { class: 'aac-board' });
      D.aac.core.forEach(w => board.appendChild(tile(w)));
      const fringe = el('div', { class: 'aac-board' });
      function drawFringe() {
        fringe.innerHTML = '';
        D.aac.fringe.forEach(w => fringe.appendChild(tile(w)));
        CustomWords.list().forEach(w => fringe.appendChild(tile(w)));
      }
      window.addEventListener('calliope:customwords', drawFringe);

      c.appendChild(phraseRow);
      c.appendChild(stripWrap);
      c.appendChild(board);
      c.appendChild(el('div', { class: 'aac-divider' }, 'more words'));
      c.appendChild(fringe);
      drawStrip();
      drawFringe();
    },
  });

  // ===== My Day (visual schedule) ========================================
  App.register('day', {
    title: 'My Day', emoji: '📅',
    render(c) {
      const ids = Store.get('schedule');
      const items = (ids && ids.length)
        ? ids.map(id => D.schedule.find(s => s.id === id)).filter(Boolean)
        : D.schedule.slice();
      const done = new Set();
      const list = el('div', { class: 'day-list' });
      const tools = el('div', { class: 'day-tools' }, [
        el('button', { class: 'btn ghost', onclick: () => { done.clear(); draw(); } }, '↺ Start over'),
      ]);

      function draw() {
        list.innerHTML = '';
        items.forEach(it => {
          const isDone = done.has(it.id);
          const row = el('div', { class: 'day-row' + (isDone ? ' done' : '') }, [
            el('button', { class: 'day-main', onclick: () => { Sound.speak(it.label); Stats.bump('wordsHeard'); } },
              [el('span', { class: 'day-emoji' }, it.emoji), el('span', { class: 'day-label' }, it.label)]),
            el('button', {
              class: 'day-check', aria: { label: 'Mark done' },
              onclick: () => {
                if (done.has(it.id)) done.delete(it.id); else { done.add(it.id); Sound.chime(); }
                draw();
                if (done.size === items.length) {
                  Sound.celebrate();
                  Stats.bump('dayDone');
                  setTimeout(() => Sound.speak('All done! Great day!'), 600);
                  const s = Stats.addSticker();
                  setTimeout(() => App.celebrateSticker(s), 1400);
                }
              },
            }, isDone ? '✅' : '⭕'),
          ]);
          list.appendChild(row);
        });
      }
      c.appendChild(tools);
      c.appendChild(list);
      draw();
    },
  });
})();
