/* Calliope — app shell: router, home screen, parent gate, settings.
 *
 * Activities register themselves into App.activities (see activities-*.js).
 * The home screen is built from that registry, grouped into two calm sections.
 */
window.App = (function () {
  const root = () => document.getElementById('app');

  // ---- tiny DOM helper ---------------------------------------------------
  function el(tag, props, children) {
    const n = document.createElement(tag);
    if (props) {
      for (const k in props) {
        if (k === 'class') n.className = props[k];
        else if (k === 'style') n.setAttribute('style', props[k]);
        else if (k === 'html') n.innerHTML = props[k];
        else if (k === 'text') n.textContent = props[k];
        else if (k.startsWith('on') && typeof props[k] === 'function')
          n.addEventListener(k.slice(2).toLowerCase(), props[k]);
        else if (k === 'aria') for (const a in props[k]) n.setAttribute('aria-' + a, props[k][a]);
        else if (props[k] != null) n.setAttribute(k, props[k]);
      }
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  const activities = {}; // id -> { title, emoji, hint, render(container) }

  // Home layout: two gentle sections (speech/communication, then OT).
  const SECTIONS = [
    { title: 'Talking & Learning', emoji: '💬', ids: ['pop', 'sounds', 'words', 'findit', 'talk', 'day'] },
    { title: 'Moving & Making',    emoji: '🤸', ids: ['trace', 'color', 'move', 'feed'] },
  ];

  function applySettings() {
    const r = document.documentElement;
    const theme = Store.get('theme');
    r.setAttribute('data-theme', theme === 'auto' ? '' : theme);
    r.classList.toggle('reduce-motion', !!Store.get('reduceMotion'));
  }

  function stopSpeech() { try { speechSynthesis.cancel(); } catch (e) {} }

  // ---- header (shown on every activity) ---------------------------------
  function header(title) {
    return el('header', { class: 'topbar' }, [
      el('button', {
        class: 'home-btn', aria: { label: 'Home' },
        onclick: () => go('home'),
      }, '🏠'),
      el('h1', { class: 'topbar-title' }, title),
      el('div', { class: 'topbar-spacer' }),
    ]);
  }

  // ---- home --------------------------------------------------------------
  function home() {
    stopSpeech();
    const enabled = Store.get('enabled');
    const wrap = el('div', { class: 'home' });
    wrap.appendChild(el('div', { class: 'home-head' }, [
      el('div', { class: 'home-logo' }, '🌷'),
      el('h1', { class: 'home-title' }, 'Calliope'),
    ]));

    SECTIONS.forEach(sec => {
      const cards = sec.ids
        .filter(id => activities[id] && enabled[idKey(id)] !== false)
        .map(id => activityCard(id));
      if (!cards.length) return;
      wrap.appendChild(el('h2', { class: 'section-title' },
        [el('span', { class: 'section-emoji' }, sec.emoji), ' ' + sec.title]));
      wrap.appendChild(el('div', { class: 'grid' }, cards));
    });

    // Sticker book + parent gate live in a calm footer row.
    const stickers = Stats.stickers();
    wrap.appendChild(el('div', { class: 'home-footer' }, [
      el('button', { class: 'sticker-btn', onclick: () => { Sound.warmup(); stickerBook(); } }, [
        el('span', { class: 'sticker-btn-emoji' }, '🦋'),
        el('span', { class: 'sticker-btn-label' }, 'My Stickers' + (stickers.length ? ' · ' + stickers.length : '')),
      ]),
      parentGate(),
    ]));

    render(wrap);
    maybeWelcome(wrap);
  }

  // ---- sticker book -------------------------------------------------------
  function stickerBook() {
    const stickers = Stats.stickers();
    const wrap = el('div', { class: 'activity' }, [
      header('My Stickers'),
      el('div', { class: 'screen sticker-screen' },
        stickers.length
          ? el('div', { class: 'sticker-grid' }, stickers.map(s => el('span', { class: 'sticker' }, s)))
          : el('div', { class: 'sticker-empty' }, [
              el('div', { class: 'sticker-empty-emoji' }, '🦋'),
              el('p', {}, 'Play to earn stickers!'),
            ])),
    ]);
    render(wrap);
  }

  // Gentle celebration: a single sticker drifts in with a soft chime. No
  // confetti storms, no loud fanfare — autism-friendly by design.
  function celebrateSticker(emoji) {
    const overlay = el('div', { class: 'sticker-overlay' }, [
      el('div', { class: 'sticker-pop' }, [
        el('span', { class: 'sticker-pop-emoji' }, emoji),
        el('span', { class: 'sticker-pop-text' }, 'A sticker for you!'),
      ]),
    ]);
    document.body.appendChild(overlay);
    Sound.celebrate();
    setTimeout(() => Sound.speak('You earned a sticker!'), 350);
    const close = () => overlay.remove();
    overlay.addEventListener('pointerdown', close);
    setTimeout(close, 3200);
  }

  // ---- first-run welcome (for the parent) ---------------------------------
  function maybeWelcome() {
    if (Store.get('seenWelcome')) return;
    const overlay = el('div', { class: 'welcome-overlay' },
      el('div', { class: 'welcome-card' }, [
        el('div', { class: 'welcome-emoji' }, '🌷'),
        el('h2', {}, 'Welcome to Calliope'),
        el('p', {}, 'A calm space to grow first sounds, first words, and little hands — built on real speech-therapy and OT methods.'),
        el('p', {}, [
          'For you: hold the ', el('b', {}, '⚙️ gear'), ' on the home screen for ~2 seconds to open parent settings — including a short ',
          el('b', {}, 'coaching guide'), ' on how to use each activity together.',
        ]),
        el('p', { class: 'welcome-fine' }, 'Tip: sit beside her, follow her lead, and treat every sound and glance as talking. Calliope supports — it doesn\'t replace — her therapists.'),
        el('button', { class: 'btn primary big', onclick: () => { Store.set('seenWelcome', true); overlay.remove(); } }, 'Let\'s play 💙'),
      ]));
    document.body.appendChild(overlay);
  }

  // settings keys for enabled[] use slightly different ids in a couple cases
  function idKey(id) { return id; }

  function activityCard(id) {
    const a = activities[id];
    return el('button', {
      class: 'card', onclick: () => { Sound.warmup(); go(id); },
    }, [
      el('span', { class: 'card-emoji' }, a.emoji),
      el('span', { class: 'card-label' }, a.title),
    ]);
  }

  // ---- parent gate -------------------------------------------------------
  // A small gear that must be *held* for ~1.5s. Toddlers tap; they don't hold,
  // so this keeps settings away from little fingers without a clumsy passcode.
  function parentGate() {
    let timer = null, ring;
    const btn = el('button', { class: 'parent-gate', aria: { label: 'Parent settings (hold)' } }, [
      el('span', { class: 'gate-ring', html: '<svg viewBox="0 0 36 36"><circle class="bg" cx="18" cy="18" r="16"/><circle class="fg" cx="18" cy="18" r="16"/></svg>' }),
      el('span', { class: 'gate-gear' }, '⚙️'),
    ]);
    ring = btn.querySelector('.gate-ring');
    const start = (e) => {
      e.preventDefault();
      ring.classList.add('holding');
      timer = setTimeout(() => { ring.classList.remove('holding'); settings(); }, 1500);
    };
    const cancel = () => { if (timer) clearTimeout(timer); timer = null; ring.classList.remove('holding'); };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', cancel);
    btn.addEventListener('pointerleave', cancel);
    btn.addEventListener('pointercancel', cancel);
    return el('div', { class: 'parent-gate-wrap' }, [
      btn, el('span', { class: 'parent-gate-hint' }, 'hold for grown-ups'),
    ]);
  }

  // ---- router ------------------------------------------------------------
  function go(id) {
    stopSpeech();
    if (id === 'home') return home();
    if (id === 'settings') return settings();
    const a = activities[id];
    if (!a) return home();
    const container = el('div', { class: 'screen' });
    render(el('div', { class: 'activity activity-' + id }, [header(a.title), container]));
    a.render(container);
  }

  function render(node) {
    const r = root();
    r.innerHTML = '';
    r.appendChild(node);
    r.scrollTop = 0;
  }

  // ---- settings (parent area) -------------------------------------------
  function settings() {
    stopSpeech();
    const s = Store.all();
    const wrap = el('div', { class: 'settings' });
    wrap.appendChild(el('header', { class: 'topbar' }, [
      el('button', { class: 'home-btn', onclick: () => go('home') }, '🏠'),
      el('h1', { class: 'topbar-title' }, 'Parent Settings'),
      el('div', { class: 'topbar-spacer' }),
    ]));
    const body = el('div', { class: 'settings-body' });
    wrap.appendChild(body);

    function group(title, nodes) {
      body.appendChild(el('section', { class: 'set-group' },
        [el('h2', {}, title)].concat(nodes)));
    }

    function slider(label, key, min, max, step, fmt) {
      const out = el('span', { class: 'set-val' }, fmt(Store.get(key)));
      const input = el('input', {
        type: 'range', min, max, step, value: Store.get(key),
        oninput: (e) => { const v = parseFloat(e.target.value); Store.set(key, v); out.textContent = fmt(v); },
        onchange: () => Sound.speak('Hello!'),
      });
      return el('label', { class: 'set-row' }, [el('span', { class: 'set-label' }, label), input, out]);
    }

    function toggle(label, get, set, hint) {
      const input = el('input', { type: 'checkbox', onchange: (e) => set(e.target.checked) });
      if (get()) input.checked = true;
      return el('label', { class: 'set-row toggle' }, [
        el('span', { class: 'set-label' }, [label, hint ? el('small', {}, hint) : null]),
        el('span', { class: 'switch' }, input),
      ]);
    }

    function segmented(label, key, options) {
      const seg = el('div', { class: 'segmented' }, options.map(o =>
        el('button', {
          class: 'seg' + (Store.get(key) === o.value ? ' on' : ''),
          onclick: (e) => {
            Store.set(key, o.value); applySettings();
            seg.querySelectorAll('.seg').forEach(b => b.classList.remove('on'));
            e.currentTarget.classList.add('on');
          },
        }, o.label)));
      return el('label', { class: 'set-row' }, [el('span', { class: 'set-label' }, label), seg]);
    }

    function voicePicker() {
      const select = el('select', { class: 'voice-select' });
      function fill() {
        const voices = Sound.englishVoices();
        const cur = Sound.currentVoiceURI();
        select.innerHTML = '';
        if (!voices.length) { select.appendChild(el('option', {}, 'Default voice')); select.disabled = true; return; }
        select.disabled = false;
        voices.forEach(v => {
          const nice = /Enhanced|Premium|Neural|Natural|Siri/i.test(v.name) ? ' ⭐' : '';
          const opt = el('option', { value: v.voiceURI }, v.name + nice + '  ·  ' + v.lang);
          if (v.voiceURI === cur) opt.selected = true;
          select.appendChild(opt);
        });
      }
      select.addEventListener('change', () => { Sound.setVoice(select.value); Sound.speak('Hi! I am Calliope.'); });
      Sound.onVoices(fill);
      fill();
      return el('label', { class: 'set-row' }, [el('span', { class: 'set-label' }, 'Voice'), select]);
    }

    group('Sound & Voice', [
      slider('Volume', 'volume', 0, 1, 0.05, v => Math.round(v * 100) + '%'),
      slider('Voice speed', 'speechRate', 0.5, 1.1, 0.05, v => v.toFixed(2) + '×'),
      voicePicker(),
      el('button', { class: 'btn ghost', onclick: () => Sound.speak('Hi! I am Calliope.') }, '🔊 Test the voice'),
      el('p', { class: 'set-note' }, '⭐ = highest quality. On iPad you can add much nicer voices: Settings → Accessibility → Spoken Content → Voices → English → tap one to download (look for “Enhanced” or “Premium”). They then appear here.'),
    ]);

    group('Comfort', [
      toggle('Reduce motion', () => Store.get('reduceMotion'),
        v => { Store.set('reduceMotion', v); applySettings(); }, 'Calmer — fewer animations'),
      toggle('Show printed words', () => Store.get('showText'),
        v => Store.set('showText', v), 'Word under each picture'),
      segmented('Theme', 'theme', [
        { value: 'auto', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' },
      ]),
    ]);

    group('Find It game', [
      segmented('Starting choices', 'findItChoices',
        [{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }].map(o => ({ value: o.value, label: o.label }))),
      toggle('Adapt automatically', () => Store.get('findItAdaptive') !== false,
        v => Store.set('findItAdaptive', v), '3 in a row right → one more picture; struggling → one fewer'),
    ]);

    // ---- This week (progress dashboard) ----
    group('This week', [progressDashboard()]);

    // ---- My Words (family photos) ----
    group('My Words — her own photos', [customWordsManager()]);

    // ---- My Day routine editor ----
    group('My Day routine', [scheduleEditor()]);

    const en = Object.assign({}, Store.get('enabled'));
    const actToggles = [];
    SECTIONS.forEach(sec => {
      sec.ids.filter(id => activities[id]).forEach(id => {
        actToggles.push(toggle(activities[id].emoji + '  ' + activities[id].title,
          () => en[id] !== false, v => { en[id] = v; Store.set('enabled', en); }));
      });
    });
    group('Show / hide activities', actToggles);

    group('How to use Calliope with your child', [coachingGuide()]);

    group('', [
      el('button', {
        class: 'btn danger', onclick: () => {
          if (confirm('Reset all settings to defaults?')) { Store.reset(); applySettings(); settings(); }
        },
      }, 'Reset to defaults'),
      el('p', { class: 'set-note', style: 'text-align:center' }, 'Calliope v' + (window.CALLIOPE_VERSION || '?')),
    ]);

    render(wrap);
  }

  // ---- progress dashboard (last 7 days) -----------------------------------
  function progressDashboard() {
    const days = Stats.lastNDays(7);
    const sum = (k) => days.reduce((a, d) => a + (d.data[k] || 0), 0);
    const finditTries = sum('finditTries'), finditRight = sum('finditRight');
    const rows = [
      ['🔊 Words modeled to her', sum('wordsHeard')],
      ['💬 Words she tapped (Talk board)', sum('aacTaps')],
      ['🗣️ Sentences she played', sum('aacSpeaks')],
      ['🔎 Find It — correct', finditRight + (finditTries ? '  (' + Math.round(100 * finditRight / finditTries) + '%)' : '')],
      ['✏️ Shapes traced', sum('traceDone')],
      ['🍎 Feeding rounds finished', sum('feedDone')],
      ['📅 Full routines completed', sum('dayDone')],
    ];
    const wrap = el('div', { class: 'dash' });
    // Mini 7-day activity strip: one dot per day, filled if she played.
    wrap.appendChild(el('div', { class: 'dash-days' }, days.map(d => {
      const active = Object.keys(d.data).length > 0;
      return el('span', { class: 'dash-day' + (active ? ' on' : ''), title: d.date },
        d.date.slice(8)); // day-of-month
    })));
    rows.forEach(([label, val]) => wrap.appendChild(
      el('div', { class: 'dash-row' }, [
        el('span', { class: 'dash-label' }, label),
        el('span', { class: 'dash-val' }, String(val)),
      ])));
    wrap.appendChild(el('p', { class: 'set-note' }, 'Counts stay on this device. A nice thing to mention to her SLP/OT: how often you played and what she gravitated to.'));
    return wrap;
  }

  // ---- custom words manager ------------------------------------------------
  function customWordsManager() {
    const wrap = el('div', { class: 'cw' });
    const list = el('div', { class: 'cw-list' });
    const nameInput = el('input', { class: 'cw-input', type: 'text', placeholder: 'Word (e.g. “Nana”, “Rex”, “binky”)', maxlength: 24 });
    const fileInput = el('input', { class: 'cw-file', type: 'file', accept: 'image/*' });
    const status = el('p', { class: 'set-note' }, 'Real photos — Mama, the dog, her own cup — are the most powerful symbols for her. They appear in First Words, Find It, and the Talk board.');
    const addBtn = el('button', {
      class: 'btn primary', onclick: async () => {
        const label = nameInput.value.trim();
        const file = fileInput.files && fileInput.files[0];
        if (!label) { status.textContent = 'Give the word a name first.'; return; }
        if (!file) { status.textContent = 'Choose a photo for “' + label + '”.'; return; }
        addBtn.disabled = true; status.textContent = 'Adding…';
        try {
          await CustomWords.add(label, file);
          nameInput.value = ''; fileInput.value = '';
          status.textContent = '“' + label + '” added ✓';
          draw();
        } catch (e) {
          status.textContent = 'Sorry — that photo could not be saved.';
        }
        addBtn.disabled = false;
      },
    }, '➕ Add word');

    function draw() {
      list.innerHTML = '';
      const words = CustomWords.list();
      if (!words.length) return;
      words.forEach(w => list.appendChild(el('div', { class: 'cw-row' }, [
        el('img', { class: 'cw-thumb', src: w.img, alt: w.label }),
        el('span', { class: 'cw-label' }, w.label),
        el('button', { class: 'btn ghost', onclick: () => Sound.speak(w.say || w.label) }, '🔊'),
        el('button', {
          class: 'btn danger small', onclick: () => {
            if (confirm('Remove “' + w.label + '”?')) CustomWords.remove(w.id).then(draw);
          },
        }, '✕'),
      ])));
    }
    CustomWords.ready.then(draw);
    wrap.appendChild(list);
    wrap.appendChild(el('div', { class: 'cw-form' }, [nameInput, fileInput, addBtn]));
    wrap.appendChild(status);
    return wrap;
  }

  // ---- My Day routine editor -------------------------------------------------
  function scheduleEditor() {
    const all = window.CALLIOPE_DATA.schedule;
    let ids = Store.get('schedule');
    if (!ids || !ids.length) ids = all.map(s => s.id);
    const wrap = el('div', { class: 'sched' });
    const list = el('div', { class: 'sched-list' });
    const addRow = el('div', { class: 'sched-add' });

    function save() { Store.set('schedule', ids.slice()); }
    function draw() {
      list.innerHTML = '';
      ids.forEach((id, i) => {
        const it = all.find(s => s.id === id);
        if (!it) return;
        list.appendChild(el('div', { class: 'sched-row' }, [
          el('span', { class: 'sched-emoji' }, it.emoji),
          el('span', { class: 'sched-label' }, it.label),
          el('button', { class: 'btn ghost small', disabled: i === 0 ? 'disabled' : null, onclick: () => { [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]; save(); draw(); } }, '▲'),
          el('button', { class: 'btn ghost small', disabled: i === ids.length - 1 ? 'disabled' : null, onclick: () => { [ids[i + 1], ids[i]] = [ids[i], ids[i + 1]]; save(); draw(); } }, '▼'),
          el('button', { class: 'btn danger small', onclick: () => { ids.splice(i, 1); save(); draw(); } }, '✕'),
        ]));
      });
      addRow.innerHTML = '';
      const unused = all.filter(s => !ids.includes(s.id));
      unused.forEach(s => addRow.appendChild(
        el('button', { class: 'chip', onclick: () => { ids.push(s.id); save(); draw(); } }, s.emoji + ' ' + s.label)));
    }
    draw();
    wrap.appendChild(list);
    wrap.appendChild(el('p', { class: 'set-note' }, 'Tap below to add a step back in:'));
    wrap.appendChild(addRow);
    return wrap;
  }

  function coachingGuide() {
    const tips = [
      ['🫧 Pop!', 'Pure cause-and-effect — it teaches "I made that happen," the root of intentional communication. Sit beside her, point, and share the delight: "You did it! Pop!" Sharing the moment (joint attention) matters more than the popping.'],
      ['😮 Fun Sounds', 'The single best on-ramp to first words. Sounds like "uh-oh," "wow," and "moo" are easier to say than real words and full of feeling — children imitate these first. Say it together with big expression, then pause and wait. If she makes ANY sound back, celebrate it.'],
      ['🗣️ First Words', 'Model, don\'t quiz. Say the word warmly and naturally; don\'t pressure her to repeat. Hearing a clear word many times is how it gets learned. Follow her interest — linger on the cards she loves.'],
      ['🔎 Find It', 'Comprehension comes before talking. If she gets stuck, just touch the right one together — there\'s no failing here. Keep it to 2 pictures until it\'s easy.'],
      ['💬 Talk', 'This is her voice. Tap words yourself throughout the day to model ("more… bubbles!") without expecting her to. Then offer something and pause — wait several seconds (the "time delay"). A reach, glance, or tap all count as communication. Research is clear: this will NOT delay her speech; it tends to grow it.'],
      ['📅 My Day', 'Predictability lowers anxiety. Walk through it before transitions: "First lunch, then nap." Let her tap each step as it happens.'],
      ['✏️ Trace', 'Pre-writing follows a sequence: scribbles, then up-down lines, then circles. Let her use a whole-fist motion — that\'s perfect for now. Praise the effort, not the accuracy.'],
      ['🎨 Color', 'Open-ended and calming. Great for grip and finger control. There is no "right" picture.'],
      ['🤸 Move', 'Copy the movements together — imitation is itself a building block of speech, and big movements ("heavy work," jumping, stomping) help her feel calm and regulated.'],
      ['🍎 Feed', 'Dragging builds hand-eye coordination and motor planning. Name the food as it goes in: "apple… yum!"'],
      ['⏱️ General', 'Little and often beats long sessions — a few minutes, several times a day, beside her. Treat every gesture, sound, and glance as talking, and talk back. You are the most important part of this app.'],
    ];
    return el('div', { class: 'coaching' }, tips.map(([h, t]) =>
      el('details', { class: 'coach' }, [
        el('summary', {}, h),
        el('p', {}, t),
      ])));
  }

  // ---- public ------------------------------------------------------------
  return {
    el, header, go, home, applySettings, celebrateSticker,
    register(id, def) { activities[id] = def; },
    activities,
  };
})();
