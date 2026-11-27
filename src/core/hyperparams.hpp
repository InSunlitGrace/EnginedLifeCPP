#pragma once
#include <cstdint>
#include <vector>
#include "core/neighbors.hpp"

namespace le{

struct Season{
    int ticks;
    double multiplier;
};

// defaults from reference/src/Hyperparameters.js. glue settings are left out
// values the JavaScript UI can set to a fraction are doubles
struct Hyperparams{
    double lifespanMultiplier=100;
    double foodProdProb=5;
    double healProb=5;
    double scavengeProb=10;
    int parasiteStealPercent=50;
    int parasiteCooldown=20;
    int kamikazeRange=2;
    int armorDurability=10;
    int drillDamage=2;
    int drillInterval=5;
    int drillBreakDamage=30;
    int regrowCost=2;
    int regrowInterval=20;
    int transportAgeGap=40;
    int transportAmount=1;
    bool kinRecognition=false;
    bool foodRotEnabled=false;
    int foodRotTicks=500;
    bool seasonsEnabled=false;
    std::vector<Season> seasons={{1000,1.5},{1000,0.5}};
    bool meteorEnabled=false;
    int meteorInterval=2000;
    int meteorRadius=10;
    bool fertilityEnabled=false;
    bool mutationZonesEnabled=false;
    NeighborSet killableNeighbors=NeighborSet::adjacent;
    NeighborSet edibleNeighbors=NeighborSet::adjacent;
    NeighborSet growableNeighbors=NeighborSet::adjacent;

    bool useGlobalMutability=false;
    double globalMutability=5;
    double addProb=33;
    double changeProb=33;
    double removeProb=33;

    bool rotationEnabled=true;

    bool foodBlocksReproduction=true;
    bool moversCanProduce=false;

    bool instaKill=false;

    int lookRange=20;
    bool seeThroughSelf=false;

    double foodDropProb=0;

    int extraMoverFoodCost=0;

    int maxOrganisms=-1;
};

}
