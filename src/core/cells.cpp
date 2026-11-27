#include "core/cells.hpp"
#include <algorithm>

namespace le{

namespace{
constexpr std::array<std::string_view,kCellTypes> kNames={
    "empty","food","wall",
    "mouth","producer","mover","killer","armor","eye","healer","scavenger","parasite","kamikaze","transporter","drill","regrower"
};
}

std::string_view cellName(CellType type){
    return type==CellType::border?"border":kNames[typeIndex(type)];
}

std::optional<CellType> cellFromName(std::string_view name){
    for(int i=0;i<kCellTypes;i++){
        if(kNames[i]==name)
            return static_cast<CellType>(i);
    }
    return std::nullopt;
}

TypeLists::TypeLists():living_count_(kLivingTypes){
    for(int i=0;i<kCellTypes;i++)
        all_[i]=static_cast<CellType>(i);
}

void TypeLists::restrictTo(const std::vector<CellType>& living){
    *this=TypeLists();
    int count=0;
    for(int i=kFirstLiving;i<kCellTypes;i++){
        const auto type=static_cast<CellType>(i);
        if(std::find(living.begin(),living.end(),type)!=living.end())
            all_[kFirstLiving+count++]=type;
    }
    living_count_=count;
}

}
