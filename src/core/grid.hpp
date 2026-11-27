#pragma once
#include <cstddef>
#include <cstdint>
#include <vector>
#include "core/cells.hpp"
#include "core/directions.hpp"

namespace le{

inline constexpr uint32_t kNoOwner=0xFFFFFFFFu;

// zone multipliers are stored in hundredths, so 100 is neutral
inline constexpr uint16_t kNeutralZone=100;
inline constexpr uint16_t kMaxFertility=300;
inline constexpr uint16_t kMaxMutation=500;

// flat structure-of-arrays grid with a one-cell border of CellType::border.
// reading types is valid one step outside the grid, so rays and neighbour checks
// need no bounds test. anything further out needs inBounds first
class Grid{
public:
    Grid(int cols,int rows){resize(cols,rows);}

    // clears everything, including zones
    void resize(int cols,int rows);
    // clears cell types and owners. zones are kept
    void fill(CellType type,bool keep_walls=false);

    int cols() const{return cols_;}
    int rows() const{return rows_;}
    bool inBounds(int c,int r) const{
        return static_cast<unsigned>(c)<static_cast<unsigned>(cols_)&&
               static_cast<unsigned>(r)<static_cast<unsigned>(rows_);
    }
    Offset center() const{return {cols_/2,rows_/2};}

    // valid for -1<=c<=cols and -1<=r<=rows
    size_t index(int c,int r) const{
        return static_cast<size_t>(r+1)*stride_+static_cast<size_t>(c+1);
    }
    // add to an index to move by this offset
    ptrdiff_t step(Offset o) const{return static_cast<ptrdiff_t>(o.r)*static_cast<ptrdiff_t>(stride_)+o.c;}
    size_t size() const{return type_.size();}

    CellType type(size_t i) const{return type_[i];}
    uint32_t owner(size_t i) const{return owner_[i];}
    uint16_t cellIndex(size_t i) const{return cell_idx_[i];}
    void set(size_t i,CellType type,uint32_t owner=kNoOwner,uint16_t cell_idx=0){
        type_[i]=type;
        owner_[i]=owner;
        cell_idx_[i]=cell_idx;
    }

    double fertility(size_t i) const{return fertility_[i]/100.0;}
    double mutation(size_t i) const{return mutation_[i]/100.0;}
    uint16_t fertilityRaw(size_t i) const{return fertility_[i];}
    uint16_t mutationRaw(size_t i) const{return mutation_[i];}
    void setFertilityRaw(size_t i,uint16_t value){fertility_[i]=value;}
    void setMutationRaw(size_t i,uint16_t value){mutation_[i]=value;}

    // for uploading to the GPU later. includes the border
    const CellType* types() const{return type_.data();}

    // matches the grid hash printed by tools/jsref
    uint32_t hash() const;

private:
    int cols_=0;
    int rows_=0;
    size_t stride_=0;
    std::vector<CellType> type_;
    std::vector<uint32_t> owner_;
    std::vector<uint16_t> cell_idx_;
    std::vector<uint16_t> fertility_;
    std::vector<uint16_t> mutation_;
};

}
