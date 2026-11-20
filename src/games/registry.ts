import { GameMetadata, GameCategory, GameControls, GameAssets, GameMusicConfig, GameFaq } from '../types/game';
import { GameShellApi } from '../game-sdk/GameShell';

export type GameMountFunction = (
  container: HTMLDivElement,
  api: GameShellApi
) => (() => void) | Promise<(() => void)>;

export interface GameRegistryEntry extends GameMetadata {
  loader: () => Promise<GameMountFunction>;
}

export const GAME_REGISTRY: GameRegistryEntry[] = [
  {
    id: 'typestrike-arena',
    slug: 'typestrike-arena',
    title: 'TypeStrike Arena',
    tagline: 'Type words to punch, slash combos & crush bosses in high-octane fighting',
    description: 'Face off against martial rivals where typing speed transforms into devastating combat strikes! Type words to throw jabs, full sentences to unleash lightning slashes, and counter red danger phrases to block retaliations. Watch your fists evolve into energy blades as your WPM climbs!',
    category: 'Typing',
    tags: ['5-Minute Fun', 'Brain Training', 'Combat', 'Martial Arts', 'Cyberpunk'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'HOT',
    accentColor: '#00F0FF',
    iconEmoji: '⚡',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'levels',
    progressionType: 'levels',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/typestrike-arena/thumb.webp',
      hero: '/assets/games/typestrike-arena/shot1.webp',
      screenshots: [
        '/assets/games/typestrike-arena/shot1.webp',
        '/assets/games/typestrike-arena/shot2.webp',
        '/assets/games/typestrike-arena/shot3.webp'
      ],
      bg: '/assets/bg/cat-typing.webp'
    },
    music: {
      trackId: 'typestrike-synth',
      mood: 'high-octane cyber combat',
      bpm: 135,
      key: 'D minor'
    },
    controls: {
      desktop: [
        { key: 'Keyboard (A-Z)', action: 'Type combat strike words' },
        { key: 'Enter', action: 'Unleash Combo Ultimate' },
        { key: 'Esc / P', action: 'Pause Game' },
        { key: 'R', action: 'Restart Level' },
      ],
      mobile: [
        { gesture: 'Tap Arena', action: 'Focus Mobile Keyboard' },
        { gesture: 'Tap Ultimate Button', action: 'Fire Combo Boom' },
      ],
    },
    howToPlay: [
      'Type floating words above the enemy to strike (PUNCH!).',
      'Type complete sentences to charge the SLASH special with lightning.',
      'Type red danger phrases before the countdown reaches 0 to BLOCK counters.',
      'Maintain 5 correct words without mistakes to fill the COMBO bar, then hit Enter for the BOOM ultimate!',
      'Defeat 3 mighty tournament bosses to conquer the arena.'
    ],
    faq: [
      { q: 'How does WPM affect damage in TypeStrike Arena?', a: 'Typing faster increases your damage multiplier up to 3x, causing devastating critical hits on bosses.' },
      { q: 'Can I play this on mobile touchscreens?', a: 'Yes! Tapping the screen brings up your virtual keyboard with responsive touch input and auto-focus.' },
      { q: 'What happens if I mistype a letter?', a: 'A mistype drops your current combo meter, so accuracy is just as vital as speed!' }
    ],
    loader: () => import('./typestrike/TypeStrikeArena').then((m) => m.mountTypeStrikeArena),
  },

  {
    id: 'tethered',
    slug: 'tethered',
    title: 'Tethered',
    tagline: 'Real-time 2-player co-op adventure connected by a glowing energy cord',
    description: 'Two real human players, one shared quantum world, tethered together by a luminous physics cord. Synchronize movements in real time to solve cooperative pressure plates, bridge chasms using the anchored tether, reveal invisible platforms with the lantern, and defeat the twin-shield co-op titan.',
    category: '2-Player Co-op',
    tags: ['2-Player Co-op', 'Deep Progress', 'Physics', 'Multiplayer', 'Quantum'],
    players: { min: 2, max: 2 },
    engine: 'phaser',
    badge: 'FLAGSHIP',
    accentColor: '#FF2E9A',
    iconEmoji: '🔗',
    minPlayers: 2,
    maxPlayers: 2,
    isCoop: true,
    progression: 'co-op',
    progressionType: 'co-op',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/tethered/thumb.webp',
      hero: '/assets/games/tethered/shot1.webp',
      screenshots: [
        '/assets/games/tethered/shot1.webp',
        '/assets/games/tethered/shot2.webp',
        '/assets/games/tethered/shot3.webp'
      ],
      bg: '/assets/bg/cat-coop.webp'
    },
    music: {
      trackId: 'tethered-ambient',
      mood: 'atmospheric quantum bond',
      bpm: 110,
      key: 'A minor'
    },
    controls: {
      desktop: [
        { key: 'WASD / Arrows', action: 'Run & Jump' },
        { key: 'Space', action: 'Jump' },
        { key: 'E', action: 'Interact / Pull Levers' },
        { key: 'F', action: 'Anchor Tether / Light Lantern' },
        { key: 'T', action: 'Open Team Chat' },
      ],
      mobile: [
        { gesture: 'Virtual Joystick', action: 'Move' },
        { gesture: 'Jump Button', action: 'Jump' },
        { gesture: 'Action Button', action: 'Interact & Anchor' },
      ],
    },
    howToPlay: [
      'Share your 6-letter room code or link with a real friend (never bots).',
      'Both players must navigate obstacles simultaneously using live physics.',
      'Anchor on walls to turn your energy tether into a walkable bridge.',
      'Coordinate switches: one holds pressure plates while the other passes.',
      'Both players must stand on the dual exit pads together to clear each mission.'
    ],
    faq: [
      { q: 'Is multiplayer real or simulated with bots?', a: '100% real human multiplayer connected via Supabase Realtime WebSocket channels!' },
      { q: 'Can one player play alone?', a: 'Tethered requires 2 real players to complete puzzles, but you can test both roles locally in two browser tabs.' },
      { q: 'What happens if the connection drops?', a: 'The room state pauses cleanly with an auto-reconnect prompt without losing progress.' }
    ],
    loader: () => import('./tethered/Tethered').then((m) => m.mountTethered),
  },

  {
    id: 'fliprush',
    slug: 'fliprush',
    title: 'FlipRush',
    tagline: 'Defy gravity at terminal velocity in an inverted neon cyberpunk cityscape',
    description: 'An adrenaline-fueled speed runner where a single tap flips the laws of gravity upside down! Dash along ceiling girders, leap over deadly laser barriers, slide beneath crushing neon pistons, and trigger overclock hyper-speed boost gates as the tempo accelerates endlessly.',
    category: 'Action',
    tags: ['5-Minute Fun', 'Fast-Paced', 'Gravity', 'Neon Runner'],
    players: { min: 1, max: 1 },
    engine: 'phaser',
    badge: 'HOT',
    accentColor: '#FF2E9A',
    iconEmoji: '🚀',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'endless',
    progressionType: 'endless',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/fliprush/thumb.webp',
      hero: '/assets/games/fliprush/shot1.webp',
      screenshots: [
        '/assets/games/fliprush/shot1.webp',
        '/assets/games/fliprush/shot2.webp',
        '/assets/games/fliprush/shot3.webp'
      ],
      bg: '/assets/bg/cat-action.webp'
    },
    music: {
      trackId: 'fliprush-speed',
      mood: 'adrenaline gravity rush',
      bpm: 140,
      key: 'E minor'
    },
    controls: {
      desktop: [
        { key: 'Space / Up Arrow', action: 'Invert Gravity (Flip)' },
        { key: 'Down Arrow / S', action: 'Piston Slide' },
        { key: 'Shift', action: 'Overclock Dash' },
      ],
      mobile: [
        { gesture: 'Tap Screen', action: 'Invert Gravity' },
        { gesture: 'Swipe Down', action: 'Slide Beneath Barriers' },
      ],
    },
    howToPlay: [
      'Tap Space or Screen to flip your gravity between floor and ceiling.',
      'Slide under low neon beams by pressing Down.',
      'Collect yellow Overclock Orbs to build your hyper-speed boost gauge.',
      'Survive as long as possible while avoiding gaps and laser spikes.'
    ],
    faq: [
      { q: 'Does speed increase continuously?', a: 'Yes, your velocity increases by 5% every 15 seconds, demanding lightning-quick reflexes.' },
      { q: 'How do I score higher?', a: 'Near-miss flips close to laser barriers award bonus Style Points.' },
      { q: 'Are controls responsive on 120Hz displays?', a: 'Yes, input polling runs at native monitor refresh rates with zero input lag.' }
    ],
    loader: () => import('./fliprush/FlipRush').then((m) => m.mountFlipRush),
  },

  {
    id: 'goo-merge',
    slug: 'goo-merge',
    title: 'Goo Merge',
    tagline: 'Drop squishy gelatinous blobs, merge identical colors, and create the Mega Slime',
    description: 'A cozy yet deeply tactical physics drop-and-merge puzzle. Drop wobbly, gelatinous neon blobs into an organic glass beaker. When two blobs of identical mass and hue touch, they merge with a satisfying pop into a larger, glowing organism! Balance weight, wobble physics, and beaker space to craft the legendary Royal Neon Mega-Slime.',
    category: 'Puzzle',
    tags: ['Brain Training', 'Just Relax', 'Merge', 'Suika', 'Physics'],
    players: { min: 1, max: 1 },
    engine: 'phaser',
    badge: 'HOT',
    accentColor: '#B6FF3C',
    iconEmoji: '🧪',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'endless',
    progressionType: 'endless',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/goo-merge/thumb.webp',
      hero: '/assets/games/goo-merge/shot1.webp',
      screenshots: [
        '/assets/games/goo-merge/shot1.webp',
        '/assets/games/goo-merge/shot2.webp',
        '/assets/games/goo-merge/shot3.webp'
      ],
      bg: '/assets/bg/cat-puzzle.webp'
    },
    music: {
      trackId: 'goomerge-bouncy',
      mood: 'bubbly slime chill',
      bpm: 95,
      key: 'C major'
    },
    controls: {
      desktop: [
        { key: 'Mouse Move / A-D', action: 'Aim Drop Needle' },
        { key: 'Click / Space', action: 'Release Goo Blob' },
        { key: 'W / Up Arrow', action: 'Preview Next Droplet' },
      ],
      mobile: [
        { gesture: 'Drag Horizontal', action: 'Position Drop Point' },
        { gesture: 'Release Touch', action: 'Drop Blob into Beaker' },
      ],
    },
    howToPlay: [
      'Aim your dropper horizontally along the top rim of the beaker.',
      'Drop blobs so that identical colors collide and fuse together.',
      'Plan cascades: a chain reaction merge clears space rapidly.',
      'Never allow the stack of goo blobs to overflow past the danger threshold!'
    ],
    faq: [
      { q: 'How many slime tiers exist?', a: 'There are 11 distinct slime sizes, culminating in the glowing Rainbow Titan Slime.' },
      { q: 'Can blobs bounce out of the container?', a: 'The beaker has bouncy physics walls, but dropping from excessive heights causes squish rebounds.' },
      { q: 'Does progress save if I close the tab?', a: 'Yes, your high score and ongoing beaker state persist automatically in localStorage.' }
    ],
    loader: () => import('./goomerge/GooMerge').then((m) => m.mountGooMerge),
  },

  {
    id: 'chef-panic',
    slug: 'chef-panic',
    title: 'Chef Panic',
    tagline: 'Frenetic culinary pandemonium: juggle ticket orders, chop, flip and serve',
    description: 'Step into the hottest cyberpunk bistro kitchen in Neo-Tokyo! Hungry cyborg patrons demand rapid sushi rolls, flaming noodles, and neon bento boxes. Chop ingredients to rhythm, flip steaks before they burn to a crisp, extinguish grease fires with rapid clicks, and send completed plates out before patrons storm out in fury.',
    category: 'Arcade',
    tags: ['5-Minute Fun', 'Funny Physics', 'Cooking', 'Chaos', 'Time Management'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'NEW',
    accentColor: '#FF9E00',
    iconEmoji: '🍳',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'levels',
    progressionType: 'levels',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/chef-panic/thumb.webp',
      hero: '/assets/games/chef-panic/shot1.webp',
      screenshots: [
        '/assets/games/chef-panic/shot1.webp',
        '/assets/games/chef-panic/shot2.webp',
        '/assets/games/chef-panic/shot3.webp'
      ],
      bg: '/assets/bg/cat-arcade.webp'
    },
    music: {
      trackId: 'chefpanic-frenzy',
      mood: 'kitchen frenzy ragtime',
      bpm: 130,
      key: 'G major'
    },
    controls: {
      desktop: [
        { key: 'Mouse Click / Drag', action: 'Pick up & Chop Ingredients' },
        { key: 'Number Keys 1-4', action: 'Select Prep Station' },
        { key: 'Space', action: 'Ring Order Bell / Serve Plate' },
      ],
      mobile: [
        { gesture: 'Tap Ingredient', action: 'Chop / Prepare' },
        { gesture: 'Drag to Grill', action: 'Cook & Plate' },
        { gesture: 'Tap Bell', action: 'Serve Order' },
      ],
    },
    howToPlay: [
      'Inspect incoming ticket orders hanging from the overhead rail.',
      'Chop veggies at Station 1, sear proteins at Station 2, assemble at Station 3.',
      'Keep an eye on the cooking timers; overcooked items turn into smoke!',
      'Serve completed meals before the customer patience meter expires.'
    ],
    faq: [
      { q: 'What happens if food catches fire?', a: 'Click the fire extinguisher icon quickly to douse the flames before adjacent stations are ruined!' },
      { q: 'How are tips calculated?', a: 'Serving orders with more than 50% patience remaining awards a 2x Golden Tip bonus.' },
      { q: 'Are recipes randomized?', a: 'Each round serves randomized cyberpunk recipes with up to 5 ingredient combinations.' }
    ],
    loader: () => import('./chefpanic/ChefPanic').then((m) => m.mountChefPanic),
  },

  {
    id: 'beat-serpent',
    slug: 'beat-serpent',
    title: 'Beat Serpent',
    tagline: 'Classic snake meets synthwave rhythm in a reactive techno soundscape',
    description: 'The beloved retro snake mechanics re-engineered into an audiovisual synthwave rhythm experience. Slither across a pulsing 80s grid that expands and contracts with bass drops. Consume rhythm nodes on the exact beat to extend your synth tail, trigger color-shifting ripple effects, and avoid striking your own vibrating light trails.',
    category: 'Rhythm',
    tags: ['5-Minute Fun', 'Rhythm', 'Arcade', 'Snake', 'Synthwave'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'HOT',
    accentColor: '#7C4DFF',
    iconEmoji: '🐍',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'endless',
    progressionType: 'endless',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/beat-serpent/thumb.webp',
      hero: '/assets/games/beat-serpent/shot1.webp',
      screenshots: [
        '/assets/games/beat-serpent/shot1.webp',
        '/assets/games/beat-serpent/shot2.webp',
        '/assets/games/beat-serpent/shot3.webp'
      ],
      bg: '/assets/bg/cat-rhythm.webp'
    },
    music: {
      trackId: 'beatserpent-tempo',
      mood: 'electro dance tempo',
      bpm: 128,
      key: 'F minor'
    },
    controls: {
      desktop: [
        { key: 'WASD / Arrow Keys', action: 'Steer Serpent' },
        { key: 'Space', action: 'Beat Pulse Boost' },
      ],
      mobile: [
        { gesture: 'Swipe Up/Down/Left/Right', action: 'Change Direction' },
        { gesture: 'Double Tap', action: 'Rhythm Pulse' },
      ],
    },
    howToPlay: [
      'Steer the glowing serpent across the grid without running into walls or tail segments.',
      'Eat tempo orbs when the expanding rhythm ring overlaps them for 3x Perfect Beat score.',
      'Chain consecutive on-beat collections to unleash the Neon Fever multiplier.'
    ],
    faq: [
      { q: 'Does the music sync with gameplay?', a: 'Yes! Grid pulses, tempo orbs, and score multipliers are locked to the 128 BPM audio clock.' },
      { q: 'Can I wrap around screen edges?', a: 'Standard mode features lethal walls; collecting the Portal Orb temporarily allows screen wrap.' },
      { q: 'How long can the tail get?', a: 'There is no limit! Master players can fill up to 80% of the entire grid.' }
    ],
    loader: () => import('./beatserpent/BeatSerpent').then((m) => m.mountBeatSerpent),
  },

  {
    id: 'cloud-shepherd',
    slug: 'cloud-shepherd',
    title: 'Cloud Shepherd',
    tagline: 'Guide fluffy floating cloud-sheep across tranquil pastel floating archipelagos',
    description: 'A deeply serene, meditative puzzle experience. Assume the role of a gentle sky wind herding woolly cloud-sheep across floating sky islands. Blow warm breezes to guide them toward blooming star-meadows, shelter them from stormy squalls, and cultivate flourishing sky gardens to the sound of wind chimes and ambient harp melodies.',
    category: 'Chill/Aesthetic',
    tags: ['Just Relax', 'Chill/Aesthetic', 'Zen', 'Wholesome', 'Atmospheric'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'NEW',
    accentColor: '#38EF7D',
    iconEmoji: '☁️',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'zen',
    progressionType: 'zen',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/cloud-shepherd/thumb.webp',
      hero: '/assets/games/cloud-shepherd/shot1.webp',
      screenshots: [
        '/assets/games/cloud-shepherd/shot1.webp',
        '/assets/games/cloud-shepherd/shot2.webp',
        '/assets/games/cloud-shepherd/shot3.webp'
      ],
      bg: '/assets/bg/cat-chill.webp'
    },
    music: {
      trackId: 'cloudshepherd-peace',
      mood: 'dreamy floating ambient',
      bpm: 75,
      key: 'F major'
    },
    controls: {
      desktop: [
        { key: 'Mouse Move / Click', action: 'Cast Gentle Breeze Wind' },
        { key: 'Hold Space', action: 'Summon Rain Shower' },
        { key: 'Scroll Wheel', action: 'Zoom Island View' },
      ],
      mobile: [
        { gesture: 'Touch & Drag', action: 'Draw Wind Current' },
        { gesture: 'Two-Finger Tap', action: 'Rain Droplet Blessing' },
      ],
    },
    howToPlay: [
      'Draw wind currents to guide wandering cloud sheep toward clover patches.',
      'Keep sheep away from thunderous gray storm clouds.',
      'Rain upon dry pastures to help golden flowers sprout and bloom.',
      'Guide all sheep into the luminous Celestial Pen to complete each sky sanctuary.'
    ],
    faq: [
      { q: 'Is there a game over or timer?', a: 'No! Cloud Shepherd is a pure Zen game with no failure state or time pressure.' },
      { q: 'Can sheep fall off the island?', a: 'Gentle wind barriers catch stray sheep and float them safely back onto grass.' },
      { q: 'How many islands are there to explore?', a: 'There are 12 handcrafted sky sanctuaries with procedural weather variations.' }
    ],
    loader: () => import('./cloudshepherd/CloudShepherd').then((m) => m.mountCloudShepherd),
  },

  {
    id: 'rocket-postman',
    slug: 'rocket-postman',
    title: 'Rocket Postman',
    tagline: 'Deliver orbital mail parcels across quirky asteroid clusters with thruster physics',
    description: 'Strap into a sputtery vintage rocket thruster and deliver galactic priority packages to eccentric orbital space stations! Compensate for microgravity drifts, slingshot around planetary gravity wells, gingerly land on microscopic launchpads without crushing delicate packages, and avoid orbital space junk in this laugh-out-loud physics delivery challenge.',
    category: 'Funny Physics',
    tags: ['Funny Physics', '5-Minute Fun', 'Retro', 'Space', 'Flight'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'HOT',
    accentColor: '#FF6B6B',
    iconEmoji: '📬',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'levels',
    progressionType: 'levels',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/rocket-postman/thumb.webp',
      hero: '/assets/games/rocket-postman/shot1.webp',
      screenshots: [
        '/assets/games/rocket-postman/shot1.webp',
        '/assets/games/rocket-postman/shot2.webp',
        '/assets/games/rocket-postman/shot3.webp'
      ],
      bg: '/assets/bg/cat-physics.webp'
    },
    music: {
      trackId: 'rocketpostman-orbit',
      mood: 'retro cosmic funk',
      bpm: 118,
      key: 'B flat'
    },
    controls: {
      desktop: [
        { key: 'W / Up Arrow', action: 'Main Thruster Burn' },
        { key: 'A / D / Left-Right', action: 'RCS Attitude Steering' },
        { key: 'Space', action: 'Drop Parcel / Air Brake' },
      ],
      mobile: [
        { gesture: 'Left / Right Screen Sides', action: 'Attitude Steer' },
        { gesture: 'Hold Center', action: 'Main Thrusters' },
      ],
    },
    howToPlay: [
      'Ignite thrusters carefully to launch from orbital mail depots.',
      'Navigate through gravity fields without crashing into tumbling asteroids.',
      'Perform soft landings (speed < 2 m/s) on target station helipads.',
      'Deliver fragile parcels in one piece to earn 3 Golden Postal Stars.'
    ],
    faq: [
      { q: 'Why is fuel running out so quickly?', a: 'Feather the thrusters rather than holding them down; coasting through gravity wells saves fuel!' },
      { q: 'What breaks fragile packages?', a: 'Hard landings or collisions shake parcel health; delivering damaged goods docks your pay!' },
      { q: 'Can I slingshot around planets?', a: 'Yes! Realistic 2D Newtonian gravity allows orbital slingshot maneuvers to conserve thruster gas.' }
    ],
    loader: () => import('./rocketpostman/RocketPostman').then((m) => m.mountRocketPostman),
  },

  {
    id: 'magnet-surfer',
    slug: 'magnet-surfer',
    title: 'Magnet Surfer',
    tagline: 'Polarize your magnetic board to ride electromagnetic rails at hypersonic speeds',
    description: 'Ride the invisible currents of magnetism! Switch your board polarity between North (Blue) and South (Red) in milliseconds. Attract onto opposite-charged rails to slingshot around sharp hairpin bends, or repel from matching pylons to vault across gaping cyber-chasms. Maintain your flow state to unlock supersonic overdrive!',
    category: 'Action',
    tags: ['5-Minute Fun', 'Physics', 'Magnets', 'Futuristic'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'NEW',
    accentColor: '#00F0FF',
    iconEmoji: '🧲',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'endless',
    progressionType: 'endless',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/magnet-surfer/thumb.webp',
      hero: '/assets/games/magnet-surfer/shot1.webp',
      screenshots: [
        '/assets/games/magnet-surfer/shot1.webp',
        '/assets/games/magnet-surfer/shot2.webp',
        '/assets/games/magnet-surfer/shot3.webp'
      ],
      bg: '/assets/bg/cat-action.webp'
    },
    music: {
      trackId: 'magnetsurfer-pulse',
      mood: 'cyber magnetic drive',
      bpm: 124,
      key: 'C minor'
    },
    controls: {
      desktop: [
        { key: 'Space / Click', action: 'Toggle Magnetic Polarity (N / S)' },
        { key: 'Shift / Down Arrow', action: 'Magnet Downforce Snap' },
      ],
      mobile: [
        { gesture: 'Tap Left / Right', action: 'Toggle Polarity' },
        { gesture: 'Swipe Down', action: 'Magnetic Snap' },
      ],
    },
    howToPlay: [
      'Match your polarity opposite to rail beams to lock on and slide.',
      'Switch to identical polarity near repulsion coils to launch high into the air.',
      'Dodge neutral dead zones that disable your magnetic hoverboard.',
      'Collect magnetic flux particles to build the Hyper-Rail Overdrive.'
    ],
    faq: [
      { q: 'How does attraction vs repulsion work?', a: 'Opposites attract (Red pulls to Blue rail), while identicals repel (Red leaps off Red pylon).' },
      { q: 'Can I grind upside down?', a: 'Yes! Magnetic attraction locks you onto underside rails regardless of orientation.' },
      { q: 'What happens if I miss a rail?', a: 'Falling into the cyber void restarts the run, but checkpoint rings save your stage.' }
    ],
    loader: () => import('./magnetsurfer/MagnetSurfer').then((m) => m.mountMagnetSurfer),
  },

  {
    id: 'splat-squad',
    slug: 'splat-squad',
    title: 'Splat Squad',
    tagline: 'Claim cyber-arenas in four-player vibrant neon paint-blasting warfare',
    description: 'An explosive top-down tactical territory turf war! Arm yourself with rapid neon ink cannons, paint-roller shields, and splash mortars. Spray neon ink across the arena floors, slide with doubled velocity through your team’s glowing ink, and out-paint rival robotic rogue squads before the 60-second buzzer rings!',
    category: 'Action',
    tags: ['5-Minute Fun', 'Paint', 'Arena', 'Fast-Paced'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'HOT',
    accentColor: '#FF2E9A',
    iconEmoji: '🎨',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'levels',
    progressionType: 'levels',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/splat-squad/thumb.webp',
      hero: '/assets/games/splat-squad/shot1.webp',
      screenshots: [
        '/assets/games/splat-squad/shot1.webp',
        '/assets/games/splat-squad/shot2.webp',
        '/assets/games/splat-squad/shot3.webp'
      ],
      bg: '/assets/bg/cat-action.webp'
    },
    music: {
      trackId: 'splatsquad-splatter',
      mood: 'neon turf battle rave',
      bpm: 132,
      key: 'A minor'
    },
    controls: {
      desktop: [
        { key: 'WASD / Arrows', action: 'Move Inker' },
        { key: 'Mouse Aim & Click', action: 'Fire Ink Blaster' },
        { key: 'Space', action: 'Ink Submerge (Fast Glide & Reload)' },
      ],
      mobile: [
        { gesture: 'Left Virtual Joystick', action: 'Move' },
        { gesture: 'Right Touch Aim', action: 'Aim & Continuous Spray' },
      ],
    },
    howToPlay: [
      'Paint the floor with your vibrant neon color to increase territory percentage.',
      'Hold Space or submerge button to dive into your own paint for double movement speed and ink refills.',
      'Tag enemy bots with ink to splat them back to their spawn zone.',
      'The squad covering the highest percentage of arena territory at time-up wins!'
    ],
    faq: [
      { q: 'How does ink reloading work?', a: 'Submerging in your own color recharges your ink tank from 0% to 100% in under 1.5 seconds.' },
      { q: 'Can enemies walk on my ink?', a: 'Enemy bots walking through your ink suffer an 80% movement penalty and steady damage.' },
      { q: 'How many arena maps are there?', a: '5 distinct layouts including Warehouse, Rooftop, Neon Plaza, Subway, and Cyber Docks.' }
    ],
    loader: () => import('./splatsquad/SplatSquad').then((m) => m.mountSplatSquad),
  },

  {
    id: 'thirty-second-detective',
    slug: 'thirty-second-detective',
    title: '30-Second Detective',
    tagline: 'Inspect neon crime scenes, interrogate suspicious cyber-droids & crack cases',
    description: 'The clock is ticking in Neo-City! You have exactly thirty seconds to survey holographic crime scenes, pinpoint anomalous forensic clues, cross-examine three eccentric robot suspects, and accuse the true guilty culprit. Deduce motives, spot counterfeit alibis, and climb the ranks from Rookie Sleuth to Master Cyber Detective.',
    category: 'Puzzle',
    tags: ['Brain Training', '5-Minute Fun', 'Mystery', 'Detective', 'Logic'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'NEW',
    accentColor: '#FFD700',
    iconEmoji: '🔍',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'levels',
    progressionType: 'levels',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/thirty-second-detective/thumb.webp',
      hero: '/assets/games/thirty-second-detective/shot1.webp',
      screenshots: [
        '/assets/games/thirty-second-detective/shot1.webp',
        '/assets/games/thirty-second-detective/shot2.webp',
        '/assets/games/thirty-second-detective/shot3.webp'
      ],
      bg: '/assets/bg/cat-puzzle.webp'
    },
    music: {
      trackId: 'detective-noir',
      mood: 'cyber noir mystery',
      bpm: 90,
      key: 'G minor'
    },
    controls: {
      desktop: [
        { key: 'Mouse Click / Hover', action: 'Inspect Clues & Interrogate' },
        { key: 'Number Keys 1-3', action: 'Select Suspect Accusation' },
        { key: 'Space', action: 'Consult Forensic Scanner' },
      ],
      mobile: [
        { gesture: 'Tap Scene Elements', action: 'Investigate Clue' },
        { gesture: 'Tap Suspect Mugshot', action: 'File Final Accusation' },
      ],
    },
    howToPlay: [
      'Scrutinize the 3D crime room within the 30-second time limit.',
      'Tap 3 highlighted forensic anomalies (fingerprints, hacked chips, displaced items).',
      'Compare clues against suspect testimonies on the right dossier panel.',
      'Accuse the guilty party before the digital timer rings zero!'
    ],
    faq: [
      { q: 'Are cases generated procedurally?', a: 'Yes! Clues, alibis, suspects, and crime scenes are dynamically generated each round.' },
      { q: 'What happens if I accuse the wrong suspect?', a: 'A false arrest docks reputation points, while solving cases builds your Master Detective rank.' },
      { q: 'Can I freeze the timer?', a: 'Finding the Golden Clue awards a 5-second scanner freeze bonus.' }
    ],
    loader: () => import('./detective/ThirtySecondDetective').then((m) => m.mountThirtySecondDetective),
  },

  {
    id: 'stack-storm',
    slug: 'stack-storm',
    title: 'Stack Storm',
    tagline: 'Slice, trim and align neon towers into the stratosphere with pinpoint timing',
    description: 'Precision timing meets breathtaking synth architecture! Oscillating holographic platforms sweep back and forth over your growing neon skyscraper. Drop each level with pixel-perfect alignment. Any overhang is instantly cleaved away by high-frequency laser cutters! Stack 8 perfect alignments in a row to expand your foundation and build into the clouds.',
    category: 'Arcade',
    tags: ['5-Minute Fun', 'Arcade', 'Tower', 'Timing'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'HOT',
    accentColor: '#00F0FF',
    iconEmoji: '🏙️',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'endless',
    progressionType: 'endless',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/stack-storm/thumb.webp',
      hero: '/assets/games/stack-storm/shot1.webp',
      screenshots: [
        '/assets/games/stack-storm/shot1.webp',
        '/assets/games/stack-storm/shot2.webp',
        '/assets/games/stack-storm/shot3.webp'
      ],
      bg: '/assets/bg/cat-arcade.webp'
    },
    music: {
      trackId: 'stackstorm-build',
      mood: 'hypnotic building groove',
      bpm: 116,
      key: 'D minor'
    },
    controls: {
      desktop: [
        { key: 'Space / Click', action: 'Drop & Place Floor Slab' },
      ],
      mobile: [
        { gesture: 'Tap Screen', action: 'Drop Floor Slab' },
      ],
    },
    howToPlay: [
      'Watch the sliding floor slab sweep over the top of your tower.',
      'Click or tap at the exact moment it lines up with the floor below.',
      'Imperfect alignment chops off the overhanging edge, narrowing subsequent blocks.',
      'Achieve "PERFECT!" drops sequentially to hear musical scale notes and regrow tower width.'
    ],
    faq: [
      { q: 'Does block speed increase as you climb?', a: 'Yes, oscillating speed slightly increases every 15 floors reached.' },
      { q: 'How do I regrow trimmed blocks?', a: 'Scoring 5 consecutive "PERFECT!" drops expands your slab width back toward maximum.' },
      { q: 'Is there an end to the tower?', a: 'The sky is infinite! Challenge the global leaderboard for the tallest neon tower in history.' }
    ],
    loader: () => import('./stackstorm/StackStorm').then((m) => m.mountStackStorm),
  },

  {
    id: 'lantern-glider',
    slug: 'lantern-glider',
    title: 'Lantern Glider',
    tagline: 'Soar through glowing twilight skies catching warm thermal drafts in paper lanterns',
    description: 'Drift serenely on glowing twilight winds. Steer a delicate illuminated paper glider through misty mountain peaks, whispering bamboo groves, and floating lantern festivals. Catch rising thermal drafts to gain altitude, ignite dormant sky lanterns with your warm light, and discover hidden constellation shrines across peaceful mountain valleys.',
    category: 'Chill/Aesthetic',
    tags: ['Just Relax', 'Chill/Aesthetic', 'Wind', 'Gliding', 'Serene'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'NEW',
    accentColor: '#FF9E00',
    iconEmoji: '🏮',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'zen',
    progressionType: 'zen',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/lantern-glider/thumb.webp',
      hero: '/assets/games/lantern-glider/shot1.webp',
      screenshots: [
        '/assets/games/lantern-glider/shot1.webp',
        '/assets/games/lantern-glider/shot2.webp',
        '/assets/games/lantern-glider/shot3.webp'
      ],
      bg: '/assets/bg/cat-chill.webp'
    },
    music: {
      trackId: 'lanternglider-winds',
      mood: 'serene warm thermal breeze',
      bpm: 80,
      key: 'E major'
    },
    controls: {
      desktop: [
        { key: 'A / D / Left-Right', action: 'Bank Left / Right' },
        { key: 'W / Up Arrow', action: 'Dive for Speed' },
        { key: 'S / Down Arrow', action: 'Pitch Up (Trade Speed for Height)' },
      ],
      mobile: [
        { gesture: 'Tilt Device / Drag Joystick', action: 'Steer Glider Wings' },
      ],
    },
    howToPlay: [
      'Gently tilt and bank your glider to follow golden air currents.',
      'Fly directly into glowing thermal columns to ascend back into the sky.',
      'Brush past unlit paper lanterns to ignite their flame and illuminate the valley.',
      'Reach the ancient mountain pagoda at dusk to complete your serene pilgrimage.'
    ],
    faq: [
      { q: 'Can the glider crash?', a: 'Touching trees or water gently resets your glider on the nearest ridge with zero punishment.' },
      { q: 'How do thermal updrafts work?', a: 'Golden vertical particle streams carry your glider upward, replenishing lift and speed.' },
      { q: 'Does weather change over time?', a: 'Yes, daylight gently shifts from golden hour dusk to star-studded bioluminescent night.' }
    ],
    loader: () => import('./lanternglider/LanternGlider').then((m) => m.mountLanternGlider),
  },

  {
    id: 'squish-volley',
    slug: 'squish-volley',
    title: 'Squish Volley',
    tagline: 'Wobbly 2D slime volleyball with super jumps, spike smashes and hilarious physics',
    description: 'Slime sports at its most chaotic and entertaining! Two squishy, expressive gelatinous blobs bounce across a neon sand court. Compress into a flat puddle to charge your Super Bounce, headbutt glowing plasma volleyballs over the electric net, execute mid-air spike slams, and out-maneuver wacky gravity anomalies to score match points.',
    category: 'Funny Physics',
    tags: ['Funny Physics', '5-Minute Fun', 'Blob', 'Sports', 'Slime'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'HOT',
    accentColor: '#B6FF3C',
    iconEmoji: '🏐',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'levels',
    progressionType: 'levels',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/squish-volley/thumb.webp',
      hero: '/assets/games/squish-volley/shot1.webp',
      screenshots: [
        '/assets/games/squish-volley/shot1.webp',
        '/assets/games/squish-volley/shot2.webp',
        '/assets/games/squish-volley/shot3.webp'
      ],
      bg: '/assets/bg/cat-physics.webp'
    },
    music: {
      trackId: 'squishvolley-bounce',
      mood: 'wobbly beach hop',
      bpm: 122,
      key: 'C major'
    },
    controls: {
      desktop: [
        { key: 'A / D / Left-Right', action: 'Squish Slime Left / Right' },
        { key: 'W / Space / Up Arrow', action: 'Super Bounce Jump' },
        { key: 'S / Down Arrow', action: 'Dive / Head Slam' },
      ],
      mobile: [
        { gesture: 'Left / Right Screen Buttons', action: 'Slime Move' },
        { gesture: 'Jump Button', action: 'Super Bounce' },
        { gesture: 'Slam Button', action: 'Mid-Air Spike' },
      ],
    },
    howToPlay: [
      'Keep the glowing energy ball from landing on your side of the net.',
      'Bounce the ball over the net with up to 3 touches per possession.',
      'Time your jump at peak height to execute a blistering downward spike.',
      'First player to reach 7 points wins the championship trophy!'
    ],
    faq: [
      { q: 'Can I play with a friend on one keyboard?', a: 'Yes! Local two-player hotseat allows Player 1 (WASD) vs Player 2 (Arrow Keys).' },
      { q: 'What does the Dive move do?', a: 'Pressing Down mid-air spikes the ball with double velocity directly into the opponent’s floor.' },
      { q: 'Can the ball pop?', a: 'Overcharged spikes trigger super-bounces that shake the court boundaries!' }
    ],
    loader: () => import('./squishvolley/SquishVolley').then((m) => m.mountSquishVolley),
  },

  {
    id: 'circuit-sprint',
    slug: 'circuit-sprint',
    title: 'Circuit Sprint',
    tagline: 'Race an overclocked electron pulse through microscopic PCB microchip traces',
    description: 'Miniaturize down to the nanometer scale and ride raw electric voltage through a bustling microprocessor! Navigate dense printed circuit boards, switch between transistor gates, bypass fried resistors, leap over spark gaps, and outrace system voltage surges in an electrifying arcade sprint.',
    category: 'Arcade',
    tags: ['5-Minute Fun', 'Racing', 'Microchip', 'Speed', 'Precision'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'NEW',
    accentColor: '#00F0FF',
    iconEmoji: '⚡',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'levels',
    progressionType: 'levels',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/circuit-sprint/thumb.webp',
      hero: '/assets/games/circuit-sprint/shot1.webp',
      screenshots: [
        '/assets/games/circuit-sprint/shot1.webp',
        '/assets/games/circuit-sprint/shot2.webp',
        '/assets/games/circuit-sprint/shot3.webp'
      ],
      bg: '/assets/bg/cat-arcade.webp'
    },
    music: {
      trackId: 'circuitsprint-electron',
      mood: 'overclocked silicon trance',
      bpm: 136,
      key: 'F sharp minor'
    },
    controls: {
      desktop: [
        { key: 'WASD / Arrow Keys', action: 'Switch Copper Traces' },
        { key: 'Space', action: 'Voltage Boost Hop' },
        { key: 'Shift', action: 'Overclock Phase' },
      ],
      mobile: [
        { gesture: 'Swipe in 4 Directions', action: 'Switch Traces' },
        { gesture: 'Tap Screen', action: 'Spark Jump' },
      ],
    },
    howToPlay: [
      'Ride the gold copper trace without driving off dead-end solder pads.',
      'Hop across spark gaps by tapping Space when entering jumper terminals.',
      'Pass through green logic gates to trigger circuit shortcuts.',
      'Deliver the CPU clock pulse to the Master Core to clear each motherboard level.'
    ],
    faq: [
      { q: 'What happens at red burned resistors?', a: 'Red traces overheat and will short-circuit your electron; steer onto alternate blue capacitor lanes.' },
      { q: 'How does Overclock Phase work?', a: 'Holding Shift allows you to pass through capacitor obstacles without taking damage for 2 seconds.' },
      { q: 'How many microchip boards are there?', a: '8 distinct motherboards ranging from 8-bit vintage calculators to modern 64-core AI processors.' }
    ],
    loader: () => import('./circuitsprint/CircuitSprint').then((m) => m.mountCircuitSprint),
  },

  {
    id: 'dream-diver',
    slug: 'dream-diver',
    title: 'Dream Diver',
    tagline: 'Descend through surreal subconscious dreamscapes collecting luminous memories',
    description: 'Submerge into the hypnotic depths of the subconscious mind. Float weightlessly through surreal, floating dreamscapes where clockwork fish glide past inverted celestial towers. Collect glowing dream memories, dodge gloomy nightmares, and solve atmospheric acoustic puzzles to reach the deep Theta realm.',
    category: 'Chill/Aesthetic',
    tags: ['Just Relax', 'Chill/Aesthetic', 'Subconscious', 'Atmospheric', 'Deep Progress'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'NEW',
    accentColor: '#7C4DFF',
    iconEmoji: '🌙',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'endless',
    progressionType: 'endless',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/dream-diver/thumb.webp',
      hero: '/assets/games/dream-diver/shot1.webp',
      screenshots: [
        '/assets/games/dream-diver/shot1.webp',
        '/assets/games/dream-diver/shot2.webp',
        '/assets/games/dream-diver/shot3.webp'
      ],
      bg: '/assets/bg/cat-chill.webp'
    },
    music: {
      trackId: 'dreamdiver-ethereal',
      mood: 'lucid dream shimmer',
      bpm: 85,
      key: 'B minor'
    },
    controls: {
      desktop: [
        { key: 'Mouse Cursor / WASD', action: 'Float & Swim' },
        { key: 'Click / Space', action: 'Lucid Pulse Emission' },
      ],
      mobile: [
        { gesture: 'Drag Anywhere', action: 'Glide Dream Diver' },
        { gesture: 'Tap Screen', action: 'Emit Dream Pulse' },
      ],
    },
    howToPlay: [
      'Gently glide through the surreal dream ocean using smooth swimming strokes.',
      'Collect golden memory spheres to illuminate darkened sectors of the subconscious.',
      'Emit a Lucid Pulse to dissipate encroaching shadowy nightmare wisps.',
      'Descend deeper to uncover hidden secrets in the REM and Theta dream chambers.'
    ],
    faq: [
      { q: 'Can nightmares harm the diver?', a: 'Nightmares darken your field of vision; pulse to restore your lucidity glow!' },
      { q: 'Does the environment react to sound?', a: 'Yes, underwater plants and star-creatures pulse in resonance with the ambient synth bells.' },
      { q: 'How deep does the subconscious go?', a: 'Depths exceed 5,000 dream fathoms with continuously evolving celestial biomes.' }
    ],
    loader: () => import('./dreamdiver/DreamDiver').then((m) => m.mountDreamDiver),
  },

  {
    id: 'noodle-knockout',
    slug: 'noodle-knockout',
    title: 'Noodle Knockout',
    tagline: 'Floppy physics ragdoll brawling on high-rise neon rooftops and moving trains',
    description: 'The wackiest ragdoll combat experience in gaming! Take control of gelatinous, noodle-armed fighters competing in precarious high-altitude arenas. Flail floppy limbs, grab chairs, trashcans and opponents, wind up comical helicopter punches, and toss rival fighters over the arena perimeter to claim the championship belt!',
    category: 'Funny Physics',
    tags: ['Funny Physics', '5-Minute Fun', 'Brawler', 'Ragdoll', 'Comedy'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'HOT',
    accentColor: '#FF2E9A',
    iconEmoji: '🥊',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'levels',
    progressionType: 'levels',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/noodle-knockout/thumb.webp',
      hero: '/assets/games/noodle-knockout/shot1.webp',
      screenshots: [
        '/assets/games/noodle-knockout/shot1.webp',
        '/assets/games/noodle-knockout/shot2.webp',
        '/assets/games/noodle-knockout/shot3.webp'
      ],
      bg: '/assets/bg/cat-physics.webp'
    },
    music: {
      trackId: 'noodleknockout-slap',
      mood: 'derpy ragdoll rumble',
      bpm: 126,
      key: 'G major'
    },
    controls: {
      desktop: [
        { key: 'WASD / Arrows', action: 'Wobble & Run' },
        { key: 'J / Left Click', action: 'Punch / Flail Left Arm' },
        { key: 'K / Right Click', action: 'Punch / Flail Right Arm' },
        { key: 'Space', action: 'Ragdoll Jump' },
        { key: 'E / Shift', action: 'Grab & Chuck Opponent' },
      ],
      mobile: [
        { gesture: 'Left Joystick', action: 'Wobble Move' },
        { gesture: 'Punch Buttons', action: 'Flail Arms' },
        { gesture: 'Grab Button', action: 'Grab / Throw' },
      ],
    },
    howToPlay: [
      'Wobble your noodle fighter toward opponents while maintaining balance.',
      'Flail punches to stun rivals and make them temporarily dizzy.',
      'Grab stunned opponents with both hands, drag them to the edge, and heave them off the roof!',
      'Last noodle standing at the end of 3 rounds wins the match.'
    ],
    faq: [
      { q: 'How do I recover when knocked down?', a: 'Rapidly mash punch and jump buttons to shake off dizziness and stand back up!' },
      { q: 'Can I pick up props in the arena?', a: 'Yes! Barrels, steel chairs, and neon signs can all be grabbed and hurled as weapons.' },
      { q: 'Are there hazards in the arena?', a: 'Watch out for billboards that collapse, passing subway trains, and slippery oil puddles!' }
    ],
    loader: () => import('./noodleknockout/NoodleKnockout').then((m) => m.mountNoodleKnockout),
  },

  {
    id: 'ember-and-frost',
    slug: 'ember-and-frost',
    title: 'Ember & Frost',
    tagline: 'Harmonize fire and ice spirits to solve elemental puzzles and bridge thermal gaps',
    description: 'An elemental puzzle adventure celebrating balance and duality. Command two companion spirits simultaneously: Ember, the incandescent flame wisp, and Frost, the crystalline ice fairy. Melt glaciers with heat to reveal hidden pathways, freeze boiling geysers into solid bridges, and cooperate across thermal chambers.',
    category: 'Puzzle',
    tags: ['Brain Training', 'Deep Progress', 'Elemental', 'Logic'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'NEW',
    accentColor: '#FF6B6B',
    iconEmoji: '🔥',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'levels',
    progressionType: 'levels',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/ember-and-frost/thumb.webp',
      hero: '/assets/games/ember-and-frost/shot1.webp',
      screenshots: [
        '/assets/games/ember-and-frost/shot1.webp',
        '/assets/games/ember-and-frost/shot2.webp',
        '/assets/games/ember-and-frost/shot3.webp'
      ],
      bg: '/assets/bg/cat-puzzle.webp'
    },
    music: {
      trackId: 'emberfrost-duality',
      mood: 'fire and ice counterpoint',
      bpm: 104,
      key: 'D minor'
    },
    controls: {
      desktop: [
        { key: 'WASD', action: 'Move Ember (Fire)' },
        { key: 'Arrow Keys', action: 'Move Frost (Ice)' },
        { key: 'Space', action: 'Switch Active Spirit (Single Control Mode)' },
        { key: 'E / Enter', action: 'Cast Elemental Wave' },
      ],
      mobile: [
        { gesture: 'Left Joystick', action: 'Move Ember' },
        { gesture: 'Right Joystick', action: 'Move Frost' },
        { gesture: 'Element Tap', action: 'Cast Elemental Pulse' },
      ],
    },
    howToPlay: [
      'Navigate both spirits through the dungeon simultaneously or take turns switching.',
      'Use Ember to melt snowdrifts, ignite braziers, and warm cold pressure plates.',
      'Use Frost to solidify lava streams, freeze waterfalls, and extinguish fire gates.',
      'Reunite both spirits at the Harmony Crucible to unlock the chamber gateway.'
    ],
    faq: [
      { q: 'What happens if Ember touches water?', a: 'Water extinguishes Ember; Frost must freeze the pool first so Ember can walk across the ice!' },
      { q: 'Can one person easily control both spirits?', a: 'Yes! You can toggle between them one at a time using Space, or dual-wield both hands on WASD + Arrows.' },
      { q: 'How many elemental temples are there?', a: '4 magnificent temples: Glacial Caverns, Magma Citadel, Steam Sanctuary, and the Cosmic Equilibrium.' }
    ],
    loader: () => import('./emberandfrost/EmberAndFrost').then((m) => m.mountEmberAndFrost),
  },

  {
    id: 'star-painter',
    slug: 'star-painter',
    title: 'Star Painter',
    tagline: 'Connect celestial stellar nodes to paint mythical glowing constellations in the cosmos',
    description: 'Transform the deep void of space into a canvas of starlight! Connect brilliant pulsing stellar nodes with shimmering lines of cosmic stardust. Draw mythical constellations of dragons, phoenixes, and celestial chariots. Discover ancient astrological legends as harmonious glass chimes sing upon every completed star pattern.',
    category: 'Puzzle',
    tags: ['Brain Training', 'Just Relax', 'Constellations', 'Cosmic'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'NEW',
    accentColor: '#00F0FF',
    iconEmoji: '✨',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'levels',
    progressionType: 'levels',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/star-painter/thumb.webp',
      hero: '/assets/games/star-painter/shot1.webp',
      screenshots: [
        '/assets/games/star-painter/shot1.webp',
        '/assets/games/star-painter/shot2.webp',
        '/assets/games/star-painter/shot3.webp'
      ],
      bg: '/assets/bg/cat-puzzle.webp'
    },
    music: {
      trackId: 'starpainter-starlight',
      mood: 'celestial harp resonance',
      bpm: 88,
      key: 'A major'
    },
    controls: {
      desktop: [
        { key: 'Mouse Click & Drag', action: 'Draw Stardust Connection' },
        { key: 'Z / Backspace', action: 'Undo Last Line' },
        { key: 'H', action: 'Show Constellation Hint' },
      ],
      mobile: [
        { gesture: 'Touch & Drag from Star to Star', action: 'Connect Constellation' },
        { gesture: 'Double Tap', action: 'Undo Connection' },
      ],
    },
    howToPlay: [
      'Observe the silhouette outline of the legendary celestial constellation.',
      'Drag your cursor or finger between bright stars to draw lines without crossing edges.',
      'Hit every required star coordinate to bring the mythic artwork to life.',
      'Watch your completed constellation illuminate the galaxy with cascading starlight.'
    ],
    faq: [
      { q: 'Can lines overlap or intersect?', a: 'Some advanced cosmic puzzles allow intersecting lines, while classic modes require planar geometry.' },
      { q: 'What happens when a constellation is finished?', a: 'The constellation comes to life with animated star creatures and a chime fanfare.' },
      { q: 'How many constellations can be painted?', a: '24 zodiac and mythical sky patterns across 4 deep-sky quadrants.' }
    ],
    loader: () => import('./starpainter/StarPainter').then((m) => m.mountStarPainter),
  },

  {
    id: 'traffic-tamer',
    slug: 'traffic-tamer',
    title: 'Traffic Tamer',
    tagline: 'Control multi-lane hyper-city traffic signals to prevent catastrophic cyber-pileups',
    description: 'Assume duty as chief traffic flow controller in the high-density metropolis of Neo-Haven! Command digital intersection signals across complex multi-lane avenues. Toggle green and red lights to keep autonomous taxis, heavy freight transports, and emergency hover-ambulances moving smoothly without a single catastrophic collision.',
    category: 'Puzzle',
    tags: ['Brain Training', '5-Minute Fun', 'Traffic', 'Simulation', 'Management'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'HOT',
    accentColor: '#FFD700',
    iconEmoji: '🚦',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'levels',
    progressionType: 'levels',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/traffic-tamer/thumb.webp',
      hero: '/assets/games/traffic-tamer/shot1.webp',
      screenshots: [
        '/assets/games/traffic-tamer/shot1.webp',
        '/assets/games/traffic-tamer/shot2.webp',
        '/assets/games/traffic-tamer/shot3.webp'
      ],
      bg: '/assets/bg/cat-puzzle.webp'
    },
    music: {
      trackId: 'traffictamer-grid',
      mood: 'metro intersection electro',
      bpm: 120,
      key: 'E minor'
    },
    controls: {
      desktop: [
        { key: 'Mouse Click on Light / Number Keys', action: 'Toggle Traffic Signal' },
        { key: 'Space', action: 'Emergency All-Stop Override' },
      ],
      mobile: [
        { gesture: 'Tap Traffic Signal', action: 'Toggle Green / Red' },
        { gesture: 'Double Tap Center', action: 'Emergency Siren Pause' },
      ],
    },
    howToPlay: [
      'Click or tap traffic lights to cycle between Green (go) and Red (stop).',
      'Do not allow traffic queues to back up beyond the screen boundary.',
      'Prevent vehicles from colliding in the center crossway.',
      'Prioritize high-speed Emergency Hovercrafts that cannot stop quickly!'
    ],
    faq: [
      { q: 'How is driver anger measured?', a: 'Cars waiting at red lights show rising steam icons; if a vehicle waits over 20 seconds, you lose a life!' },
      { q: 'What happens in a crash?', a: 'A collision triggers a gridlock alarm and ends the round, with hilarious honking sound effects.' },
      { q: 'Do weather conditions change vehicle braking?', a: 'Yes! Rainy levels double braking distance, requiring earlier red-light timing.' }
    ],
    loader: () => import('./traffictamer/TrafficTamer').then((m) => m.mountTrafficTamer),
  },

  {
    id: 'whack-a-glitch',
    slug: 'whack-a-glitch',
    title: 'Whack-a-Glitch',
    tagline: 'Purge corrupt rogue glitches from a retro CRT terminal with rapid hammer strikes',
    description: 'A nostalgic retro arcade reflex showdown! Corrupt rogue software glitches are invading your 1984 CRT green-screen terminal. Smash malware bugs, virus worms, and memory leak daemons as they peek out of terminal sockets. Avoid hitting friendly system kernel daemons, build up lightning combos, and reboot the system cleanly.',
    category: 'Arcade',
    tags: ['5-Minute Fun', 'Arcade', 'Reflexes', 'Cyberpunk', 'CRT'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'HOT',
    accentColor: '#38EF7D',
    iconEmoji: '👾',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'endless',
    progressionType: 'endless',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/whack-a-glitch/thumb.webp',
      hero: '/assets/games/whack-a-glitch/shot1.webp',
      screenshots: [
        '/assets/games/whack-a-glitch/shot1.webp',
        '/assets/games/whack-a-glitch/shot2.webp',
        '/assets/games/whack-a-glitch/shot3.webp'
      ],
      bg: '/assets/bg/cat-arcade.webp'
    },
    music: {
      trackId: 'whackaglitch-chip',
      mood: '8-bit chiptune overdrive',
      bpm: 138,
      key: 'A minor'
    },
    controls: {
      desktop: [
        { key: 'Mouse Click / Numpad 1-9', action: 'Whack Glitch in Socket' },
        { key: 'Space', action: 'EMP Bug Bomb' },
      ],
      mobile: [
        { gesture: 'Tap Glitch Port Directly', action: 'Whack Virus' },
      ],
    },
    howToPlay: [
      'Click or tap glitches the moment they pop out of the CRT grid sockets.',
      'Smash golden Bug Bounties for bonus score multipliers.',
      'Never hit the green Kernel Guardian — hitting friendly files costs 500 points!',
      'Survive the 60-second Overclock Phase to set high-score records.'
    ],
    faq: [
      { q: 'Can I use keyboard numpad keys?', a: 'Yes! The 3x3 grid perfectly maps to your keyboard numpad numbers 1 through 9 for blazing fast inputs.' },
      { q: 'What does the EMP Bomb do?', a: 'Clears every active glitch on screen instantly, awarded after maintaining a 20x hit streak.' },
      { q: 'Does screen curvature mimic real CRT monitors?', a: 'Yes, with authentic scanlines, chromatic aberration, and phosphor glow shaders.' }
    ],
    loader: () => import('./whackaglitch/WhackAGlitch').then((m) => m.mountWhackAGlitch),
  },

  {
    id: 'orbit-oddballs',
    slug: 'orbit-oddballs',
    title: 'Orbit Oddballs',
    tagline: 'Launch goofy planetary oddballs into orbital resonance using gravitational slingshots',
    description: 'Physics meets whimsical cosmic comedy! Aim and launch quirky planetary oddballs with unique bouncy personalities into complex multi-body gravitational orbits. Slingshot around supermassive black holes, bounce off gaseous planet rings, and collect floating star candies without getting sucked into cosmic voids.',
    category: 'Funny Physics',
    tags: ['Funny Physics', '5-Minute Fun', 'Gravity', 'Orbital', 'Slingshot'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'NEW',
    accentColor: '#FF2E9A',
    iconEmoji: '🪐',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'levels',
    progressionType: 'levels',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/orbit-oddballs/thumb.webp',
      hero: '/assets/games/orbit-oddballs/shot1.webp',
      screenshots: [
        '/assets/games/orbit-oddballs/shot1.webp',
        '/assets/games/orbit-oddballs/shot2.webp',
        '/assets/games/orbit-oddballs/shot3.webp'
      ],
      bg: '/assets/bg/cat-physics.webp'
    },
    music: {
      trackId: 'orbitoddballs-gravity',
      mood: 'wobbly planetary disco',
      bpm: 114,
      key: 'D major'
    },
    controls: {
      desktop: [
        { key: 'Mouse Drag & Release', action: 'Aim Slingshot Angle & Velocity' },
        { key: 'R', action: 'Reset Shot' },
      ],
      mobile: [
        { gesture: 'Touch, Pull Back & Release', action: 'Slingshot Oddball' },
      ],
    },
    howToPlay: [
      'Click and drag backward from your planetary oddball to set trajectory and power.',
      'Release to launch into the gravitational field.',
      'Use planetary mass to curve your trajectory around cosmic barriers.',
      'Collect all 3 floating star crystals to unlock the wormhole exit.'
    ],
    faq: [
      { q: 'Do different oddballs have different physics?', a: 'Yes! Moonball has low mass and high bounce, while Iron Giant ball resists gravitational curves.' },
      { q: 'Can an oddball achieve stable orbit?', a: 'Yes, master players can enter permanent orbital loops to collect star rings passively.' },
      { q: 'How many gravity stages are available?', a: '15 handcrafted planetary systems with binary star and pulsar mechanics.' }
    ],
    loader: () => import('./orbitoddballs/OrbitOddballs').then((m) => m.mountOrbitOddballs),
  },

  {
    id: 'mirror-twins',
    slug: 'mirror-twins',
    title: 'Mirror Twins',
    tagline: 'Guide twin neon sparks simultaneously across inverted mirrored obstacle courses',
    description: 'The ultimate dual-brain coordination challenge! Control two neon spark twins who move in inverted mirror symmetry. As Twin Alpha moves right, Twin Beta mirrors left. Navigate twin mazes filled with reciprocal laser grids, synchronised pressure switches, and phase-shifting walls that demand complete focus across both hemispheres of your mind.',
    category: 'Action',
    tags: ['5-Minute Fun', 'Brain Training', 'Dual Control', 'Reflexes'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'HOT',
    accentColor: '#00F0FF',
    iconEmoji: '👥',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'endless',
    progressionType: 'endless',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/mirror-twins/thumb.webp',
      hero: '/assets/games/mirror-twins/shot1.webp',
      screenshots: [
        '/assets/games/mirror-twins/shot1.webp',
        '/assets/games/mirror-twins/shot2.webp',
        '/assets/games/mirror-twins/shot3.webp'
      ],
      bg: '/assets/bg/cat-action.webp'
    },
    music: {
      trackId: 'mirrortwins-stereo',
      mood: 'symmetrical stereo synth',
      bpm: 130,
      key: 'B minor'
    },
    controls: {
      desktop: [
        { key: 'WASD / Arrow Keys', action: 'Move Twin Alpha (Beta Mirrors Inverted)' },
        { key: 'Space', action: 'Phase Invert Polarity' },
      ],
      mobile: [
        { gesture: 'Virtual Joystick / Swipe', action: 'Steer Twin Sparks' },
        { gesture: 'Tap Screen', action: 'Phase Invert' },
      ],
    },
    howToPlay: [
      'Steer both sparks simultaneously; remember that horizontal movement is mirrored!',
      'Avoid driving either spark into red hazard lasers or walls.',
      'Trigger dual switches at the exact same moment to open cross-sector gates.',
      'Collect paired energy cores to maintain high score multipliers.'
    ],
    faq: [
      { q: 'Can one spark die while the other survives?', a: 'If either twin strikes a hazard, both sparks collapse in a quantum feedback burst.' },
      { q: 'What does Phase Invert do?', a: 'Temporarily swaps mirror symmetry from horizontal to vertical reflection for 5 seconds.' },
      { q: 'Is there a practice mode?', a: 'First 5 levels feature slower obstacle tracks to help tune your dual-hemisphere reflexes.' }
    ],
    loader: () => import('./mirrortwins/MirrorTwins').then((m) => m.mountMirrorTwins),
  },

  {
    id: 'echo-bloom',
    slug: 'echo-bloom',
    title: 'Echo Bloom',
    tagline: 'Cultivate bioluminescent flowers whose petals resonate with harmonious chimes',
    description: 'Immerse your senses in a tranquil bioluminescent sound garden. Plant glowing seeds that grow into crystalline cyber-flora. Each blooming petal resonates with pure harmonic frequencies, composing an evolving, organic ambient symphony in response to your nurturing touch. Relax, unwind, and watch your vibrant digital garden thrive.',
    category: 'Chill/Aesthetic',
    tags: ['Just Relax', 'Chill/Aesthetic', 'Zen', 'Bioluminescence', 'Garden'],
    players: { min: 1, max: 1 },
    engine: 'custom-canvas',
    badge: 'NEW',
    accentColor: '#38EF7D',
    iconEmoji: '🌸',
    minPlayers: 1,
    maxPlayers: 1,
    progression: 'zen',
    progressionType: 'zen',
    version: '2.0.0',
    enabled: true,
    assets: {
      thumb: '/assets/games/echo-bloom/thumb.webp',
      hero: '/assets/games/echo-bloom/shot1.webp',
      screenshots: [
        '/assets/games/echo-bloom/shot1.webp',
        '/assets/games/echo-bloom/shot2.webp',
        '/assets/games/echo-bloom/shot3.webp'
      ],
      bg: '/assets/bg/cat-chill.webp'
    },
    music: {
      trackId: 'echobloom-zen',
      mood: 'bioluminescent organic chime',
      bpm: 72,
      key: 'E minor'
    },
    controls: {
      desktop: [
        { key: 'Mouse Click / Hover', action: 'Plant & Caress Bioluminescent Flora' },
        { key: '1-5 Keys', action: 'Select Flower Resonance Seed' },
        { key: 'Space', action: 'Trigger Harmonic Bloom Wave' },
      ],
      mobile: [
        { gesture: 'Tap to Plant', action: 'Sprout Crystalline Flower' },
        { gesture: 'Brush Across Flowers', action: 'Trigger Melodic Chimes' },
      ],
    },
    howToPlay: [
      'Click or tap along the glowing garden soil to plant resonant seeds.',
      'Watch petals unfold and produce luminous ambient acoustic pulses.',
      'Harmonize different petal pitches to generate layered melodic loops.',
      'Bask in the peaceful, procedurally generated musical sanctuary.'
    ],
    faq: [
      { q: 'Is there any time limit or game over?', a: 'Zero pressure, zero game over! Echo Bloom is purely built for relaxation and peaceful meditation.' },
      { q: 'How many flower types are there?', a: '8 unique flower breeds representing pentatonic, dorian, and celestial melodic scales.' },
      { q: 'Can I export my garden melody?', a: 'Your garden persists across sessions, allowing you to return and listen anytime.' }
    ],
    loader: () => import('./echobloom/EchoBloom').then((m) => m.mountEchoBloom),
  },
];

