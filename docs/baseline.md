# Speed baseline (JavaScript)

Measured with `tools/jsref/bench.sh`: Node v22.23.5, headless, no rendering, sticky removed.
Machine: cloud container, 2 vCPUs, Intel Xeon 2.10GHz. Run the script on your own machine and add those numbers, because speeds are only comparable on the same hardware.

Population size drives the speed and differs between seeds, so compare only the same seed, size and tick count.
With parity, C++ simulates exactly the same populations. The 1000x1000 runs are short and cover only early growth.

## Default settings
| Grid | Seed | Ticks | Seconds | Ticks/s | M organism-updates/s | Organisms at end | Resets |
|---|---|---|---|---|---|---|---|
| 100x100 | 1 | 50000 | 9.47 | 5282 | 1.09 | 460 | 2 |
| 500x500 | 1 | 10000 | 86.09 | 116 | 0.45 | 3902 | 0 |
| 1000x1000 | 1 | 3000 | 1.73 | 1730 | 0.84 | 1764 | 0 |
| 100x100 | 2 | 50000 | 15.08 | 3315 | 0.92 | 225 | 1 |
| 500x500 | 2 | 10000 | 47.89 | 209 | 0.47 | 4174 | 0 |
| 1000x1000 | 2 | 3000 | 1.53 | 1966 | 0.92 | 2181 | 0 |
| 100x100 | 3 | 50000 | 14.75 | 3390 | 0.81 | 249 | 0 |
| 500x500 | 3 | 10000 | 23.78 | 421 | 0.59 | 2250 | 0 |
| 1000x1000 | 3 | 3000 | 0.73 | 4084 | 1.08 | 1076 | 0 |

## Life cycle only (`--no-mutation`), comparable after Part 2
| Grid | Seed | Ticks | Seconds | Ticks/s | M organism-updates/s | Organisms at end | Resets |
|---|---|---|---|---|---|---|---|
| 500x500 | 1 | 10000 | 5.24 | 1909 | 1.40 | 75 | 0 |
| 500x500 | 2 | 10000 | 5.75 | 1740 | 1.27 | 67 | 0 |
| 500x500 | 3 | 10000 | 4.97 | 2011 | 1.47 | 29 | 0 |
