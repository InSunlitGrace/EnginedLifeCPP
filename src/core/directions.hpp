#pragma once
#include <array>
#include <cstdint>
#include "core/rng.hpp"

namespace le{

struct Offset{
    int c;
    int r;
    constexpr bool operator==(const Offset&) const=default;
};

enum class Direction:uint8_t{up,right,down,left};

inline constexpr std::array<Offset,4> kScalars={{{0,-1},{1,0},{0,1},{-1,0}}};

constexpr Offset scalar(Direction dir){return kScalars[static_cast<int>(dir)];}
constexpr Direction opposite(Direction dir){
    return static_cast<Direction>((static_cast<int>(dir)+2)&3);
}
constexpr Direction rotateRight(Direction dir){
    return static_cast<Direction>((static_cast<int>(dir)+1)&3);
}
// direction of something facing local inside a body turned to rotation
constexpr Direction combine(Direction rotation,Direction local){
    return static_cast<Direction>((static_cast<int>(rotation)+static_cast<int>(local))&3);
}
// a body offset after the organism is turned (BodyCell.rotatedCol/rotatedRow)
constexpr Offset rotate(Offset local,Direction rotation){
    switch(rotation){
        case Direction::up: return local;
        case Direction::right: return {-local.r,local.c};
        case Direction::down: return {-local.c,-local.r};
        case Direction::left: return {local.r,-local.c};
    }
    return local;
}

inline Direction randomDirection(Rng& rng){return static_cast<Direction>(rng.below(4));}
inline Offset randomScalar(Rng& rng){return kScalars[rng.below(4)];}

}
