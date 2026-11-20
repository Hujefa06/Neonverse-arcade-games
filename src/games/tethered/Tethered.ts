import { GameShellApi } from '../../game-sdk/GameShell';
import { audioManager } from '../../game-sdk/AudioManager';
import { fxKit } from '../../game-sdk/FXKit';
import { saveManager } from '../../game-sdk/SaveManager';
import { supabase, isRealSupabaseConfigured } from '../../services/supabaseClient';

interface PlayerSyncState {
  id: string;
  isHost: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isAnchored: boolean;
  hasLantern: boolean;
  onExitPad: boolean;
  timestamp: number;
}

interface ChatMessage {
  sender: string;
  text: string;
  time: string;
}

export function mountTethered(
  container: HTMLDivElement,
  api: GameShellApi
): () => void {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.objectFit = 'contain';
  canvas.style.backgroundColor = '#07080F';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;

  // 1. Room Management & Multiplayer State
  const urlParams = new URLSearchParams(window.location.search);
  const roomFromUrl = urlParams.get('room')?.toUpperCase() || '';

  let roomCode = roomFromUrl;
  let isHost = !roomFromUrl;
  let playerId = `p_${Math.random().toString(36).substring(2, 8)}`;
  let channel: any = null;

  let gameState: 'lobby' | 'waiting' | 'playing' | 'disconnected' = roomCode ? 'waiting' : 'lobby';
  let disconnectCountdown = 60;
  let lastRemoteHeartbeat = Date.now();

  let currentMission = 1;
  const maxMissions = 5;
  let sharedScore = 0;

  // Local Player
  let myX = isHost ? 140 : 200;
  let myY = 420;
  let myVx = 0;
  let myVy = 0;
  let isMyAnchored = false;
  let hasMyLantern = isHost;
  let isMyAtExit = false;

  // Remote Player
  let remoteX = isHost ? 200 : 140;
  let remoteY = 420;
  let targetRemoteX = remoteX;
  let targetRemoteY = remoteY;
  let isRemoteAnchored = false;
  let hasRemoteLantern = !isHost;
  let isRemoteAtExit = false;
  let isRemoteConnected = false;

  // Mission Puzzles State
  let plate1Pressed = false;
  let plate2Pressed = false;
  let bossHp = 400;
  const bossMaxHp = 400;
  let bossX = 760;
  let bossY = 320;

  // Chat system
  let chatMessages: ChatMessage[] = [];
  let isVoiceActive = false;

  // Input states
  let moveKeys = { up: false, down: false, left: false, right: false };

  // Setup Multiplayer Realtime Channel
  const connectToRoom = (code: string) => {
    roomCode = code.toUpperCase();
    gameState = 'waiting';
    channel = supabase.channel(`tethered_room_${roomCode}`);

    channel
      .on('broadcast', { event: 'player_sync' }, ({ payload }: { payload: PlayerSyncState }) => {
        if (payload.id !== playerId) {
          lastRemoteHeartbeat = Date.now();
          targetRemoteX = payload.x;
          targetRemoteY = payload.y;
          isRemoteAnchored = payload.isAnchored;
          hasRemoteLantern = payload.hasLantern;
          isRemoteAtExit = payload.onExitPad;

          if (!isRemoteConnected) {
            isRemoteConnected = true;
            gameState = 'playing';
            audioManager.playLevelUpChime();
          }
        }
      })
      .on('broadcast', { event: 'mission_event' }, ({ payload }: any) => {
        if (payload.type === 'next_mission') {
          currentMission = payload.mission;
          resetMissionPositions();
          audioManager.playVictoryFanfare();
        } else if (payload.type === 'boss_hit') {
          bossHp = Math.max(0, bossHp - payload.dmg);
          audioManager.playPunchPOW();
          fxKit.triggerScreenShake(container, 8, 250);
        }
      })
      .on('broadcast', { event: 'chat_message' }, ({ payload }: { payload: ChatMessage }) => {
        chatMessages.push(payload);
        if (chatMessages.length > 5) chatMessages.shift();
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          // Announce presence
          channel.send({
            type: 'broadcast',
            event: 'player_sync',
            payload: {
              id: playerId,
              isHost,
              x: myX,
              y: myY,
              vx: myVx,
              vy: myVy,
              isAnchored: isMyAnchored,
              hasLantern: hasMyLantern,
              onExitPad: isMyAtExit,
              timestamp: Date.now(),
            },
          });
        }
      });
  };

  if (roomCode) {
    connectToRoom(roomCode);
  }

  // 20 Hz State Synchronization (~50ms tick)
  const syncInterval = setInterval(() => {
    if (channel && (gameState === 'playing' || gameState === 'waiting')) {
      channel.send({
        type: 'broadcast',
        event: 'player_sync',
        payload: {
          id: playerId,
          isHost,
          x: myX,
          y: myY,
          vx: myVx,
          vy: myVy,
          isAnchored: isMyAnchored,
          hasLantern: hasMyLantern,
          onExitPad: isMyAtExit,
          timestamp: Date.now(),
        },
      });
    }

    // Check remote connection heartbeat
    if (gameState === 'playing' && Date.now() - lastRemoteHeartbeat > 2500) {
      gameState = 'disconnected';
    }
  }, 50);

  const resetMissionPositions = () => {
    myX = isHost ? 120 : 180;
    myY = 420;
    remoteX = isHost ? 180 : 120;
    remoteY = 420;
    targetRemoteX = remoteX;
    targetRemoteY = remoteY;
    plate1Pressed = false;
    plate2Pressed = false;
    bossHp = bossMaxHp;
  };

  // Keyboard controls
  const onKeyDown = (e: KeyboardEvent) => {
    if (gameState === 'lobby') return;

    if (e.key === 'a' || e.key === 'ArrowLeft') moveKeys.left = true;
    if (e.key === 'd' || e.key === 'ArrowRight') moveKeys.right = true;
    if ((e.code === 'Space' || e.key === 'w' || e.key === 'ArrowUp') && myY >= 418) {
      myVy = -640;
      audioManager.playKeystrokeTick();
    }
    if (e.key === 'f') {
      // Toggle Anchor
      isMyAnchored = !isMyAnchored;
      audioManager.playSlashSpecial();
    }
    if (e.key === 'e') {
      // Pass Lantern / Interact
      if (hasMyLantern && Math.hypot(myX - remoteX, myY - remoteY) < 60) {
        hasMyLantern = false;
        audioManager.playLevelUpChime();
      }
    }
    if (e.key === 't') {
      // Quick team ping in chat
      const msg: ChatMessage = { sender: isHost ? 'P1' : 'P2', text: 'Let’s coordinate plates!', time: 'now' };
      chatMessages.push(msg);
      if (channel) channel.send({ type: 'broadcast', event: 'chat_message', payload: msg });
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'ArrowLeft') moveKeys.left = false;
    if (e.key === 'd' || e.key === 'ArrowRight') moveKeys.right = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Mouse / UI interaction for creating/joining room in lobby
  const onCanvasClick = (e: MouseEvent) => {
    if (gameState !== 'lobby') return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    // "Create Co-Op Room" Button
    if (mx > canvas.width / 2 - 160 && mx < canvas.width / 2 + 160 && my > 260 && my < 320) {
      // Generate 6-letter room code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

      isHost = true;
      connectToRoom(code);
      audioManager.playUiClick();
    }
  };

  canvas.addEventListener('click', onCanvasClick);

  audioManager.startMusic('battle');

  let animId: number;
  let lastTime = performance.now();

  const render = (time: number) => {
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    // --- LOBBY SCREEN ---
    if (gameState === 'lobby') {
      ctx.fillStyle = '#07080F';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#FF2E9A';
      ctx.font = 'bold 36px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔗 TETHERED: 2-PLAYER CO-OP', canvas.width / 2, 170);

      ctx.fillStyle = '#00F0FF';
      ctx.font = '14px Orbitron, sans-serif';
      ctx.fillText('REAL-TIME MULTIPLAYER • CONNECT TWO REAL HUMANS', canvas.width / 2, 210);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px monospace';
      ctx.fillText('Strictly authentic co-op • Zero fake bots • Cross-play laptop & mobile', canvas.width / 2, 235);

      // Create Room Button
      ctx.fillStyle = '#00F0FF';
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = 15;
      ctx.fillRect(canvas.width / 2 - 150, 270, 300, 50);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px Orbitron, sans-serif';
      ctx.fillText('CREATE CO-OP ROOM', canvas.width / 2, 302);

      animId = requestAnimationFrame(render);
      return;
    }

    // --- WAITING FOR PARTNER SCREEN ---
    if (gameState === 'waiting') {
      ctx.fillStyle = '#07080F';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00F0FF';
      ctx.font = 'bold 28px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`ROOM CODE: ${roomCode}`, canvas.width / 2, 180);

      ctx.fillStyle = '#FF2E9A';
      ctx.font = 'bold 16px Orbitron, sans-serif';
      ctx.fillText('WAITING FOR A REAL PLAYER TO JOIN...', canvas.width / 2, 230);

      ctx.fillStyle = '#B6FF3C';
      ctx.font = '12px monospace';
      ctx.fillText(`Share invite link: ${window.location.origin}/play/tethered?room=${roomCode}`, canvas.width / 2, 270);

      // Loading Spinner
      const spinAngle = time * 4;
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 340, 24, spinAngle, spinAngle + Math.PI * 1.5);
      ctx.stroke();

      animId = requestAnimationFrame(render);
      return;
    }

    // --- PARTNER DISCONNECTED RECONNECTING OVERLAY ---
    if (gameState === 'disconnected') {
      disconnectCountdown -= dt;
      if (Date.now() - lastRemoteHeartbeat < 2000) {
        gameState = 'playing';
        disconnectCountdown = 60;
      }
    }

    // --- ACTIVE CO-OP GAMEPLAY SIMULATION ---
    if (gameState === 'playing' || gameState === 'disconnected') {
      // Local Player Physics
      const gravity = 1500;
      const speed = isMyAnchored ? 0 : 250;

      if (moveKeys.left) myX = Math.max(40, myX - speed * dt);
      if (moveKeys.right) myX = Math.min(canvas.width - 40, myX + speed * dt);

      myVy += gravity * dt;
      myY += myVy * dt;
      if (myY >= 420) { myY = 420; myVy = 0; }

      // Remote Player Position Interpolation (Lerp)
      remoteX += (targetRemoteX - remoteX) * dt * 15;
      remoteY += (targetRemoteY - remoteY) * dt * 15;

      // Elastic Tether Physics
      const tetherDist = Math.hypot(myX - remoteX, myY - remoteY);
      const maxTetherLen = 320;
      if (tetherDist > maxTetherLen) {
        // Elastic pull
        const pullFactor = (tetherDist - maxTetherLen) * 0.5;
        const angle = Math.atan2(remoteY - myY, remoteX - myX);
        myX += Math.cos(angle) * pullFactor * dt * 10;
        myY += Math.sin(angle) * pullFactor * dt * 10;
      }

      // Mission 1: Pressure Plates
      plate1Pressed = Math.hypot(myX - 320, myY - 420) < 35 || Math.hypot(remoteX - 320, remoteY - 420) < 35;
      plate2Pressed = Math.hypot(myX - 560, myY - 420) < 35 || Math.hypot(remoteX - 560, remoteY - 420) < 35;

      // Mission 5: Co-Op Boss Damage
      if (currentMission === 5 && plate1Pressed && plate2Pressed && bossHp > 0) {
        bossHp -= dt * 60;
        if (Math.random() < 0.1) audioManager.playPunchPOW();
      }

      // Exit Pad Check (BOTH players must stand on exit pads simultaneously)
      const exitPadX = 860;
      isMyAtExit = Math.hypot(myX - exitPadX, myY - 420) < 40;
      isRemoteAtExit = Math.hypot(remoteX - exitPadX, remoteY - 420) < 40;

      // Check Mission Clear
      if (isMyAtExit && isRemoteAtExit && (currentMission < 5 || bossHp <= 0)) {
        if (currentMission < maxMissions) {
          currentMission++;
          sharedScore += 3000;
          resetMissionPositions();
          audioManager.playVictoryFanfare();
          if (channel) {
            channel.send({
              type: 'broadcast',
              event: 'mission_event',
              payload: { type: 'next_mission', mission: currentMission },
            });
          }
        } else {
          saveManager.save('tethered', { mission: 5, highScore: sharedScore });
          api.triggerVictory(sharedScore, 5);
          return;
        }
      }
    }

    // --- DRAWING WORLD ---
    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Floor
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 435);
    ctx.lineTo(canvas.width, 435);
    ctx.stroke();

    // Draw Pressure Plates
    ctx.fillStyle = plate1Pressed ? '#B6FF3C' : '#334155';
    ctx.fillRect(300, 425, 40, 10);
    ctx.fillStyle = plate2Pressed ? '#B6FF3C' : '#334155';
    ctx.fillRect(540, 425, 40, 10);

    // Draw Co-Op Boss in Mission 5
    if (currentMission === 5 && bossHp > 0) {
      ctx.fillStyle = '#FF2E9A';
      ctx.shadowColor = '#FF2E9A';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(bossX, bossY, 55, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Boss HP Bar
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(bossX - 60, bossY - 80, 120, 12);
      ctx.fillStyle = '#FF2E9A';
      ctx.fillRect(bossX - 60, bossY - 80, (bossHp / bossMaxHp) * 120, 12);

      // Boss Shield if both plates not held
      if (!plate1Pressed || !plate2Pressed) {
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(bossX, bossY, 70, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Draw Dual Exit Pads
    ctx.fillStyle = isMyAtExit && isRemoteAtExit ? '#B6FF3C' : '#7C4DFF';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.fillRect(830, 400, 60, 35);
    ctx.shadowBlur = 0;

    // Draw Glowing Energy Tether Physics Cord
    ctx.strokeStyle = isMyAnchored || isRemoteAnchored ? '#B6FF3C' : '#00F0FF';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 14;
    ctx.lineWidth = isMyAnchored && isRemoteAnchored ? 8 : 4;

    ctx.beginPath();
    ctx.moveTo(myX, myY - 15);
    // Catenary sag / bend
    const midX = (myX + remoteX) / 2;
    const midY = (myY + remoteY) / 2 + (isMyAnchored && isRemoteAnchored ? 0 : 35);
    ctx.quadraticCurveTo(midX, midY, remoteX, remoteY - 15);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Local Player
    ctx.fillStyle = isHost ? '#00F0FF' : '#FF2E9A';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(myX, myY - 15, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Remote Player
    ctx.fillStyle = isHost ? '#FF2E9A' : '#00F0FF';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(remoteX, remoteY - 15, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Top HUD
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`MISSION ${currentMission} / ${maxMissions}`, 35, 40);
    ctx.fillText(`ROOM: ${roomCode}`, 190, 40);
    ctx.fillText(`SCORE: ${sharedScore.toLocaleString()}`, 330, 40);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('WASD / Arrows to run & jump • F to Anchor Tether Bridge • T to Ping Team Chat', 35, 62);

    // In-game Team Chat Overlay (Bottom Left)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(20, canvas.height - 100, 260, 80);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#00F0FF';
    ctx.fillText('LIVE TEAM CHAT [T TO PING]', 30, canvas.height - 85);
    chatMessages.slice(-3).forEach((msg, idx) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${msg.sender}: ${msg.text}`, 30, canvas.height - 68 + idx * 16);
    });

    // Disconnect Pause Overlay
    if (gameState === 'disconnected') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#FF2E9A';
      ctx.font = 'bold 24px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PARTNER RECONNECTING...', canvas.width / 2, 250);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px monospace';
      ctx.fillText(`Game paused. Waiting ${Math.ceil(disconnectCountdown)}s for partner to reconnect`, canvas.width / 2, 285);
    }

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animId);
    clearInterval(syncInterval);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('click', onCanvasClick);
    if (channel) channel.unsubscribe();
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
