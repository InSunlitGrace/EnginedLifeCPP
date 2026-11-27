#!/bin/sh
# JavaScript speed baseline. usage: tools/jsref/bench.sh
run="node $(dirname "$0")/run.js --bench"
node --version
for seed in 1 2 3; do
    $run --seed $seed --cols 100 --rows 100 --ticks 50000
    $run --seed $seed --cols 500 --rows 500 --ticks 10000
    $run --seed $seed --cols 1000 --rows 1000 --ticks 3000
done
echo "life cycle only (no mutation), comparable after Part 2"
for seed in 1 2 3; do
    $run --seed $seed --cols 500 --rows 500 --ticks 10000 --no-mutation
done
