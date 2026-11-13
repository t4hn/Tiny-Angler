# Tiny Angler: Gameplay Design v0.2

**Design direction:** Relaxed top-down fishing · Collection-driven progression

Tiny Angler is a cozy, top-down pixel-art fishing game where the player explores fishing spots, watches for fish silhouettes, taps to catch them, and builds a collection of individual fish.

The design principle is simple: **easy to play, exciting to discover, endlessly expandable.**

## 1. Core gameplay loop

1. **Choose a fishing spot.** Visit a pond, river or other unlocked location.
2. **Cast your line.** A bobber lands and the water settles.
3. **Spot a silhouette.** A fish appears underwater and swims around.
4. **Tap to catch.** Tap the fish before it swims away.
5. **Discover your catch.** Reveal the species, rarity, size and individual details.
6. **Grow your collection.** Keep your fish, earn rewards and work towards new discoveries.

A typical session should last five to fifteen minutes. Each session should offer several catches, a new discovery or meaningful progress towards a collection goal.

## 2. Fishing mechanics

### Silhouettes and catching

- Fish appear as distinct silhouettes beneath the water.
- Each fish has its own silhouette, movement speed and size.
- Fish move around within a reasonable area near the bobber.
- Each fish stays visible for a configurable amount of time.
- If the player does not tap it in time, it swims away.
- Another fish can appear afterwards.
- A successful tap triggers a splash, a catch animation and a reveal panel.
- Rare discoveries receive more dramatic effects.

### Relaxed play

- No lives or game-over screens.
- No loss of previously collected fish.
- No mandatory reaction-time challenges.
- Missed fish simply swim away.
- Short pauses between catches, with optional faster fishing later through upgrades.

The tension comes from wondering what a fish might be, not worrying about ruining the game.

## 3. Individual fish collection

The player collects actual individual fish, not just an unlocked picture of each species.

For example, three Bluegill might be recorded as:

- **Bluegill #001:** Small · 12 cm · First catch
- **Bluegill #002:** Large · 24 cm · Personal best
- **Golden Bluegill #003:** Medium · 18 cm · Unusual colouring · Rare variant

Each individual fish can have:

- A unique collection number and name.
- Species and rarity.
- Size and weight.
- Colour variant, if applicable.
- Date or location caught.
- A personal record flag, such as largest caught.
- A place in the player's aquarium or collection display.

These details are initially for flavour and collection value, not a complicated simulation. Later, size and variants could influence selling prices, achievements or other systems.

**Important rule:** catching duplicates never overwrites the original. Each fish gets its own entry.

## 4. Rarity system

The five base rarity tiers and example starting weights are:

| Rarity | Starting weight |
|---|---:|
| Common | 60% |
| Uncommon | 25% |
| Rare | 10% |
| Epic | 4% |
| Legendary | 1% |

These weights total 100% and are starting values for a global rarity roll, not guarantees about the chance of catching any particular species.

### Fish selection process

1. Determine which fish are eligible at the current location.
2. Apply habitat, time or other eligibility restrictions.
3. Roll the rarity tier using the configured weights.
4. Choose an eligible fish within that tier.
5. Apply individual properties, such as size and colour variation.

If a location has no eligible Legendary fish, a Legendary roll should resolve sensibly to an available tier rather than producing an impossible catch.

Rarity and species selection should remain separate. Adding many new Common fish should not automatically make Legendary catches less likely.

## 5. Full fish editor

The fish editor is a core feature. It should be possible to build and rebalance the game's fish catalogue without redesigning the gameplay.

### A. Fish catalogue

Manage all species in one searchable list.

- Add, edit, duplicate and remove fish definitions.
- Set the species name, description and sprite.
- Assign a rarity and one or more habitats.
- Enable or disable a fish without deleting its definition.

### B. Rarity and spawn rules

Control how frequently fish appear.

- Change the weight of every rarity tier.
- Set individual fish spawn weights within a tier.
- Define eligible locations and time conditions.
- Adjust minimum and maximum fish sizes.
- Preview the resulting probabilities.

### C. Fish behaviour

Control how each fish feels to catch.

- Silhouette and appearance.
- Swimming speed and movement pattern.
- How long it remains catchable.
- Size and colour variation ranges.
- Catch animation and special effects.

### D. Economy and rewards

Control what happens after a catch.

- Base sell value.
- First-discovery rewards.
- Optional bonuses for record catches.
- Whether a species contributes to location completion.

### Preview catch

The editor should include a **Preview Catch** feature. Select a fish and simulate its silhouette, catch reveal and collection entry. This makes testing new fish much easier.

**Data consistency rule:** changing a species definition should affect future catches, while fish already collected should remain individual records. Existing fish should not mysteriously change species because the catalogue was edited.

## 6. Progression and rewards

The game should reward three kinds of progress.

### Discovery

- New species fill out the fishing journal.
- Completing a species entry unlocks a badge or small reward.

### Personal records

- Catch the biggest fish of a species.
- Discover a colour variant.
- Find an unusually small specimen.

### Upgrades

- Better rods.
- Different bait.
- New fishing spots that introduce new possibilities, rather than simply increasing numbers.

For the first version, avoid hunger, energy, crafting trees, complex quests and a giant economy. Fishing and collecting should be fun before those systems arrive.

## 7. First playable milestone

The first version is complete when the player can:

- [ ] Cast into one top-down pond.
- [ ] See fish silhouettes appear and swim around.
- [ ] Tap to catch a fish before it swims away.
- [ ] Discover its species and rarity.
- [ ] Collect multiple individual fish, including duplicates.
- [ ] View the collection and personal records.
- [ ] Earn rewards and purchase one rod upgrade.
- [ ] Return later and find the collection intact.

The fish editor should allow the game designer to:

- [ ] Add, edit and disable fish definitions.
- [ ] Change rarity weights and individual fish spawn weights.
- [ ] Configure which fish appear at each location.
- [ ] Adjust movement, size and catch duration.
- [ ] Preview a fish and test its behaviour.

## 8. Expansion direction

Once the core mechanics feel good, potential additions include:

- More ponds and fishing locations.
- Aquariums and fish displays.
- Boats and new equipment.
- Weather and time-of-day conditions.
- Legendary fish and special variants.
- More collection goals and achievements.

These should be additions to a working game, not requirements that delay the first playable version.

## Design summary

**Tiny Angler's defining feature:** the fishing is simple, but the fish themselves form a deep, configurable collection system.

The foundation is a relaxed, top-down fishing game with readable silhouettes, a forgiving catch loop, individual fish records, configurable rarity and a full fish editor. It is designed to be enjoyable in short sessions and expandable over time.
