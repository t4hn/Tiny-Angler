import React, { useState, useEffect, useRef } from 'react';
import { IndividualFishRecord } from '../types/fishing';
import { FishRenderer } from './FishRenderer';
import { Fish, Plus, Check, Sparkles, X, Info } from 'lucide-react';

interface AquariumViewProps {
  caughtFish: IndividualFishRecord[];
  onUpdateFishRecord: (record: IndividualFishRecord) => void;
}

interface TankFish {
  record: IndividualFishRecord;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tailPhase: number;
  scale: number;
  facing: number; // 1 or -1
}

interface Bubble {
  x: number;
  y: number;
  speed: number;
  radius: number;
  alpha: number;
}

export const AquariumView: React.FC<AquariumViewProps> = ({
  caughtFish,
  onUpdateFishRecord,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inspectedFish, setInspectedFish] = useState<IndividualFishRecord | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);

  // Filter which fish are assigned to aquarium
  const aquariumFishRecords = caughtFish.filter((f) => f.inAquarium);

  const tankFishRef = useRef<TankFish[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Initialize or synchronize tank swimmers
  useEffect(() => {
    const w = containerRef.current?.clientWidth || 800;
    const h = containerRef.current?.clientHeight || 420;

    // Preserve existing positions if possible
    const existingMap = new Map<string, TankFish>();
    tankFishRef.current.forEach((tf) => existingMap.set(tf.record.id, tf));

    tankFishRef.current = aquariumFishRecords.map((rec) => {
      if (existingMap.has(rec.id)) {
        const old = existingMap.get(rec.id)!;
        return { ...old, record: rec };
      }
      return {
        record: rec,
        x: 60 + Math.random() * (w - 120),
        y: 60 + Math.random() * (h - 120),
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 0.6,
        tailPhase: Math.random() * Math.PI * 2,
        scale: Math.max(0.65, Math.min(1.4, 0.65 + (rec.sizeCm / 45) * 0.6)),
        facing: Math.random() > 0.5 ? 1 : -1,
      };
    });
  }, [aquariumFishRecords]);

  // Main aquarium loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize bubbles
    if (bubblesRef.current.length === 0) {
      for (let i = 0; i < 20; i++) {
        bubblesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 0.5 + Math.random() * 1.5,
          radius: 1.5 + Math.random() * 3,
          alpha: 0.3 + Math.random() * 0.4,
        });
      }
    }

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw rising bubbles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const bubbles = bubblesRef.current;
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        b.y -= b.speed * 40 * dt;
        b.x += Math.sin(time * 0.002 + i) * 0.3;
        if (b.y < -10) {
          b.y = h + 10;
          b.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update fish positions
      tankFishRef.current.forEach((tf) => {
        tf.x += tf.vx * 50 * dt;
        tf.y += tf.vy * 30 * dt;
        tf.tailPhase += 4 * dt;

        // Bounce off walls gently
        if (tf.x < 50) {
          tf.vx = Math.abs(tf.vx);
          tf.facing = 1;
        } else if (tf.x > w - 50) {
          tf.vx = -Math.abs(tf.vx);
          tf.facing = -1;
        }

        if (tf.y < 40) {
          tf.vy = Math.abs(tf.vy);
        } else if (tf.y > h - 40) {
          tf.vy = -Math.abs(tf.vy);
        }

        // Random subtle drift changes
        if (Math.random() < 0.015) {
          tf.vy += (Math.random() - 0.5) * 0.4;
          tf.vy = Math.max(-0.8, Math.min(0.8, tf.vy));
        }
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Sync canvas size
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

  const formatSeq = (num: number) => `#${num.toString().padStart(3, '0')}`;

  return (
    <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Peaceful Sanctuary Aquarium
          </h2>
          <p className="text-xs text-slate-500">
            A tranquil underwater display where your chosen specimens live and swim peacefully together
          </p>
        </div>

        <button
          onClick={() => setShowManageModal(true)}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Fish className="w-3.5 h-3.5" />
          Manage Tank Inhabitants ({aquariumFishRecords.length})
        </button>
      </div>

      {/* Main Tank Viewport */}
      <div
        ref={containerRef}
        className="relative w-full h-[450px] overflow-hidden select-none"
        style={{
          background: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 60%, #0f172a 100%)',
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

        {/* Ambient Tank Decor (Aquatic Plants & River Stones) */}
        <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-5">
          {/* Sandy riverbed */}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-amber-200/40 backdrop-blur-xs border-t border-amber-300/40" />

          {/* Seaweed / Reeds */}
          <div className="absolute bottom-4 left-8 w-6 h-36 bg-emerald-700/70 rounded-full blur-[0.5px] transform -rotate-6" />
          <div className="absolute bottom-4 left-12 w-5 h-28 bg-emerald-600/70 rounded-full blur-[0.5px] transform rotate-12" />
          <div className="absolute bottom-4 right-14 w-7 h-40 bg-emerald-700/75 rounded-full blur-[0.5px] transform rotate-6" />
          <div className="absolute bottom-4 right-20 w-5 h-24 bg-emerald-600/70 rounded-full blur-[0.5px] transform -rotate-8" />
        </div>

        {/* Swimming Fish Objects */}
        {aquariumFishRecords.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 p-6 text-center z-20">
            <Fish className="w-12 h-12 text-white/50 mb-2" />
            <h3 className="text-lg font-bold">Your Aquarium is Quiet</h3>
            <p className="text-xs text-white/70 max-w-sm mt-1">
              Select fish from your Creel collection to place them in your peaceful aquarium tank!
            </p>
            <button
              onClick={() => setShowManageModal(true)}
              className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl text-xs font-semibold transition-all border border-white/20"
            >
              Add Fish to Tank
            </button>
          </div>
        ) : (
          tankFishRef.current.map((tf) => (
            <div
              key={tf.record.id}
              onClick={() => setInspectedFish(tf.record)}
              className="absolute z-15 cursor-pointer hover:scale-110 transition-transform group"
              style={{
                left: tf.x,
                top: tf.y,
                transform: `translate(-50%, -50%) scaleX(${tf.facing}) scale(${tf.scale})`,
              }}
            >
              <div className="relative">
                <FishRenderer
                  shape={tf.record.rarity === 'legendary' ? 'giant' : 'slender'}
                  variant={tf.record.variant}
                  palette={tf.record.palette}
                  mode="full"
                  tailAngle={Math.sin(tf.tailPhase) * 16}
                  width={75}
                  height={38}
                />
              </div>
            </div>
          ))
        )}

        {/* Clicked Fish Quick Info Card Overlay */}
        {inspectedFish && (
          <div className="absolute bottom-4 left-4 z-30 bg-slate-900/90 backdrop-blur-md text-white p-3.5 rounded-xl border border-white/15 shadow-xl max-w-xs flex items-start justify-between gap-3 animate-in fade-in">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <strong className="text-xs font-bold">
                  {inspectedFish.customNickname || inspectedFish.speciesName}
                </strong>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatSeq(inspectedFish.collectionNumber)}
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                {inspectedFish.sizeCm} cm · {inspectedFish.weightKg} kg · {inspectedFish.rarity}
              </div>
              <div className="text-[10px] text-sky-300">
                Caught at {inspectedFish.locationName}
              </div>
            </div>

            <button
              onClick={() => setInspectedFish(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Modal: Select which caught fish live in the Aquarium */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Aquarium Tank Inhabitants
              </h3>
              <button
                onClick={() => setShowManageModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Toggle any caught specimen to introduce them to your peaceful aquarium.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {caughtFish.map((fish) => {
                const inTank = fish.inAquarium;
                return (
                  <div
                    key={fish.id}
                    onClick={() => {
                      onUpdateFishRecord({ ...fish, inAquarium: !inTank });
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-colors ${
                      inTank
                        ? 'border-sky-400 bg-sky-50/70 text-sky-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FishRenderer
                        shape={fish.rarity === 'legendary' ? 'giant' : 'slender'}
                        variant={fish.variant}
                        palette={fish.palette}
                        mode="full"
                        width={36}
                        height={18}
                      />
                      <div>
                        <div className="font-semibold">
                          {fish.customNickname || fish.speciesName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {formatSeq(fish.collectionNumber)} · {fish.sizeCm} cm
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        inTank ? 'bg-sky-600 text-white' : 'border border-slate-300'
                      }`}
                    >
                      {inTank && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowManageModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
