/* Calliope — content data
 *
 * All vocabulary lives here so it's easy to edit. Each word uses a big emoji as
 * a clear, friendly symbol. `say` is what the voice speaks (defaults to label).
 *
 * Word choices are drawn from common toddler "first words" lists
 * (e.g. the MacArthur-Bates Communicative Development Inventories): the words
 * children typically understand and use earliest — people, food, animals, and
 * highly motivating objects.
 */
window.CALLIOPE_DATA = {

  // ---- First Words, grouped into small categories -----------------------
  categories: [
    {
      id: 'people', label: 'People', emoji: '👪',
      words: [
        { id: 'mama',    label: 'Mama',    emoji: '👩' },
        { id: 'dada',    label: 'Dada',    emoji: '👨' },
        { id: 'baby',    label: 'Baby',    emoji: '👶' },
        { id: 'grandma', label: 'Grandma', emoji: '👵' },
        { id: 'grandpa', label: 'Grandpa', emoji: '👴' },
        { id: 'me',      label: 'Me',      emoji: '🧒' },
      ],
    },
    {
      id: 'food', label: 'Food & Drink', emoji: '🍎',
      words: [
        { id: 'milk',   label: 'Milk',   emoji: '🥛' },
        { id: 'water',  label: 'Water',  emoji: '💧' },
        { id: 'juice',  label: 'Juice',  emoji: '🧃' },
        { id: 'banana', label: 'Banana', emoji: '🍌' },
        { id: 'apple',  label: 'Apple',  emoji: '🍎' },
        { id: 'cookie', label: 'Cookie', emoji: '🍪' },
        { id: 'cheese', label: 'Cheese', emoji: '🧀' },
        { id: 'snack',  label: 'Snack',  emoji: '🥨' },
      ],
    },
    {
      id: 'animals', label: 'Animals', emoji: '🐶',
      words: [
        { id: 'dog',  label: 'Dog',  emoji: '🐶', say: 'Dog. Woof woof.' },
        { id: 'cat',  label: 'Cat',  emoji: '🐱', say: 'Cat. Meow.' },
        { id: 'cow',  label: 'Cow',  emoji: '🐄', say: 'Cow. Moo.' },
        { id: 'duck', label: 'Duck', emoji: '🦆', say: 'Duck. Quack quack.' },
        { id: 'fish', label: 'Fish', emoji: '🐟' },
        { id: 'bird', label: 'Bird', emoji: '🐦', say: 'Bird. Tweet tweet.' },
        { id: 'pig',  label: 'Pig',  emoji: '🐷', say: 'Pig. Oink.' },
        { id: 'bear', label: 'Bear', emoji: '🐻' },
      ],
    },
    {
      id: 'toys', label: 'Toys & Things', emoji: '⚽',
      words: [
        { id: 'ball',    label: 'Ball',    emoji: '⚽' },
        { id: 'car',     label: 'Car',     emoji: '🚗', say: 'Car. Vroom.' },
        { id: 'book',    label: 'Book',    emoji: '📖' },
        { id: 'bubbles', label: 'Bubbles', emoji: '🫧' },
        { id: 'blocks',  label: 'Blocks',  emoji: '🧱' },
        { id: 'teddy',   label: 'Teddy',   emoji: '🧸' },
        { id: 'shoe',    label: 'Shoe',    emoji: '👟' },
        { id: 'hat',     label: 'Hat',     emoji: '🧢' },
      ],
    },
    {
      id: 'body', label: 'My Body', emoji: '✋',
      words: [
        { id: 'hand',  label: 'Hand',  emoji: '✋' },
        { id: 'nose',  label: 'Nose',  emoji: '👃' },
        { id: 'eyes',  label: 'Eyes',  emoji: '👀' },
        { id: 'mouth', label: 'Mouth', emoji: '👄' },
        { id: 'foot',  label: 'Foot',  emoji: '🦶' },
        { id: 'ear',   label: 'Ear',   emoji: '👂' },
        { id: 'tummy', label: 'Tummy', emoji: '🤰' },
        { id: 'hair',  label: 'Hair',  emoji: '💇' },
      ],
    },
  ],

  // ---- Fun Sounds: symbolic sounds & exclamatory words --------------------
  // The evidence-based bridge to first words for late talkers: short, easy
  // sound shapes (CV syllables, early consonants p/b/m/w/d) packed with
  // emotion. Children imitate these before true words.
  sounds: [
    { id: 'uhoh',  label: 'Uh-oh!',   emoji: '😮',  say: 'Uh oh!' },
    { id: 'wow',   label: 'Wow!',     emoji: '🤩',  say: 'Wow!' },
    { id: 'yay',   label: 'Yay!',     emoji: '🙌',  say: 'Yay!' },
    { id: 'whee',  label: 'Whee!',    emoji: '🛝',  say: 'Whee!' },
    { id: 'boo',   label: 'Boo!',     emoji: '👻',  say: 'Boo!' },
    { id: 'mmm',   label: 'Mmm!',     emoji: '😋',  say: 'Mmmmm!' },
    { id: 'yum',   label: 'Yum!',     emoji: '🍦',  say: 'Yum yum!' },
    { id: 'oops',  label: 'Oops!',    emoji: '🙊',  say: 'Oops!' },
    { id: 'shh',   label: 'Shh…',     emoji: '🤫',  say: 'Shhhh.' },
    { id: 'tada',  label: 'Ta-da!',   emoji: '🎩',  say: 'Ta da!' },
    { id: 'beep',  label: 'Beep beep!', emoji: '🚙', say: 'Beep beep!' },
    { id: 'vroom', label: 'Vroom!',   emoji: '🏎️', say: 'Vroooom!' },
    { id: 'pop',   label: 'Pop!',     emoji: '🎈',  say: 'Pop!' },
    { id: 'woof',  label: 'Woof!',    emoji: '🐶',  say: 'Woof woof!' },
    { id: 'meow',  label: 'Meow!',    emoji: '🐱',  say: 'Meow!' },
    { id: 'moo',   label: 'Moo!',     emoji: '🐄',  say: 'Moooo!' },
    { id: 'baa',   label: 'Baa!',     emoji: '🐑',  say: 'Baaaa!' },
    { id: 'quack', label: 'Quack!',   emoji: '🦆',  say: 'Quack quack!' },
    { id: 'roar',  label: 'Roar!',    emoji: '🦁',  say: 'Roarrr!' },
    { id: 'hoo',   label: 'Hoo hoo!', emoji: '🦉',  say: 'Hoo hoo!' },
    { id: 'bye',   label: 'Bye-bye!', emoji: '👋',  say: 'Bye bye!' },
    { id: 'night', label: 'Night-night', emoji: '🌙', say: 'Night night.' },
    { id: 'ouch',  label: 'Ouch!',    emoji: '🤕',  say: 'Ouch!' },
    { id: 'brr',   label: 'Brrr!',    emoji: '🥶',  say: 'Brrrr!' },
  ],

  // ---- Pop! cause-and-effect pool ---------------------------------------
  // Joyful, motivating symbols. Tapping spawns one with a soft sound.
  pop: [
    { emoji: '🫧', say: 'Bubble' },
    { emoji: '⭐', say: 'Star' },
    { emoji: '🎈', say: 'Balloon' },
    { emoji: '🐶', say: 'Dog' },
    { emoji: '🐱', say: 'Cat' },
    { emoji: '🚗', say: 'Car' },
    { emoji: '🐠', say: 'Fish' },
    { emoji: '🦋', say: 'Butterfly' },
    { emoji: '🌟', say: 'Star' },
    { emoji: '🐥', say: 'Chick' },
    { emoji: '🌈', say: 'Rainbow' },
    { emoji: '🍎', say: 'Apple' },
  ],

  // ---- Talk (AAC core board) --------------------------------------------
  // `type` drives the color, following the standard "Fitzgerald key" used on
  // communication boards (softened here): people=yellow, verbs=green,
  // describe=blue, social=pink, nouns=orange.
  aac: {
    core: [
      { id: 'i',        label: 'I',        emoji: '🙋', type: 'people' },
      { id: 'want',     label: 'want',     emoji: '🤲', type: 'verb' },
      { id: 'more',     label: 'more',     emoji: '➕', type: 'social' },
      { id: 'stop',     label: 'stop',     emoji: '🛑', type: 'social' },
      { id: 'go',       label: 'go',       emoji: '🟢', type: 'verb' },
      { id: 'help',     label: 'help',     emoji: '🆘', type: 'social' },
      { id: 'all-done', label: 'all done', emoji: '✅', type: 'social' },
      { id: 'eat',      label: 'eat',      emoji: '🍽️', type: 'verb' },
      { id: 'drink',    label: 'drink',    emoji: '🥤', type: 'verb' },
      { id: 'play',     label: 'play',     emoji: '🧸', type: 'verb' },
      { id: 'like',     label: 'like',     emoji: '❤️', type: 'verb' },
      { id: 'look',     label: 'look',     emoji: '👀', type: 'verb' },
      { id: 'yes',      label: 'yes',      emoji: '👍', type: 'social' },
      { id: 'no',       label: 'no',       emoji: '👎', type: 'social' },
    ],
    fringe: [
      { id: 'milk',    label: 'milk',    emoji: '🥛', type: 'noun' },
      { id: 'juice',   label: 'juice',   emoji: '🧃', type: 'noun' },
      { id: 'cookie',  label: 'cookie',  emoji: '🍪', type: 'noun' },
      { id: 'ball',    label: 'ball',    emoji: '⚽', type: 'noun' },
      { id: 'bubbles', label: 'bubbles', emoji: '🫧', type: 'noun' },
      { id: 'book',    label: 'book',    emoji: '📖', type: 'noun' },
      { id: 'music',   label: 'music',   emoji: '🎵', type: 'noun' },
      { id: 'mama',    label: 'Mama',    emoji: '👩', type: 'people' },
      { id: 'dada',    label: 'Dada',    emoji: '👨', type: 'people' },
      { id: 'outside', label: 'outside', emoji: '🌳', type: 'noun' },
    ],
  },

  // ---- My Day (visual schedule) -----------------------------------------
  // A gentle default routine. Editable by the parent in Settings.
  schedule: [
    { id: 'wake',      label: 'Wake up',   emoji: '☀️' },
    { id: 'breakfast', label: 'Breakfast', emoji: '🥣' },
    { id: 'play',      label: 'Play',      emoji: '🧸' },
    { id: 'snack',     label: 'Snack',     emoji: '🍌' },
    { id: 'outside',   label: 'Outside',   emoji: '🌳' },
    { id: 'lunch',     label: 'Lunch',     emoji: '🍽️' },
    { id: 'nap',       label: 'Nap',       emoji: '😴' },
    { id: 'bath',      label: 'Bath',      emoji: '🛁' },
    { id: 'book',      label: 'Story',     emoji: '📖' },
    { id: 'bed',       label: 'Bedtime',   emoji: '🌙' },
  ],
};
