# Life Engine: C++ port plan (Ubuntu/Linux desktop app)

## How to use this file
One part per session. Start a session with this file, the repo (or only the files the part lists) and "Do Part N".
At the end of a part: tests pass, commit, tick the box and add notes under Status.
Source of truth: the JS game with all patches up to seasons-table.patch (about 5200 lines).

## Excluded: Sticky (honey) cell
Do not port the Sticky cell, glue bonds, group movement, `Glue.js` or the glue settings.
- Organisms always move and rotate on their own, as before glue was added.
- Parity: the Node harness removes `sticky` from both the living and the full cell-type lists, so random type picks match, and the C++ list keeps the same order without it (13 living types).
- Loading JS saves: drop sticky cells and ignore glue settings. Skip an organism with no cells left, and report what was dropped.

## Stack
| Need | Choice | Why |
|---|---|---|
| Language / build | C++20, CMake + Ninja | |
| Window, GPU | raylib (OpenGL) | small, simple on Linux |
| UI | Dear ImGui + rlImGui | floating, resizable, collapsible windows built in |
| Charts | ImPlot | fast live plots, ImGui tables beside them |
| Saves | nlohmann/json | reads the JS save files |
| Tests | doctest, plus JS parity | |

Pin every dependency to a release tag (FetchContent).

## Layout
    src/core/   simulation only, no raylib or ImGui
    src/app/    window, rendering, UI
    src/cli/    headless runner and benchmark
    tests/      unit tests, parity scripts

## Performance design (decide now, hard to retrofit)
- Grid: flat arrays indexed r*cols+c. `uint8_t type[]`, `uint32_t owner[]`, `uint16_t cellIdx[]`. Food age and zone values in separate arrays, so hot data stays small.
- A one-cell out-of-bounds border, so rays and neighbour checks need no bounds test. Body placement still checks bounds.
- Cells are plain structs dispatched by `switch` on an enum. No virtual calls or per-cell heap objects.
- Organisms live in a pool with a free list, referenced by index+generation. Update order is a separate list of indices; dead ones are removed in one compaction pass.
- Small bodies stored inline (about 8 cells), larger ones in pooled storage. No allocation inside a tick once warm.
- Skip passive cells (mover, armor) using a per-organism list of active cells, kept in body order.
- Rendering: upload cell types as a texture and colour them with a palette shader. Only changed rows are re-uploaded. Zones are a second texture. Camera does zoom and pan.
- Simulation on its own thread; the UI sends commands through a queue and reads a snapshot once per frame.
- Flags: `-O3 -march=native -flto -ffp-contract=off`, then profile-guided optimisation. No `-ffast-math` (it breaks parity). Drop `-march=native` for builds shared with other machines.

    struct CellRef{uint32_t org; uint16_t idx;};
    inline size_t at(int c,int r) const{return size_t(r+1)*(cols+2)+c+1;}

## Verification: parity with the JS
- Use the same mulberry32 generator and make random calls in exactly the JS order, including short-circuit cases.
- Node script and C++ CLI both print a hash every 100 ticks (grid types, organism positions, food, damage). Same seed and settings must match.
- Replicate order-dependent behaviour: organism order, body cell order, food rot's insertion order, species naming if it draws random numbers.
- Keep JS bugs during the port (move_range mutation biased downward, random generator layer 4 never spawning). Fix them afterwards, in both or behind a flag.
- Perlin maps: compare with a tolerance, or load them from a save, if the last digits differ.
- Faster changes that alter random call order (e.g. sampling when a producer next fires instead of rolling every tick) go behind a `fast mode` flag after parity is complete.

## Parts
Size: S fits a short session, M a normal one, L should be split if tokens are low.

- [ ] **0. Baseline (S)**: CMake skeleton; Node headless script that runs a seed, prints hashes and ticks/s. Record numbers for small and large grids.
      JS: WorldEnvironment, Random, Hyperparameters. Done: baseline numbers saved.
- [ ] **1. Foundations (S)**: RNG, grid, cell enum, directions, neighbours, hyperparameters struct.
      JS: Grid/, CellStates, Directions, Random. Done: unit tests; RNG matches JS.
- [ ] **2. Life cycle (L)**: organism pool, anatomy, mouth, producer, mover, eating, movement, rotation, reproduction, death, species counts.
      JS: Organism, Anatomy, BodyCell, RandomOrganismGenerator. Done: parity with mutation set to 0.
- [ ] **3. Original behaviour (M)**: killer, armor, eye, brain, all mutation.
      Mutation can pick any of the 13 types, so parity here restricts the type list to implemented ones in both programs.
- [ ] **4. Added cells A (M)**: healer, scavenger, parasite, kamikaze, transporter, kin rule.
- [ ] **5. Added cells B (S)**: drill and armor durability, regrower. Done: full-type parity.
- [ ] **6. World rules (M)**: food drop, rot, seasons (multiplier), meteors, fertility and mutation zones, Perlin.
      JS: WorldRules, ZoneMaps, Perlin. Done: parity with every rule on.
- [ ] **7. Data (M)**: fossil record, world/organism/controls save and load compatible with JS files.
- [ ] **8. Speed pass (M)**: perf profiling, memory layout, PGO, fast mode. Done: hashes unchanged in parity mode; speed compared with Part 0.
- [ ] **9. Window (M)**: raylib app, palette shader, zoom/pan, pause, speed, max-speed mode, simulation thread.
- [ ] **10. Controls (L)**: sidebar with all sections and per-cell rules, seed controls, brushes (shape, size, intensity), zone overlays, file dialogs.
- [ ] **11. Creature editor (M)**: floating window, any grid size, paint, rotate, brain table, load/save/drop.
- [ ] **12. Stats (M)**: population, species, mutation and organism-structure plots, plus the cell contribution table.
- [ ] **13. Release (S)**: icons, .desktop file, community creations, .deb through CPack or an AppImage.
- [ ] **14. Optional**: many headless worlds in parallel (easy, one per core). Multithreading one world (checkerboard chunks) is hard, changes results, and is worth it only if profiling shows a need.

## Setup on Ubuntu
    sudo apt install build-essential cmake ninja-build git libasound2-dev libx11-dev libxrandr-dev libxi-dev libgl1-mesa-dev libglu1-mesa-dev libxcursor-dev libxinerama-dev libwayland-dev libxkbcommon-dev

## Code style
No spaces around = + - * / in code.

## Status
(notes per finished part: commit, deviations, benchmark numbers)
