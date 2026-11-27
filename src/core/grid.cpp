#include "core/grid.hpp"
#include <algorithm>
#include <stdexcept>
#include "core/hash.hpp"

namespace le{

void Grid::resize(int cols,int rows){
    if(cols<1||rows<1)
        throw std::invalid_argument("grid needs at least one column and one row");
    cols_=cols;
    rows_=rows;
    stride_=static_cast<size_t>(cols)+2;
    const size_t total=stride_*(static_cast<size_t>(rows)+2);
    type_.assign(total,CellType::border);
    owner_.assign(total,kNoOwner);
    cell_idx_.assign(total,0);
    fertility_.assign(total,kNeutralZone);
    mutation_.assign(total,kNeutralZone);
    fill(CellType::empty);
}

void Grid::fill(CellType type,bool keep_walls){
    for(int r=0;r<rows_;r++){
        const size_t start=index(0,r);
        for(size_t i=start;i<start+cols_;i++){
            if(keep_walls&&type_[i]==CellType::wall)
                continue;
            set(i,type);
        }
    }
}

uint32_t Grid::hash() const{
    Hash hash;
    hash.add(cols_);
    hash.add(rows_);
    // column by column, like the JavaScript grid
    for(int c=0;c<cols_;c++){
        for(int r=0;r<rows_;r++){
            const size_t i=index(c,r);
            hash.add(typeIndex(type_[i]));
            hash.add(static_cast<uint32_t>(fertility_[i]));
            hash.add(static_cast<uint32_t>(mutation_[i]));
        }
    }
    return hash.value();
}

}
