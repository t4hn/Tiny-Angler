import React from 'react';
import { PlayerState, LocationId } from '../types/fishing';
import { RODS, BAITS } from '../data/equipment';
import { LOCATIONS } from '../data/locations';
import { sounds } from '../utils/audio';
import {
  Compass,
  Check,
  ShoppingBag,
  Sparkles,
  Zap,
  Coins,
  Lock,
} from 'lucide-react';

interface FishingShopProps {
  playerState: PlayerState;
  onUpdatePlayerState: (updater: (prev: PlayerState) => PlayerState) => void;
  onSelectLocation: (id: LocationId) => void;
}

export const FishingShop: React.FC<FishingShopProps> = ({
  playerState,
  onUpdatePlayerState,
  onSelectLocation,
}) => {
  const handleBuyRod = (rodId: string, price: number) => {
    if (playerState.coins < price) return;
    sounds.playCoin();
    onUpdatePlayerState((prev) => ({
      ...prev,
      coins: prev.coins - price,
      ownedRodIds: [...prev.ownedRodIds, rodId],
      currentRodId: rodId,
    }));
  };

  const handleEquipRod = (rodId: string) => {
    sounds.playCast();
    onUpdatePlayerState((prev) => ({
      ...prev,
      currentRodId: rodId,
    }));
  };

  const handleBuyBait = (baitId: string, price: number, count: number) => {
    if (playerState.coins < price) return;
    sounds.playCoin();
    onUpdatePlayerState((prev) => ({
      ...prev,
      coins: prev.coins - price,
      baitInventory: {
        ...prev.baitInventory,
        [baitId]: (prev.baitInventory[baitId] || 0) + count,
      },
      currentBaitId: baitId,
    }));
  };

  const handleEquipBait = (baitId: string) => {
    onUpdatePlayerState((prev) => ({
      ...prev,
      currentBaitId: baitId,
    }));
  };

  const handleUnlockLocation = (locId: LocationId, price: number) => {
    if (playerState.coins < price) return;
    sounds.playCoin();
    onUpdatePlayerState((prev) => ({
      ...prev,
      coins: prev.coins - price,
      unlockedLocations: [...prev.unlockedLocations, locId],
    }));
  };

  return (
    <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Old Marina Tackle & Supply
          </h2>
          <p className="text-xs text-slate-500">
            Upgrade your rods, stock up on fresh bait, and purchase permits to explore new fishing waters
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold text-amber-800 font-mono">
          <Coins className="w-4 h-4 text-amber-600" />
          <span>{playerState.coins} Coins</span>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* SECTION 1: FISHING RODS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Fishing Rods & Reels
              </h3>
              <p className="text-xs text-slate-500">
                Extends your catch reaction window and lures fish faster
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {RODS.map((rod) => {
              const isOwned = playerState.ownedRodIds.includes(rod.id);
              const isEquipped = playerState.currentRodId === rod.id;
              const canAfford = playerState.coins >= rod.price;

              return (
                <div
                  key={rod.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isEquipped
                      ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{rod.name}</span>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rod.color }} />
                    </div>

                    <p className="text-xs text-slate-600">{rod.description}</p>

                    <div className="space-y-1 pt-1 text-[11px] text-slate-600">
                      <div className="flex justify-between">
                        <span>Catch Window:</span>
                        <strong className="text-emerald-700">+{rod.catchWindowBonusSec}s</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Bite Speed:</span>
                        <strong className="text-sky-700">+{rod.biteSpeedBonus}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Rare Attract:</span>
                        <strong className="text-purple-700">+{rod.rareBonus}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100">
                    {isEquipped ? (
                      <div className="w-full py-1.5 text-center text-xs font-bold text-slate-800 bg-slate-200 rounded-lg flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Equipped
                      </div>
                    ) : isOwned ? (
                      <button
                        onClick={() => handleEquipRod(rod.id)}
                        className="w-full py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        Equip Rod
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyRod(rod.id, rod.price)}
                        disabled={!canAfford}
                        className={`w-full py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                          canAfford
                            ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Buy for {rod.price} Coins
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: BAIT & LURES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Baits & Attractants
              </h3>
              <p className="text-xs text-slate-500">
                Enhances bite speed, rare tier discovery, and variant probabilities
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BAITS.map((bait) => {
              const currentStock = playerState.baitInventory[bait.id] || 0;
              const isEquipped = playerState.currentBaitId === bait.id;
              const isUnlimited = bait.id === 'none';
              const canAfford = playerState.coins >= bait.price;

              return (
                <div
                  key={bait.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isEquipped
                      ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{bait.icon}</span>
                        <span className="font-bold text-xs text-slate-900">{bait.name}</span>
                      </div>
                      <span className="text-[11px] font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {isUnlimited ? '∞ in creel' : `${currentStock} in creel`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{bait.description}</p>

                    {!isUnlimited && (
                      <div className="space-y-1 pt-1 text-[11px] text-slate-600">
                        <div className="flex justify-between">
                          <span>Bite Speed Bonus:</span>
                          <strong className="text-sky-700">+{bait.biteSpeedBonus}%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Rare Chance Boost:</span>
                          <strong className="text-purple-700">+{bait.rareChanceBonus}%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Variant Discovery:</span>
                          <strong className="text-amber-700">+{bait.variantChanceBonus}%</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center gap-2">
                    {isEquipped ? (
                      <div className="flex-1 py-1.5 text-center text-xs font-bold text-slate-800 bg-slate-200 rounded-lg flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Hooked
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEquipBait(bait.id)}
                        disabled={!isUnlimited && currentStock <= 0}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          isUnlimited || currentStock > 0
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Equip
                      </button>
                    )}

                    {!isUnlimited && (
                      <button
                        onClick={() => handleBuyBait(bait.id, bait.price, bait.count)}
                        disabled={!canAfford}
                        className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                          canAfford
                            ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Buy {bait.count}x ({bait.price}c)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: EXPEDITION PERMITS (LOCATIONS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Expedition Water Permits
              </h3>
              <p className="text-xs text-slate-500">
                Unlock distinct biomes with exclusive fish species, water patterns, and legends
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LOCATIONS.map((loc) => {
              const isUnlocked = playerState.unlockedLocations.includes(loc.id);
              const canAfford = playerState.coins >= loc.unlockCost;

              return (
                <div
                  key={loc.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-sky-600" />
                        <span className="font-bold text-sm text-slate-900">{loc.name}</span>
                      </div>
                      {isUnlocked ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600">{loc.description}</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 italic">{loc.tagline}</span>

                    {isUnlocked ? (
                      <button
                        onClick={() => onSelectLocation(loc.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
                      >
                        Travel Here
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnlockLocation(loc.id, loc.unlockCost)}
                        disabled={!canAfford}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-xs'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Unlock ({loc.unlockCost} Coins)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