// Helper lookup functions
export const getGame = (idOrSlug: string): GameRegistryEntry | undefined => {
  return GAME_REGISTRY.find((g) => g.id === idOrSlug || g.slug === idOrSlug);
};

export const getAllGames = (): GameRegistryEntry[] => {
  return [...GAME_REGISTRY];
};

export const getGamesByCategory = (category: string): GameRegistryEntry[] => {
  if (!category || category === 'All') return getAllGames();
  return GAME_REGISTRY.filter((g) => g.category === category);
};

export const getGamesByTag = (tag: string): GameRegistryEntry[] => {
  return GAME_REGISTRY.filter((g) => g.tags.includes(tag));
};

export const getRelatedGames = (gameId: string, limit: number = 4): GameRegistryEntry[] => {
  const current = getGame(gameId);
  if (!current) return GAME_REGISTRY.slice(0, limit);
  return GAME_REGISTRY.filter(
    (g) => g.id !== current.id && (g.category === current.category || g.tags.some((t) => current.tags.includes(t)))
  ).slice(0, limit);
};

// Async mount loader
export async function loadGameMount(gameId: string): Promise<GameMountFunction> {
  const game = getGame(gameId);
  if (!game) {
    throw new Error(`Game not found in registry: ${gameId}`);
  }
  return await game.loader();
}

// Backward compatibility helper
export function getGameMountFunction(game: GameMetadata): GameMountFunction {
  const entry = getGame(game.id);
  if (entry) {
    return async (container: HTMLDivElement, api: GameShellApi) => {
      const mountFn = await entry.loader();
      return mountFn(container, api);
    };
  }

  // Universal Default Fallback
  return (container: HTMLDivElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 540;
    container.appendChild(canvas);
    return () => {
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  };
}

// Re-export as GAMES_CATALOG for seamless backward compatibility
export const GAMES_CATALOG = GAME_REGISTRY;
