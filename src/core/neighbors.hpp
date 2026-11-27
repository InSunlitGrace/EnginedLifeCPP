#pragma once
#include <array>
#include <span>
#include <vector>
#include "core/directions.hpp"

namespace le{

// order matters: random picks index into these (reference/src/Grid/Neighbors.js)
inline constexpr std::array<Offset,8> kAllNeighbors={{{0,1},{0,-1},{1,0},{-1,0},{-1,-1},{1,1},{-1,1},{1,-1}}};
inline constexpr std::array<Offset,4> kAdjacent={{{0,1},{0,-1},{1,0},{-1,0}}};
inline constexpr std::array<Offset,4> kCorners={{{-1,-1},{1,1},{-1,1},{1,-1}}};
inline constexpr std::array<Offset,9> kAllSelf={{{0,0},{0,1},{0,-1},{1,0},{-1,0},{-1,-1},{1,1},{-1,1},{1,-1}}};

enum class NeighborSet:uint8_t{all,adjacent,corners,allSelf};

constexpr std::span<const Offset> neighbors(NeighborSet set){
    switch(set){
        case NeighborSet::all: return kAllNeighbors;
        case NeighborSet::adjacent: return kAdjacent;
        case NeighborSet::corners: return kCorners;
        case NeighborSet::allSelf: return kAllSelf;
    }
    return kAdjacent;
}

// square of side 2*range+1, column by column. build once, not inside a tick
inline std::vector<Offset> inRange(int range){
    std::vector<Offset> offsets;
    for(int i=-range;i<=range;i++){
        for(int j=-range;j<=range;j++)
            offsets.push_back({i,j});
    }
    return offsets;
}

}
