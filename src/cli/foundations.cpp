#include <cstdio>
#include <span>
#include "cli/commands.hpp"
#include "core/grid.hpp"
#include "core/neighbors.hpp"

namespace le::cli{
namespace{

void printOffsets(const char* name,std::span<const le::Offset> offsets){
    std::printf("%s",name);
    for(const auto& o:offsets)
        std::printf(" %d,%d",o.c,o.r);
    std::printf("\n");
}

// output must equal tools/jsref/foundations.js
void print(uint32_t seed){
    le::Rng rng(seed);
    const le::TypeLists lists;

    for(int n=0;n<1000;n++)
        std::printf("rng %u\n",rng.nextU32());
    for(int n=0;n<200;n++){
        const auto living=lists.randomLiving(rng);
        const auto any=lists.randomAny(rng);
        const int dir=static_cast<int>(le::randomDirection(rng));
        const auto step=le::randomScalar(rng);
        std::printf("pick %s %s %d %d,%d\n",le::cellName(living).data(),le::cellName(any).data(),dir,step.c,step.r);
    }

    printOffsets("all",le::neighbors(le::NeighborSet::all));
    printOffsets("adjacent",le::neighbors(le::NeighborSet::adjacent));
    printOffsets("corners",le::neighbors(le::NeighborSet::corners));
    printOffsets("allSelf",le::neighbors(le::NeighborSet::allSelf));
    printOffsets("range2",le::inRange(2));

    for(int d=0;d<4;d++){
        const auto dir=static_cast<le::Direction>(d);
        const auto turned=le::rotate({2,5},dir);
        std::printf("dir %d %d %d %d,%d\n",d,static_cast<int>(le::opposite(dir)),
            static_cast<int>(le::rotateRight(dir)),turned.c,turned.r);
    }

    le::Grid grid(37,23);
    for(int c=0;c<grid.cols();c++){
        for(int r=0;r<grid.rows();r++){
            const size_t i=grid.index(c,r);
            grid.set(i,lists.all(rng.below(lists.allCount())));
            grid.setFertilityRaw(i,static_cast<uint16_t>(rng.below(le::kMaxFertility+1)));
            grid.setMutationRaw(i,static_cast<uint16_t>(rng.below(le::kMaxMutation+1)));
        }
    }
    std::printf("grid %08x draws %llu\n",grid.hash(),static_cast<unsigned long long>(rng.draws()));
}

}

int foundations(const Args& args){
    if(args.size()>1)
        throw std::invalid_argument("foundations takes one optional seed");
    print(args.empty()?1:number<uint32_t>(args[0]));
    return 0;
}

}
