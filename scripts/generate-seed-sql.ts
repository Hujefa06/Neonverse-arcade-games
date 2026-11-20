import { GAME_REGISTRY } from '../src/games/registry';
import fs from 'fs';
import path from 'path';

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

function formatControlsDesktop(controls: { key: string; action: string }[]): string {
  return controls.map(c => `${c.key}: ${c.action}`).join(' • ');
}

function formatControlsMobile(controls: { gesture: string; action: string }[]): string {
  return controls.map(c => `${c.gesture}: ${c.action}`).join(' • ');
}

const lines: string[] = [];

lines.push('-- ==============================================================================');
lines.push('-- NEONVERSE ARCADE: 002_seed_games.sql');
lines.push('-- Seed all 24 original games from src/games/registry.ts into public.games');
lines.push('-- Safe to re-run: uses INSERT ... ON CONFLICT (id) DO UPDATE');
lines.push('-- ==============================================================================');
lines.push('');
lines.push('INSERT INTO public.games (');
lines.push('  id,');
lines.push('  title,');
lines.push('  category,');
lines.push('  description,');
lines.push('  progression_type,');
lines.push('  controls_desktop,');
lines.push('  controls_mobile,');
lines.push('  icon,');
lines.push('  accent_color,');
lines.push('  is_featured,');
lines.push('  plays_count');
lines.push(') VALUES');

const valueClauses = GAME_REGISTRY.map((game, index) => {
  const id = escapeSql(game.id);
  const title = escapeSql(game.title);
  const category = escapeSql(game.category);
  const description = escapeSql(game.description);
  const progressionType = escapeSql(game.progressionType || game.progression || 'levels');
  const controlsDesktop = escapeSql(formatControlsDesktop(game.controls.desktop));
  const controlsMobile = escapeSql(formatControlsMobile(game.controls.mobile));
  const icon = escapeSql(game.iconEmoji || '🎮');
  const accentColor = escapeSql(game.accentColor || '#00F0FF');
  const isFeatured = game.badge === 'FLAGSHIP' || game.id === 'typestrike-arena' || game.id === 'tethered' || game.id === 'fliprush';
  const playsCount = 0;

  return `  (
    '${id}',
    '${title}',
    '${category}',
    '${description}',
    '${progressionType}',
    '${controlsDesktop}',
    '${controlsMobile}',
    '${icon}',
    '${accentColor}',
    ${isFeatured},
    ${playsCount}
  )`;
});

lines.push(valueClauses.join(',\n'));
lines.push('ON CONFLICT (id) DO UPDATE SET');
lines.push('  title = EXCLUDED.title,');
lines.push('  category = EXCLUDED.category,');
lines.push('  description = EXCLUDED.description,');
lines.push('  progression_type = EXCLUDED.progression_type,');
lines.push('  controls_desktop = EXCLUDED.controls_desktop,');
lines.push('  controls_mobile = EXCLUDED.controls_mobile,');
lines.push('  icon = EXCLUDED.icon,');
lines.push('  accent_color = EXCLUDED.accent_color,');
lines.push('  is_featured = EXCLUDED.is_featured;');
lines.push('');

const sqlContent = lines.join('\n');
const outputPath = path.resolve('supabase/migrations/002_seed_games.sql');

fs.writeFileSync(outputPath, sqlContent, 'utf-8');
console.log(`Successfully generated ${outputPath}`);
console.log(`Total games seeded: ${GAME_REGISTRY.length}`);
