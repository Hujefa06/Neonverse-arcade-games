# NEONVERSE ARCADE ⚡🕹️

A dark premium browser gaming platform featuring **24 original games**, responsive touch & desktop controls, procedural audio synthesis, guest progression, cloud sync, and real-time 2-player cooperative multiplayer.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Optional: Run Backend API Server
```bash
npm run server
```
Runs the Express API on [http://localhost:3001](http://localhost:3001).

---

## 🗄️ Database & Supabase Setup

Neonverse Arcade includes a **Zero-Config Local Mock Adapter**. If no Supabase credentials are configured in `.env`, the entire platform (guest saves, offline leaderboards, local achievements, and room signaling) operates locally out-of-the-box.

To connect a live Supabase project:
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env` and fill in:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run the SQL migration script located in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor.

---

## 🎨 Theme & Visual Palette

- **Primary Background**: `#07080F` / `#0B0E1A`
- **Neon Cyan**: `#00F0FF`
- **Neon Magenta**: `#FF2E9A`
- **Neon Violet**: `#7C4DFF`
- **Neon Lime**: `#B6FF3C`
- **Glassmorphism**: Translucent cards (`rgba(255, 255, 255, 0.04)`), `14px` backdrop blur, `1px` neon border.
- **3D Interactive Hover**: Perspective card tilting on pointer hover.
- **Accessibility**: Includes "Low FX Mode" and respects `prefers-reduced-motion`.

---

## 🎮 Shared Game SDK

Located in `src/game-sdk/`:
- `<GameShell>`: Responsive canvas container, theater & fullscreen mode, pause overlay, blur auto-pause.
- `InputManager`: Virtual analog joystick + context action buttons on mobile touch, WASD/arrows/mouse on desktop.
- `AudioManager`: Pure Web Audio procedural sound synthesizer (keystroke ticks, punch POW, slash WHOOSH, combo BOOM, fanfare). No copyrighted assets.
- `SaveManager`: Guest localStorage persistence + debounced cloud synchronization.
- `ScoreManager`: Plausibility checks, XP progression calculation, confetti celebrations.
- `FXKit`: Screen shake, lightning flashes, neon particle bursts, combo floaters.
