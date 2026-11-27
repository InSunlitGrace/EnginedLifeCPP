#include <doctest/doctest.h>
#include "core/rng.hpp"

TEST_CASE("rng restarts from its seed and counts draws"){
    le::Rng rng(42);
    const uint32_t first=rng.nextU32();
    rng.nextU32();
    CHECK(rng.draws()==2);
    rng.restart();
    CHECK(rng.draws()==0);
    CHECK(rng.nextU32()==first);
    CHECK(rng.seed()==42);
}

TEST_CASE("rng ranges"){
    le::Rng rng(7);
    for(int n=0;n<10000;n++){
        const double value=rng.next();
        CHECK((value>=0&&value<1));
        const int pick=rng.below(5);
        CHECK((pick>=0&&pick<5));
    }
}
