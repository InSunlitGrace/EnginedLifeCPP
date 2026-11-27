# EnginedLifeCPP

C++ port of [The Life Engine](https://github.com/MaxRobinsonTheGreat/LifeEngine) by Max Robinson, with added features.

Licensed under GPL-3.0, see LICENSE.

## Build (Ubuntu)
    sudo apt install build-essential cmake ninja-build doctest-dev nodejs
    cmake --preset release
    cmake --build --preset release
    ctest --preset release

Headless run: `build/release/src/cli/le_cli run --types mouth,producer,mover --ticks 3000`

Node is only needed for the tests that compare against the JavaScript. See PORT_PLAN.md for progress.
