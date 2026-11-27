#!/bin/sh
# speed baseline for the JavaScript, or for C++ when given its runner:
#   tools/jsref/bench.sh
#   tools/jsref/bench.sh "build/release/src/cli/le_cli run"
here=$(dirname "$0")
if [ $# -eq 0 ]; then
    node --version
    run="node $here/run.js --bench"
    echo "default settings (all cell types)"
    for seed in 1 2 3; do
        $run --seed $seed --cols 100 --rows 100 --ticks 50000
        $run --seed $seed --cols 500 --rows 500 --ticks 10000
        $run --seed $seed --cols 1000 --rows 1000 --ticks 3000
    done
else
    run="$1 --bench"
fi
echo "mouth, producer and mover"
for seed in 1 2 3; do
    $run --seed $seed --cols 200 --rows 200 --ticks 10000 --types mouth,producer,mover
    $run --seed $seed --cols 500 --rows 500 --ticks 5000 --types mouth,producer,mover
done
echo "life cycle only (no mutation)"
for seed in 1 2 3; do
    $run --seed $seed --cols 500 --rows 500 --ticks 10000 --no-mutation
done
