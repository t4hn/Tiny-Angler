import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LocationId,
  FishSpeciesDefinition,
  RarityConfig,
  FishVariant,
  IndividualFishRecord,
} from '../types/fishing';
import { LOCATIONS } from '../data/locations';
import { RODS, BAITS } from '../data/equipment';
import { rollCatch } from '../utils/storage';
import { sounds } from '../utils/audio';
import { FishRenderer } from './FishRenderer';
import { Sparkles, Compass, HelpCircle } from 'lucide-react';

interface FishingPondProps {
  currentLocationId: LocationId;
  currentRodId: string;
  currentBaitId: string;
  catalogue: FishSpeciesDefinition[];
  rarityConfig: RarityConfig;
  onCatch: (
    species: FishSpeciesDefinition,
    sizeCm: number,
    weightKg: number,
    variant: FishVariant
  ) => void;
  onSelectLocation: (id: LocationId) => void;
}

interface FishInstance {
  species: FishSpeciesDefinition;
  sizeCm: number;
  weightKg: number;
  variant: FishVariant;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  angle: number;
  tailPhase: number;
  spawnTime: number;
  durationMs: number;
  maxDurationMs: number;
  scale: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export const FishingPond: React.FC<FishingPondProps> = ({
  currentLocationId,
  currentRodId,
  currentBaitId,
  catalogue,
  rarityConfig,
  onCatch,
  onSelectLocation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fishing state machine: 'idle' | 'casting' | 'waiting' | 'active_fish' | 'fled'
  const [fishState, setFishState] = useState<'idle' | 'casting' | 'waiting' | 'active_fish' | 'fled'>('idle');
  const [bobberPos, setBobberPos] = useState<{ x: number; y: number } | null>(null);
  const [activeFish, setActiveFish] = useState<FishInstance | null>(null);
  const [castMessage, setCastMessage] = useState<string>('Tap water to cast your line');

  const locationInfo = LOCATIONS.find((l) => l.id === currentLocationId) || LOCATIONS[0];
  const rodInfo = RODS.find((r) => r.id === currentRodId) || RODS[0];
  const baitInfo = BAITS.find((b) => b.id === currentBaitId) || BAITS[0];

  const ripplesRef = useRef<Ripple[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const nextRippleId = useRef<number>(0);
  const nextParticleId = useRef<number>(0);

  // Add water ripple
  const addRipple = useCallback((x: number, y: number, maxRadius = 45) => {
    ripplesRef.current.push({
      id: nextRippleId.current++,
      x,
      y,
      radius: 4,
      maxRadius,
      alpha: 0.8,
    });
  }, []);

  // Spawn water splash particles
  const spawnSplash = useCallback((x: number, y: number, color = '#ffffff') => {
    sounds.playSplash();
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 4.2;
      particlesRef.current.push({
        id: nextParticleId.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        color,
        alpha: 1,
        size: 2.5 + Math.random() * 3.5,
      });
    }
    // Also concentric ripples
    addRipple(x, y, 65);
    setTimeout(() => addRipple(x, y, 45), 100);
  }, [addRipple]);

  // Handle user casting line
  const handlePondClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // If fish is active, check if clicked on or near the fish
    if (fishState === 'active_fish' && activeFish) {
      const dist = Math.hypot(clickX - activeFish.x, clickY - activeFish.y);
      // Generous catch hit-box (radius of 70px)
      if (dist < 75) {
        handleCatchFish();
        return;
      }
    }

    // Otherwise, if idle or recast
    if (fishState === 'idle' || fishState === 'fled') {
      castLine(clickX, clickY);
    }
  };

  const castLine = (x: number, y: number) => {
    sounds.playCast();
    setFishState('casting');
    setBobberPos({ x, y });
    setCastMessage('Casting line...');

    // Bobber lands with splash
    setTimeout(() => {
      spawnSplash(x, y, '#e0f2fe');
      setFishState('waiting');
      setCastMessage('Line settled... watching for shadows');

      // Schedule fish appearance based on rod and bait
      const biteBonus = rodInfo.biteSpeedBonus + baitInfo.biteSpeedBonus;
      const delay = Math.max(1200, 3200 - biteBonus * 22);

      setTimeout(() => {
        spawnFishSilhouette(x, y);
      }, delay);
    }, 450);
  };

  const spawnFishSilhouette = (nearX: number, nearY: number) => {
    const rolled = rollCatch(currentLocationId, currentRodId, currentBaitId, catalogue, rarityConfig);
    if (!rolled) {
      setCastMessage('The water is still. Try another cast or check catalogue settings.');
      setFishState('idle');
      return;
    }

    sounds.playFishAppear();

    // Spawn fish at an offset from bobber
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = 90 + Math.random() * 80;
    const startX = Math.max(50, Math.min((containerRef.current?.clientWidth || 700) - 50, nearX + Math.cos(spawnAngle) * spawnDist));
    const startY = Math.max(50, Math.min((containerRef.current?.clientHeight || 450) - 50, nearY + Math.sin(spawnAngle) * spawnDist));

    const totalDurationSec = rolled.species.catchDurationSec + rodInfo.catchWindowBonusSec;
    const durationMs = totalDurationSec * 1000;

    // Relative size scaling
    const avgSize = (rolled.species.minSizeCm + rolled.species.maxSizeCm) / 2;
    const scale = Math.max(0.65, Math.min(1.7, 0.65 + (rolled.sizeCm / 45) * 0.7));

    const fishInstance: FishInstance = {
      species: rolled.species,
      sizeCm: rolled.sizeCm,
      weightKg: rolled.weightKg,
      variant: rolled.variant,
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      targetX: nearX + (Math.random() - 0.5) * 60,
      targetY: nearY + (Math.random() - 0.5) * 60,
      angle: Math.atan2(nearY - startY, nearX - startX) * (180 / Math.PI),
      tailPhase: 0,
      spawnTime: Date.now(),
      durationMs,
      maxDurationMs: durationMs,
      scale,
    };

    setActiveFish(fishInstance);
    setFishState('active_fish');
    setCastMessage('Silhouette spotted! Tap the fish to catch it!');
    addRipple(startX, startY, 40);
  };

  const handleCatchFish = () => {
    if (!activeFish || fishState !== 'active_fish') return;

    sounds.playReel();
    spawnSplash(activeFish.x, activeFish.y, activeFish.species.rarity === 'legendary' ? '#fde047' : '#ffffff');

    const caught = { ...activeFish };
    setActiveFish(null);
    setFishState('idle');
    setBobberPos(null);
    setCastMessage('Got one!');

    onCatch(caught.species, caught.sizeCm, caught.weightKg, caught.variant);
  };

  // Main canvas animation loop (ripples, water effects, particles)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Draw ambient water light dapples & subtle caustics
      const t = currentTime * 0.001;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 5; i++) {
        const cx = (w * (i + 1)) / 6 + Math.sin(t + i) * 30;
        const cy = (h * (i + 1)) / 6 + Math.cos(t * 0.8 + i) * 20;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 60 + Math.sin(t + i) * 15, 30 + Math.cos(t + i) * 10, i * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Update & draw ripples
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 28 * dt;
        r.alpha = Math.max(0, 1 - r.radius / r.maxRadius);

        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha * 0.55})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (r.radius >= r.maxRadius || r.alpha <= 0) {
          ripples.splice(i, 1);
        }
      }

      // Update & draw particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * 60 * dt;
        p.y += p.vy * 60 * dt;
        p.vy += 4.5 * dt; // gravity
        p.alpha -= 1.8 * dt;

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      // Draw fishing line from bottom right to bobber
      if (bobberPos && (fishState === 'waiting' || fishState === 'active_fish' || fishState === 'casting')) {
        const rodTipX = w - 40;
        const rodTipY = h - 20;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 2]);

        const controlX = (rodTipX + bobberPos.x) / 2 + 10;
        const controlY = Math.min(rodTipY, bobberPos.y) - 40;

        ctx.beginPath();
        ctx.moveTo(rodTipX, rodTipY);
        ctx.quadraticCurveTo(controlX, controlY, bobberPos.x, bobberPos.y);
        ctx.stroke();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [bobberPos, fishState]);

  // Handle active fish movement and countdown
  useEffect(() => {
    if (!activeFish || fishState !== 'active_fish') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - activeFish.spawnTime;
      const remaining = activeFish.maxDurationMs - elapsed;

      if (remaining <= 0) {
        // Fish slipped away!
        setFishState('fled');
        setCastMessage('The silhouette darted away into the deep... Cast again!');
        addRipple(activeFish.x, activeFish.y, 50);
        setActiveFish(null);
        setTimeout(() => {
          setFishState('idle');
          setBobberPos(null);
          setCastMessage('Tap water to cast your line');
        }, 2200);
        return;
      }

      // Update fish position toward target or wandering
      const speed = activeFish.species.swimSpeed * 1.5;
      const dx = activeFish.targetX - activeFish.x;
      const dy = activeFish.targetY - activeFish.y;
      const dist = Math.hypot(dx, dy);

      let newX = activeFish.x;
      let newY = activeFish.y;
      let newTargetX = activeFish.targetX;
      let newTargetY = activeFish.targetY;
      let newAngle = activeFish.angle;

      if (dist < 15) {
        // Pick new nearby target around bobber
        const boundsW = containerRef.current?.clientWidth || 700;
        const boundsH = containerRef.current?.clientHeight || 450;
        const center = bobberPos || { x: boundsW / 2, y: boundsH / 2 };
        newTargetX = Math.max(60, Math.min(boundsW - 60, center.x + (Math.random() - 0.5) * 160));
        newTargetY = Math.max(60, Math.min(boundsH - 60, center.y + (Math.random() - 0.5) * 140));
      } else {
        const moveStep = Math.min(dist, speed * 2.2);
        newX += (dx / dist) * moveStep;
        newY += (dy / dist) * moveStep;
        const targetDeg = Math.atan2(dy, dx) * (180 / Math.PI);
        // Smooth angle lerp
        newAngle = newAngle + (targetDeg - newAngle) * 0.15;
      }

      // Chance to spawn small wake ripple
      if (Math.random() < 0.12) {
        addRipple(newX, newY, 20);
      }

      setActiveFish((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          x: newX,
          y: newY,
          targetX: newTargetX,
          targetY: newTargetY,
          angle: newAngle,
          tailPhase: (prev.tailPhase + 0.35) % (Math.PI * 2),
          durationMs: remaining,
        };
      });
    }, 40);

    return () => clearInterval(interval);
  }, [activeFish, fishState, bobberPos, addRipple]);

  // Resize canvas to match container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const progressPercent = activeFish ? Math.max(0, (activeFish.durationMs / activeFish.maxDurationMs) * 100) : 0;

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Top Pond Toolbar: Location Switcher & Info */}
      <div className="w-full max-w-4xl flex items-center justify-between pb-3 px-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-800">{locationInfo.name}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-500">{locationInfo.tagline}</span>
        </div>

        {/* Location selector segmented control */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {LOCATIONS.map((loc) => {
            const isActive = loc.id === currentLocationId;
            return (
              <button
                key={loc.id}
                onClick={() => onSelectLocation(loc.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {loc.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Pond Interactive Viewport */}
      <div
        ref={containerRef}
        onClick={handlePondClick}
        className="relative w-full max-w-4xl h-[440px] md:h-[480px] rounded-2xl overflow-hidden cursor-crosshair shadow-lg select-none transition-colors duration-700 border border-slate-200/80"
        style={{
          background: `radial-gradient(ellipse at 50% 60%, ${locationInfo.waterColor} 0%, ${locationInfo.deepWaterColor} 90%)`,
        }}
      >
        {/* Canvas for ripples, particles, fishing line */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

        {/* Ambient Top-down scenery elements (Lily pads, rocks, weeds) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-85">
          {/* Lily Pad 1 */}
          <div className="absolute top-10 left-12 w-14 h-12 bg-emerald-600/80 rounded-full border border-emerald-400/50 shadow-sm transform -rotate-12">
            <div className="absolute top-0 right-3 w-4 h-5 bg-transparent border-r-2 border-emerald-700/60" />
            <div className="absolute top-2 left-3 w-2 h-2 rounded-full bg-pink-300/80" />
          </div>

          {/* Lily Pad 2 */}
          <div className="absolute bottom-16 right-20 w-16 h-14 bg-emerald-600/75 rounded-full border border-emerald-400/40 shadow-sm transform rotate-45">
            <div className="absolute top-2 left-4 w-3 h-3 rounded-full bg-white/90 shadow-xs" />
          </div>

          {/* Lily Pad 3 */}
          <div className="absolute top-24 right-16 w-11 h-10 bg-emerald-700/70 rounded-full border border-emerald-500/40 transform rotate-12" />

          {/* Smooth River Stones / Submerged Rocks */}
          <div className="absolute bottom-8 left-16 w-14 h-9 bg-slate-700/50 rounded-full blur-[0.5px]" />
          <div className="absolute bottom-6 left-28 w-9 h-7 bg-slate-600/40 rounded-full blur-[0.5px]" />
          <div className="absolute top-8 right-44 w-12 h-8 bg-slate-800/40 rounded-full blur-[0.5px]" />

          {/* Water light rays & ambient dust motes */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 pointer-events-none" />
        </div>

        {/* Floating Bobber */}
        {bobberPos && (
          <div
            className="absolute z-20 pointer-events-none transition-transform duration-100"
            style={{
              left: bobberPos.x,
              top: bobberPos.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Bobber graphic */}
            <div className="relative w-6 h-6 flex items-center justify-center animate-bounce">
              <div className="w-5 h-5 rounded-full bg-gradient-to-b from-rose-500 via-rose-500 to-white border border-rose-700 shadow-md flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              </div>
              <div className="absolute -top-2 w-1 h-3 bg-white rounded-t-sm shadow-xs" />
            </div>
          </div>
        )}

        {/* Swimming Fish Silhouette (Underwater) */}
        {activeFish && (
          <div
            className="absolute z-15 cursor-pointer transition-transform duration-75 group"
            style={{
              left: activeFish.x,
              top: activeFish.y,
              transform: `translate(-50%, -50%) rotate(${activeFish.angle}deg) scale(${activeFish.scale})`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleCatchFish();
            }}
          >
            {/* Target Catch Aura Indicator */}
            <div className="relative">
              {/* Fish SVG in Silhouette Mode with tail waggle */}
              <FishRenderer
                shape={activeFish.species.silhouetteShape}
                variant={activeFish.variant}
                mode="silhouette"
                tailAngle={Math.sin(activeFish.tailPhase) * 14}
                width={80}
                height={40}
                className="opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-lg"
              />

              {/* Gentle ripple wake behind fish */}
              <div
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-white/30 animate-ping opacity-60"
                style={{ animationDuration: '1.2s' }}
              />
            </div>
          </div>
        )}

        {/* Location & Status HUD inside canvas */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
          <div className="bg-slate-900/75 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl border border-white/10 shadow-sm flex items-center gap-2 text-xs">
            <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="font-semibold">{locationInfo.name}</span>
          </div>

          <div className="bg-black/50 backdrop-blur-sm text-slate-200 px-3 py-1 rounded-lg text-[11px] border border-white/5 flex items-center gap-2">
            <span>Rod: <strong className="text-white font-medium">{rodInfo.name}</strong></span>
            <span>·</span>
            <span>Bait: <strong className="text-white font-medium">{baitInfo.name}</strong></span>
          </div>
        </div>

        {/* Center Instructions Banner / Catch Cue */}
        <div className="absolute bottom-5 inset-x-0 flex flex-col items-center justify-center pointer-events-none z-20 px-4">
          <div className="bg-slate-900/85 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl border border-white/15 shadow-xl flex items-center gap-3">
            {fishState === 'active_fish' ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <span className="text-sm font-semibold text-amber-200">
                  Tap the swimming fish before it escapes!
                </span>
                <span className="text-xs text-slate-300 font-mono tabular-nums">
                  {((activeFish?.durationMs || 0) / 1000).toFixed(1)}s
                </span>
              </>
            ) : fishState === 'waiting' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
                <span className="text-xs text-sky-100">{castMessage}</span>
              </>
            ) : (
              <span className="text-xs text-slate-200">{castMessage}</span>
            )}
          </div>

          {/* Catch Time Progress Bar when fish is active */}
          {activeFish && (
            <div className="w-64 h-1.5 bg-slate-800/80 rounded-full mt-2 overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-full transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Big Tap to Hook & Reel Button for touch screens or easy accessibility */}
        {fishState === 'active_fish' && (
          <div className="absolute top-4 right-4 z-30 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCatchFish();
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-lg border border-amber-300 transition-all flex items-center gap-1.5 animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              HOOK & REEL!
            </button>
          </div>
        )}
      </div>

      {/* Relaxed hint beneath pond */}
      <div className="w-full max-w-4xl flex items-center justify-between pt-2.5 px-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>No rush or game overs. Tap any fish silhouette to reel in your catch.</span>
        </div>
        <div>
          <span>Duplicates get their own unique collection records!</span>
        </div>
      </div>
    </div>
  );
};
