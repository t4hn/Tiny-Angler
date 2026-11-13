import React, { useState, useEffect } from 'react';
import { IndividualFishRecord } from '../types/fishing';
import { FishRenderer } from './FishRenderer';
import { sounds } from '../utils/audio';
import { Trophy, Star, Sparkles, Check, DollarSign, X } from 'lucide-react';

interface CatchModalProps {
  catchData: {
    record: IndividualFishRecord;
    isFirstCatch: boolean;
    isLargest: boolean;
    isSmallest: boolean;
    coinsEarned: number;
    baseSellValue: number;
  } | null;
  onKeep: (record: IndividualFishRecord) => void;
  onSell: (record: IndividualFishRecord, sellValue: number) => void;
  onClose: () => void;
}

export const CatchModal: React.FC<CatchModalProps> = ({
  catchData,
  onKeep,
  onSell,
  onClose,
}) => {
  const [nickname, setNickname] = useState('');
  const [inAquarium, setInAquarium] = useState(false);

  useEffect(() => {
    if (catchData) {
      setNickname('');
      setInAquarium(false);
      sounds.playCatchRarityFanfare(catchData.record.rarity);
    }
  }, [catchData]);

  if (!catchData) return null;

  const { record, isFirstCatch, isLargest, isSmallest, coinsEarned, baseSellValue } = catchData;

  const rarityColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    common: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', glow: 'shadow-slate-300' },
    uncommon: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', glow: 'shadow-emerald-300' },
    rare: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-300', glow: 'shadow-sky-400' },
    epic: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300', glow: 'shadow-purple-400' },
    legendary: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', glow: 'shadow-amber-400' },
  };

  const style = rarityColors[record.rarity] || rarityColors.common;

  const handleKeep = () => {
    const updated = {
      ...record,
      customNickname: nickname.trim() || undefined,
      inAquarium,
    };
    onKeep(updated);
  };

  const handleSell = () => {
    sounds.playCoin();
    const updated = {
      ...record,
      customNickname: nickname.trim() || undefined,
    };
    onSell(updated, baseSellValue);
  };

  const formatSeq = (num: number) => `#${num.toString().padStart(3, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Rarity Header Banner */}
        <div className={`px-6 py-3.5 flex items-center justify-between border-b ${style.bg} ${style.border}`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>
              {record.rarity} Catch
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs font-mono font-medium text-slate-600">
              {formatSeq(record.collectionNumber)}
            </span>
          </div>

          {record.variant !== 'Standard' && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {record.variant} Variant
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Fish Stage Showcase with animated float */}
          <div className="relative w-full h-44 flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 rounded-xl border border-slate-200/80 mb-5 overflow-hidden">
            {/* Soft backdrop glow */}
            <div
              className={`absolute w-36 h-36 rounded-full blur-2xl opacity-40 ${
                record.rarity === 'legendary'
                  ? 'bg-amber-400'
                  : record.rarity === 'epic'
                  ? 'bg-purple-400'
                  : 'bg-sky-300'
              }`}
            />

            {/* Fish Vector Display */}
            <FishRenderer
              shape={record.rarity === 'legendary' ? 'giant' : 'slender'}
              variant={record.variant}
              palette={record.palette}
              mode="full"
              width={180}
              height={90}
              className="z-10 animate-pulse duration-1000"
            />
          </div>

          {/* Species Name & Titles */}
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {record.speciesName}
          </h2>
          <p className="text-xs text-slate-500 italic mb-4">
            Caught at {record.locationName}
          </p>

          {/* Metric Badges (Size & Weight) */}
          <div className="w-full grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                Length
              </div>
              <div className="text-lg font-bold text-slate-800 font-mono tabular-nums">
                {record.sizeCm} <span className="text-xs font-normal text-slate-500">cm</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                Weight
              </div>
              <div className="text-lg font-bold text-slate-800 font-mono tabular-nums">
                {record.weightKg} <span className="text-xs font-normal text-slate-500">kg</span>
              </div>
            </div>
          </div>

          {/* Personal Record & Discovery Milestones */}
          {(isFirstCatch || isLargest || isSmallest || coinsEarned > 0) && (
            <div className="w-full mb-4 flex flex-col gap-1.5 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-left text-xs">
              {isFirstCatch && (
                <div className="flex items-center justify-between text-amber-900 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>First Catch of this Species!</span>
                  </div>
                  <span className="font-bold text-amber-700 font-mono">+{coinsEarned} Coins</span>
                </div>
              )}
              {isLargest && !isFirstCatch && (
                <div className="flex items-center justify-between text-amber-900 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>New Personal Record: Largest!</span>
                  </div>
                  {coinsEarned > 0 && <span className="font-bold text-amber-700 font-mono">+{coinsEarned} Coins</span>}
                </div>
              )}
              {isSmallest && (
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Trophy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Personal Record: Smallest Specimen!</span>
                </div>
              )}
            </div>
          )}

          {/* Optional Nickname & Aquarium Checkbox */}
          <div className="w-full space-y-2 mb-5 text-left">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">
                Give this fish a nickname (optional):
              </label>
              <input
                type="text"
                placeholder={record.speciesName}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={24}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none pt-1">
              <input
                type="checkbox"
                checked={inAquarium}
                onChange={(e) => setInAquarium(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
              />
              <span>Display in my personal peaceful Aquarium</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center gap-3">
            <button
              onClick={handleSell}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Sell ({baseSellValue} coins)
            </button>

            <button
              onClick={handleKeep}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Keep & Collect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
