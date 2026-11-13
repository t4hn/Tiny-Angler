import React, { useState, useMemo } from 'react';
import {
  IndividualFishRecord,
  FishSpeciesDefinition,
  RarityTier,
} from '../types/fishing';
import { FishRenderer } from './FishRenderer';
import {
  BookOpen,
  Fish,
  Trophy,
  Star,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  Calendar,
  Compass,
  Check,
} from 'lucide-react';

interface FishJournalProps {
  caughtFish: IndividualFishRecord[];
  catalogue: FishSpeciesDefinition[];
  onUpdateFishRecord: (record: IndividualFishRecord) => void;
  onOpenAquarium: () => void;
}

export const FishJournal: React.FC<FishJournalProps> = ({
  caughtFish,
  catalogue,
  onUpdateFishRecord,
  onOpenAquarium,
}) => {
  const [activeView, setActiveView] = useState<'creel' | 'field_guide'>('creel');
  const [selectedFish, setSelectedFish] = useState<IndividualFishRecord | null>(caughtFish[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'largest' | 'smallest' | 'number'>('newest');

  // Nickname editing state for inspected fish
  const [editNickname, setEditNickname] = useState('');

  // Keep inspected fish updated if caughtFish updates
  const inspectedFish = selectedFish || caughtFish[0] || null;

  // Field guide calculations: which species have been discovered
  const discoveredSpeciesIds = useMemo(() => {
    return new Set(caughtFish.map((f) => f.speciesId));
  }, [caughtFish]);

  const completionPercentage = useMemo(() => {
    if (catalogue.length === 0) return 0;
    return Math.round((discoveredSpeciesIds.size / catalogue.length) * 100);
  }, [discoveredSpeciesIds, catalogue]);

  // Filtered & sorted caught fish (Creel)
  const filteredCreel = useMemo(() => {
    return caughtFish
      .filter((fish) => {
        const matchesSearch =
          fish.speciesName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (fish.customNickname && fish.customNickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
          fish.locationName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRarity = rarityFilter === 'all' || fish.rarity === rarityFilter;
        return matchesSearch && matchesRarity;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.caughtAt).getTime() - new Date(a.caughtAt).getTime();
        if (sortBy === 'oldest') return new Date(a.caughtAt).getTime() - new Date(b.caughtAt).getTime();
        if (sortBy === 'largest') return b.sizeCm - a.sizeCm;
        if (sortBy === 'smallest') return a.sizeCm - b.sizeCm;
        if (sortBy === 'number') return a.collectionNumber - b.collectionNumber;
        return 0;
      });
  }, [caughtFish, searchQuery, rarityFilter, sortBy]);

  const handleSaveNickname = () => {
    if (!inspectedFish) return;
    const updated = {
      ...inspectedFish,
      customNickname: editNickname.trim() || undefined,
    };
    onUpdateFishRecord(updated);
    setSelectedFish(updated);
  };

  const handleToggleAquarium = () => {
    if (!inspectedFish) return;
    const updated = {
      ...inspectedFish,
      inAquarium: !inspectedFish.inAquarium,
    };
    onUpdateFishRecord(updated);
    setSelectedFish(updated);
  };

  const formatSeq = (num: number) => `#${num.toString().padStart(3, '0')}`;

  const rarityColorMap: Record<string, string> = {
    common: 'text-slate-700 bg-slate-100 border-slate-200',
    uncommon: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    rare: 'text-sky-700 bg-sky-50 border-sky-200',
    epic: 'text-purple-700 bg-purple-50 border-purple-200',
    legendary: 'text-amber-700 bg-amber-50 border-amber-200',
  };

  return (
    <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Header & Navigation */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Fish Collection & Field Journal
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{caughtFish.length} Individual Fish Collected</span>
            <span>·</span>
            <span>{discoveredSpeciesIds.size}/{catalogue.length} Species Discovered ({completionPercentage}%)</span>
          </div>
        </div>

        {/* View Switcher: Creel Log vs Field Guide */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveView('creel')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeView === 'creel' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Fish className="w-3.5 h-3.5" />
            Creel Catch Log ({caughtFish.length})
          </button>
          <button
            onClick={() => setActiveView('field_guide')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeView === 'field_guide' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Species Field Guide ({discoveredSpeciesIds.size}/{catalogue.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: CREEL (INDIVIDUAL FISH SPECIMENS) */}
      {activeView === 'creel' && (
        <div className="p-6">
          {caughtFish.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Fish className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Your Creel is Empty</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Cast your line into the pond and reel in your first fish to start building your unique collection!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Filter Controls & Fish List */}
              <div className="lg:col-span-7 space-y-4">
                {/* Search & Filter Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[140px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search species, nicknames..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>

                  <select
                    value={rarityFilter}
                    onChange={(e) => setRarityFilter(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="all">All Rarities</option>
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="largest">Largest Size</option>
                    <option value="smallest">Smallest Size</option>
                    <option value="number">Collection #</option>
                  </select>
                </div>

                {/* Individual Fish Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {filteredCreel.map((fish) => {
                    const isSelected = inspectedFish?.id === fish.id;
                    const rarityStyle = rarityColorMap[fish.rarity] || rarityColorMap.common;

                    return (
                      <div
                        key={fish.id}
                        onClick={() => {
                          setSelectedFish(fish);
                          setEditNickname(fish.customNickname || '');
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-slate-900 bg-slate-50/80 shadow-xs ring-1 ring-slate-900'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <FishRenderer
                            shape={fish.rarity === 'legendary' ? 'giant' : 'slender'}
                            variant={fish.variant}
                            palette={fish.palette}
                            mode="full"
                            width={42}
                            height={22}
                          />

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900">
                                {fish.customNickname || fish.speciesName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {formatSeq(fish.collectionNumber)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <span>{fish.sizeCm} cm</span>
                              <span>·</span>
                              <span>{fish.weightKg} kg</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${rarityStyle}`}>
                            {fish.rarity}
                          </span>
                          {fish.isLargest && (
                            <span className="text-[9px] font-semibold text-amber-600 flex items-center gap-0.5">
                              <Trophy className="w-2.5 h-2.5" /> Best
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Detailed Fish Passport Inspector */}
              <div className="lg:col-span-5 bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
                {inspectedFish ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                          Specimen Passport
                        </span>
                        <h3 className="text-base font-bold text-slate-900">
                          {inspectedFish.customNickname || inspectedFish.speciesName}
                        </h3>
                        {inspectedFish.customNickname && (
                          <div className="text-xs text-slate-500 italic">
                            Species: {inspectedFish.speciesName}
                          </div>
                        )}
                      </div>

                      <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs">
                        {formatSeq(inspectedFish.collectionNumber)}
                      </span>
                    </div>

                    {/* Fish Showcase */}
                    <div className="w-full h-32 bg-white rounded-xl border border-slate-200 flex items-center justify-center relative overflow-hidden shadow-2xs">
                      <FishRenderer
                        shape={inspectedFish.rarity === 'legendary' ? 'giant' : 'slender'}
                        variant={inspectedFish.variant}
                        palette={inspectedFish.palette}
                        mode="full"
                        width={120}
                        height={60}
                      />
                    </div>

                    {/* Details Table */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Rarity Tier</span>
                        <span className="font-semibold uppercase text-slate-800">
                          {inspectedFish.rarity}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Dimensions</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {inspectedFish.sizeCm} cm · {inspectedFish.weightKg} kg
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Color Variant</span>
                        <span className="font-medium text-slate-800 flex items-center gap-1">
                          {inspectedFish.variant !== 'Standard' && (
                            <Sparkles className="w-3 h-3 text-amber-500" />
                          )}
                          {inspectedFish.variant}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Habitat Caught</span>
                        <span className="text-slate-800 font-medium">
                          {inspectedFish.locationName}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Equipment Used</span>
                        <span className="text-slate-800">
                          {inspectedFish.rodUsed} ({inspectedFish.baitUsed})
                        </span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Date Logged</span>
                        <span className="text-slate-700 font-mono text-[11px]">
                          {new Date(inspectedFish.caughtAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Nickname & Aquarium controls */}
                    <div className="pt-2 space-y-2 border-t border-slate-200">
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 block mb-1">
                          Edit Nickname
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editNickname}
                            onChange={(e) => setEditNickname(e.target.value)}
                            placeholder="Name your fish..."
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                          />
                          <button
                            onClick={handleSaveNickname}
                            className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                          >
                            Save
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleToggleAquarium}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-2 ${
                          inspectedFish.inAquarium
                            ? 'bg-sky-50 border-sky-300 text-sky-800'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Fish className="w-3.5 h-3.5 text-sky-600" />
                        {inspectedFish.inAquarium ? 'Swimming in Aquarium (Click to Remove)' : 'Place in Aquarium'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Select a fish to inspect its passport
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: FIELD GUIDE (SPECIES CATALOGUE JOURNAL) */}
      {activeView === 'field_guide' && (
        <div className="p-6 space-y-6">
          {/* Progress bar banner */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm text-slate-900">
                Angler's Field Compendium
              </div>
              <div className="text-xs text-slate-500">
                Discover all species across the meadows, rivers, lakes and caves.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-48 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="font-mono text-xs font-bold text-slate-800">
                {discoveredSpeciesIds.size} / {catalogue.length} ({completionPercentage}%)
              </span>
            </div>
          </div>

          {/* Grid of All Species Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {catalogue.map((species) => {
              const isDiscovered = discoveredSpeciesIds.has(species.id);
              const caughtInstances = caughtFish.filter((f) => f.speciesId === species.id);
              const largest = caughtInstances.length > 0 ? Math.max(...caughtInstances.map((f) => f.sizeCm)) : null;

              return (
                <div
                  key={species.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isDiscovered
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : 'bg-slate-50/70 border-dashed border-slate-300 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {species.rarity}
                      </span>
                      {isDiscovered && (
                        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {caughtInstances.length} caught
                        </span>
                      )}
                    </div>

                    <div className="h-20 flex items-center justify-center bg-slate-50/80 rounded-lg">
                      <FishRenderer
                        shape={species.silhouetteShape}
                        palette={species.palette}
                        mode={isDiscovered ? 'full' : 'silhouette'}
                        width={80}
                        height={40}
                      />
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {isDiscovered ? species.name : 'Unknown Silhouette'}
                      </h4>
                      <p className="text-[11px] text-slate-500 italic">
                        {isDiscovered ? species.scientificName : '???'}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                        {isDiscovered ? species.description : 'Explore deeper waters to reveal this specimen.'}
                      </p>
                    </div>
                  </div>

                  {isDiscovered && largest && (
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
                      <span>Personal Best:</span>
                      <strong className="text-slate-900">{largest} cm</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
