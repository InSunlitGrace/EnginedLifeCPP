#include "core/organism.hpp"
#include <algorithm>
#include <cstdlib>
#include <utility>

namespace le{

void Anatomy::clear(){
    cells_.clear();
    birth_distance_=4;
    is_producer_=false;
    is_mover_=false;
    has_eyes_=false;
}

int Anatomy::find(Offset at) const{
    for(int i=0;i<size();i++){
        if(cells_[i].c==at.c&&cells_[i].r==at.r)
            return i;
    }
    return -1;
}

void Anatomy::noteType(CellType type){
    if(type==CellType::producer)
        is_producer_=true;
    else if(type==CellType::mover)
        is_mover_=true;
    else if(type==CellType::eye)
        has_eyes_=true;
}

void Anatomy::checkTypes(){
    is_producer_=false;
    is_mover_=false;
    has_eyes_=false;
    for(const auto& cell:cells_)
        noteType(cell.type);
}

void Anatomy::add(const BodyCell& cell){
    const int distance=std::max(std::abs(cell.r),std::abs(cell.c))*2+2;
    birth_distance_=std::max(birth_distance_,distance);
    noteType(cell.type);
    cells_.push_back(cell);
}

void Anatomy::addRandomized(CellType type,Offset at,Rng& rng){
    const Direction direction=type==CellType::eye?randomDirection(rng):Direction::up;
    add(type,at,direction);
}

bool Anatomy::remove(Offset at,bool allow_center){
    if(at.c==0&&at.r==0&&!allow_center)
        return false;
    const int i=find(at);
    if(i>=0)
        cells_.erase(cells_.begin()+i);
    checkTypes();
    return true;
}

void Organism::reset(bool rotation_enabled){
    Anatomy body=std::move(anatomy);
    body.clear();
    *this=Organism{};
    anatomy=std::move(body);
    can_rotate=rotation_enabled;
}

void Organism::inherit(const Organism& parent){
    move_range=parent.move_range;
    mutability=parent.mutability;
    species=parent.species;
    for(const auto& cell:parent.anatomy.cells())
        anatomy.add(cell);
}

}
