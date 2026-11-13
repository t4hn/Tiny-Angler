import React, { useState, useEffect } from 'react';
import {
  FishSpeciesDefinition,
  RarityConfig,
  IndividualFishRecord,
  PlayerState,
  LocationId,
  FishVariant,
} from './types/fishing';
import {
  getStoredCatalogue,
  saveCatalogue,
  resetCatalogueToDefault,
  getStoredRarityConfig,
  saveRarityConfig,
  getStoredCaughtFish,
  saveCaughtFish,
  getStoredPlayerState,
  savePlayerState,
  createIndividualFishRecord,
} from './utils/storage';
import { sounds } from './utils/audio';
import { TopNavigation, NavTab } from './components/TopNavigation';
import { FishingPond } from './components/FishingPond';
import { CatchModal } from './components/CatchModal';
import { FishCatalogueEditor } from './components/FishCatalogueEditor';
import { FishJournal } from './components/FishJournal';
import { AquariumView } from './components/AquariumView';
import { FishingShop } from './components/FishingShop';
import { CatchPreviewModal } from './components/CatchPreviewModal';

export default function App() {
  // Navigation & Core State
  const [activeTab, setActiveTab] = useState<NavTab>('pond');
  const [currentLocationId, setCurrentLocationId] = useState<LocationId>('sunny_meadow');

  // Stored state
  const [catalogue, setCatalogue] = useState<FishSpeciesDefinition[]>(getStoredCatalogue);
  const [rarityConfig, setRarityConfig] = useState<RarityConfig>(getStoredRarityConfig);
  const [caughtFish, setCaughtFish] = useState<IndividualFishRecord[]>(getStoredCaughtFish);
  const [playerState, setPlayerState] = useState<PlayerState>(getStoredPlayerState);

  // Active Modals
  const [activeCatchData, setActiveCatchData] = useState<{
    record: IndividualFishRecord;
    isFirstCatch: boolean;
    isLargest: boolean;
    isSmallest: boolean;
    coinsEarned: number;
    baseSellValue: number;
  } | null>(null);

  const [previewFish, setPreviewFish] = useState<FishSpeciesDefinition | null>(null);

  // Audio mute sync
  useEffect(() => {
    sounds.setEnabled(playerState.soundEnabled);
  }, [playerState.soundEnabled]);

  // Persist catalogue changes
  const handleUpdateCatalogue = (newCatalogue: FishSpeciesDefinition[]) => {
    setCatalogue(newCatalogue);
    saveCatalogue(newCatalogue);
  };

  const handleResetCatalogue = () => {
    const res = resetCatalogueToDefault();
    setCatalogue(res);
  };

  // Persist rarity config changes
  const handleUpdateRarityConfig = (newConfig: RarityConfig) => {
    setRarityConfig(newConfig);
    saveRarityConfig(newConfig);
  };

  // Persist player state updates
  const handleUpdatePlayerState = (updater: (prev: PlayerState) => PlayerState) => {
    setPlayerState((prev) => {
      const next = updater(prev);
      savePlayerState(next);
      return next;
    });
  };

  const toggleSound = () => {
    handleUpdatePlayerState((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  // Handle a successful catch from the pond
  const handlePondCatch = (
    species: FishSpeciesDefinition,
    sizeCm: number,
    weightKg: number,
    variant: FishVariant
  ) => {
    // Generate individual fish record with consecutive collection #, record check, bonuses
    const { record, isFirstCatch, isLargest, isSmallest, coinsEarned } = createIndividualFishRecord(
      species,
      sizeCm,
      weightKg,
      variant,
      currentLocationId,
      playerState.currentRodId,
      playerState.currentBaitId,
      caughtFish
    );

    // If bait was consumed (non-infinite), decrement stock
    if (playerState.currentBaitId !== 'none') {
      handleUpdatePlayerState((prev) => {
        const currentCount = prev.baitInventory[prev.currentBaitId] || 0;
        const newCount = Math.max(0, currentCount - 1);
        const nextBaitId = newCount === 0 ? 'none' : prev.currentBaitId;
        return {
          ...prev,
          baitInventory: {
            ...prev.baitInventory,
            [prev.currentBaitId]: newCount,
          },
          currentBaitId: nextBaitId,
          totalCatches: prev.totalCatches + 1,
        };
      });
    } else {
      handleUpdatePlayerState((prev) => ({
        ...prev,
        totalCatches: prev.totalCatches + 1,
      }));
    }

    setActiveCatchData({
      record,
      isFirstCatch,
      isLargest,
      isSmallest,
      coinsEarned,
      baseSellValue: species.baseSellValue,
    });
  };

  // Keep fish in creel
  const handleKeepCatch = (record: IndividualFishRecord) => {
    const updatedList = [record, ...caughtFish];
    setCaughtFish(updatedList);
    saveCaughtFish(updatedList);

    if (activeCatchData && activeCatchData.coinsEarned > 0) {
      handleUpdatePlayerState((prev) => ({
        ...prev,
        coins: prev.coins + activeCatchData.coinsEarned,
      }));
    }

    setActiveCatchData(null);
  };

  // Sell fish for coins
  const handleSellCatch = (record: IndividualFishRecord, sellValue: number) => {
    // Even if sold, we still register the discovery if it was the first catch
    const totalAward = sellValue + (activeCatchData?.coinsEarned || 0);

    // Save record to collection history with sold flag or keep a ledger entry
    const updatedList = [record, ...caughtFish];
    setCaughtFish(updatedList);
    saveCaughtFish(updatedList);

    handleUpdatePlayerState((prev) => ({
      ...prev,
      coins: prev.coins + totalAward,
    }));

    setActiveCatchData(null);
  };

  // Update a single fish record (e.g. nickname, aquarium flag)
  const handleUpdateFishRecord = (updatedRecord: IndividualFishRecord) => {
    const updated = caughtFish.map((f) => (f.id === updatedRecord.id ? updatedRecord : f));
    setCaughtFish(updated);
    saveCaughtFish(updated);
  };

  // Catch preview from editor
  const handleEditorPreview = (fish: FishSpeciesDefinition) => {
    setPreviewFish(fish);
  };

  const handleSimulateCatchReveal = (
    species: FishSpeciesDefinition,
    sizeCm: number,
    weightKg: number,
    variant: FishVariant
  ) => {
    const { record, isFirstCatch, isLargest, isSmallest, coinsEarned } = createIndividualFishRecord(
      species,
      sizeCm,
      weightKg,
      variant,
      currentLocationId,
      playerState.currentRodId,
      playerState.currentBaitId,
      caughtFish
    );

    setActiveCatchData({
      record,
      isFirstCatch,
      isLargest,
      isSmallest,
      coinsEarned,
      baseSellValue: species.baseSellValue,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-sky-200">
      {/* Top Bar Contract compliant navigation */}
      <TopNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        coins={playerState.coins}
        soundEnabled={playerState.soundEnabled}
        onToggleSound={toggleSound}
        totalCatches={playerState.totalCatches}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center">
        {activeTab === 'pond' && (
          <FishingPond
            currentLocationId={currentLocationId}
            currentRodId={playerState.currentRodId}
            currentBaitId={playerState.currentBaitId}
            catalogue={catalogue}
            rarityConfig={rarityConfig}
            onCatch={handlePondCatch}
            onSelectLocation={(locId) => {
              if (playerState.unlockedLocations.includes(locId)) {
                setCurrentLocationId(locId);
              } else {
                setActiveTab('shop');
              }
            }}
          />
        )}

        {activeTab === 'collection' && (
          <FishJournal
            caughtFish={caughtFish}
            catalogue={catalogue}
            onUpdateFishRecord={handleUpdateFishRecord}
            onOpenAquarium={() => setActiveTab('aquarium')}
          />
        )}

        {activeTab === 'aquarium' && (
          <AquariumView
            caughtFish={caughtFish}
            onUpdateFishRecord={handleUpdateFishRecord}
          />
        )}

        {activeTab === 'shop' && (
          <FishingShop
            playerState={playerState}
            onUpdatePlayerState={handleUpdatePlayerState}
            onSelectLocation={(locId) => {
              setCurrentLocationId(locId);
              setActiveTab('pond');
            }}
          />
        )}

        {activeTab === 'editor' && (
          <FishCatalogueEditor
            catalogue={catalogue}
            rarityConfig={rarityConfig}
            onUpdateCatalogue={handleUpdateCatalogue}
            onUpdateRarityConfig={handleUpdateRarityConfig}
            onResetCatalogue={handleResetCatalogue}
            onPreviewCatch={handleEditorPreview}
          />
        )}
      </main>

      {/* Catch Celebration Reveal Modal */}
      <CatchModal
        catchData={activeCatchData}
        onKeep={handleKeepCatch}
        onSell={handleSellCatch}
        onClose={() => setActiveCatchData(null)}
      />

      {/* Catch Preview Modal from the Fish Editor */}
      <CatchPreviewModal
        fish={previewFish}
        onClose={() => setPreviewFish(null)}
        onSimulateCatchReveal={handleSimulateCatchReveal}
      />
    </div>
  );
}
