#pragma once
#include <array>
#include <cstdint>
#include <optional>
#include <string_view>
#include <vector>
#include "core/rng.hpp"

namespace le{

// same order as CellStates.all in the JavaScript, without sticky
enum class CellType:uint8_t{
    empty,food,wall,
    mouth,producer,mover,killer,armor,eye,healer,scavenger,parasite,kamikaze,transporter,drill,regrower,
    border // outside the grid, never a real cell
};

inline constexpr int kCellTypes=static_cast<int>(CellType::border);
inline constexpr int kFirstLiving=static_cast<int>(CellType::mouth);
inline constexpr int kLivingTypes=kCellTypes-kFirstLiving;

constexpr int typeIndex(CellType type){return static_cast<int>(type);}
constexpr bool isLiving(CellType type){
    return typeIndex(type)>=kFirstLiving&&typeIndex(type)<kCellTypes;
}

std::string_view cellName(CellType type);
std::optional<CellType> cellFromName(std::string_view name);

// the lists random picks are made from. restricted only for parity tests
class TypeLists{
public:
    TypeLists();
    // keeps empty, food, wall and the given living types, in their usual order
    void restrictTo(const std::vector<CellType>& living);

    int livingCount() const{return living_count_;}
    int allCount() const{return kFirstLiving+living_count_;}
    CellType living(int i) const{return all_[kFirstLiving+i];}
    CellType all(int i) const{return all_[i];}

    CellType randomLiving(Rng& rng) const{return living(rng.below(livingCount()));}
    // used by brain mutation (getRandomName)
    CellType randomAny(Rng& rng) const{return all(rng.below(allCount()));}

private:
    std::array<CellType,kCellTypes> all_{};
    int living_count_=0;
};

}
