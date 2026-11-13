import React, { useState, useEffect, useRef } from 'react';
import { FishSpeciesDefinition, FishVariant } from '../types/fishing';
import { FishRenderer } from './FishRenderer';
import { sounds } from '../utils/audio';
import { Play, RotateCcw, X, Sparkles, Check } from 'lucide-react';

interface CatchPreviewModalProps {
  fish: FishSpeciesDefinition | null;
  onClose: () => void;
  onSimulateCatchReveal: (
    species: FishSpeciesDefinition,
    sizeCm: number,
    weightKg: number,
    variant: FishVariant
  ) => void;
}

export const CatchPreviewModal: React.FC<CatchPreviewModalProps> = ({
  fish,
  onClose,
  onSimulateCatchReveal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [posX, setPosX] = useState(200);
  const [posY, setPosY] = useState(130);
  const [targetX, setTargetX] = useState(240);
  const [targetY, setTargetY] = useState(150);
  const [angle, setAngle] = useState(0);
  const [tailPhase, setTailPhase] = useState(0);
  const [timeLeft, setTimeLeft] = useState(fish?.catchDurationSec || 8);
  const [caught, setCaught] = useState(false);
  const [fled, setFled] = useState(false);

  // Initialize test swim
  const restartTest = () => {
    if (!fish) return;
    setPosX(140 + Math.random() * 100);
    setPosY(90 + Math.random() * 80);
    setTargetX(200 + (Math.random() - 0.5) * 160);
    setTargetY(130 + (Math.random() - 0.5) * 100);
    setTimeLeft(fish.catchDurationSec);
    setCaught(false);
    setFled(false);
    sounds.playFishAppear();
  };

  useEffect(() => {
    restartTest();
  }, [fish]);

  // Swim loop
  useEffect(() => {
    if (!fish || caught || fled) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 0.05;
        if (next <= 0) {
          setFled(true);
          return 0;
        }
        return next;
      });

      // Update movement
      const speed = fish.swimSpeed * 1.8;
      const dx = targetX - posX;
      const dy = targetY - posY;
      const dist = Math.hypot(dx, dy);

      if (dist < 15) {
        setTargetX(Math.max(60, Math.min(360, 200 + (Math.random() - 0.5) * 220)));
        setTargetY(Math.max(40, Math.min(220, 130 + (Math.random() - 0.5) * 160)));
      } else {
        const step = Math.min(dist, speed * 2.5);
        setPosX((x) => x + (dx / dist) * step);
        setPosY((y) => y + (dy / dist) * step);
        const targetDeg = Math.atan2(dy, dx) * (180 / Math.PI);
        setAngle((a) => a + (targetDeg - a) * 0.15);
      }

      setTailPhase((p) => (p + 0.35) % (Math.PI * 2));
    }, 50);

    return () => clearInterval(interval);
  }, [fish, posX, posY, targetX, targetY, caught, fled]);

  if (!fish) return null;

  const handleTestCatch = () => {
    setCaught(true);
    sounds.playReel();
    sounds.playSplash();

    // Calculate sample size and weight for preview
    const sizeFactor = 0.5 + (Math.random() - 0.5) * 0.4;
    const sizeCm = parseFloat((fish.minSizeCm + (fish.maxSizeCm - fish.minSizeCm) * sizeFactor).toFixed(1));
    const baseKg = fish.weightRatio * sizeCm * 1.05;
    const weightKg = parseFloat(Math.max(0.05, baseKg).toFixed(2));

    // Sample variant roll
    let variant: FishVariant = 'Standard';
    if (Math.random() < fish.variantChance && fish.possibleVariants.length > 1) {
      const nonStd = fish.possibleVariants.filter((v) => v !== 'Standard');
      if (nonStd.length > 0) {
        variant = nonStd[Math.floor(Math.random() * nonStd.length)];
      }
    }

    setTimeout(() => {
      onClose();
      onSimulateCatchReveal(fish, sizeCm, weightKg, variant);
    }, 400);
  };

  const progressPct = Math.max(0, (timeLeft / fish.catchDurationSec) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-amber-600 fill-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">
              Catch Simulation: {fish.name}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Test the swimming speed, silhouette shape, and catch window. Tap the silhouette or button below to simulate reel-in!
        </p>

        {/* Mini Test Aquarium Pool */}
        <div
          ref={containerRef}
          className="relative w-full h-64 rounded-xl overflow-hidden cursor-pointer select-none border border-sky-300 shadow-inner"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #38bdf8 0%, #0284c7 90%)',
          }}
          onClick={handleTestCatch}
        >
          {/* Submerged silhouette */}
          {!caught && !fled && (
            <div
              className="absolute z-10 transition-transform duration-75 cursor-pointer hover:scale-105"
              style={{
                left: posX,
                top: posY,
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              }}
            >
              <FishRenderer
                shape={fish.silhouetteShape}
                mode="silhouette"
                tailAngle={Math.sin(tailPhase) * 14}
                width={80}
                height={40}
              />
            </div>
          )}

          {caught && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs text-white text-xs font-bold animate-in fade-in">
              Catch Registered! Launching Reveal Card...
            </div>
          )}

          {fled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs text-center p-4">
              The fish swam away! Click "Restart Test" to try again.
            </div>
          )}

          {/* Time bar */}
          <div className="absolute bottom-2 inset-x-3 h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-75"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="font-mono text-slate-600">
            Window: <strong>{timeLeft.toFixed(1)}s</strong> / {fish.catchDurationSec}s
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={restartTest}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              Restart
            </button>

            <button
              onClick={handleTestCatch}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              Simulate Catch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
