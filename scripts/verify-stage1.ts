import { GAME_REGISTRY } from '../src/games/registry';

console.log('=== STAGE 1 VERIFICATION ===');
console.log('1. Checking Game Registry...');
console.log('Total games in registry:', GAME_REGISTRY.length);

if (GAME_REGISTRY.length !== 24) {
  console.error(`ERROR: Expected 24 games, found ${GAME_REGISTRY.length}`);
  process.exit(1);
}

// Validate fields of each entry
const requiredFields = ['id', 'slug', 'title', 'category', 'tags', 'controls', 'assets', 'music', 'loader'];
for (const game of GAME_REGISTRY) {
  for (const field of requiredFields) {
    if ((game as any)[field] === undefined) {
      console.error(`ERROR: Game ${game.id} is missing field "${field}"`);
      process.exit(1);
    }
  }
}
console.log('All 24 games have all required fields (id, slug, title, category, tags, controls, assets, music, loader).');

console.log('\n2. Registry Slugs:');
console.log(GAME_REGISTRY.map((g, idx) => `${idx + 1}. [${g.category}] ${g.title} (${g.slug})`).join('\n'));

process.exit(0);
