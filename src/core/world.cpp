#include "core/world.hpp"
#include <algorithm>
#include <stdexcept>
#include <utility>
#include "core/hash.hpp"

namespace le{

World::World(int cols,int rows,uint32_t seed,Hyperparams params,TypeLists types):
    grid_(cols,rows),params_(std::move(params)),types_(types),rng_(seed){
    if(cols<kMinSize||rows<kMinSize)
        throw std::invalid_argument("the world needs at least 3 columns and 3 rows");
}

void World::originOfLife(){
    const Offset center=grid_.center();
    child_.reset(params_.rotationEnabled);
    child_.c=center.c;
    child_.r=center.r;
    child_.anatomy.add(CellType::mouth,{0,0});
    child_.anatomy.add(CellType::producer,{1,1});
    child_.anatomy.add(CellType::producer,{-1,-1});
    const uint32_t id=addChild();
    pool_[id].species=species_.create(pool_[id].anatomy,ticks_,rng_);
}

bool World::spawn(const Organism& prototype){
    if(prototype.anatomy.size()==0||
       !isClear(prototype,kUnplaced,prototype.c,prototype.r,prototype.rotation))
        return false;
    child_=prototype;
    child_.living=true;
    const uint32_t id=addChild();
    pool_[id].species=species_.create(pool_[id].anatomy,ticks_,rng_);
    return true;
}

uint32_t World::addChild(){
    uint32_t id;
    if(free_.empty()){
        id=static_cast<uint32_t>(pool_.size());
        pool_.emplace_back();
    }
    else{
        id=free_.back();
        free_.pop_back();
    }
    // swapping keeps both bodies' memory in use
    std::swap(pool_[id],child_);
    const Organism& org=pool_[id];
    draw(id);
    total_mutability_+=org.mutability;
    order_.push_back(id);
    largest_=std::max(largest_,org.anatomy.size());
    return id;
}

bool World::canAddOrganism() const{
    return params_.maxOrganisms<0||order_.size()<static_cast<size_t>(params_.maxOrganisms);
}

void World::tick(){
    // newborns are appended behind this count, so they wait for the next tick
    const size_t count=order_.size();
    dead_.clear();
    for(size_t n=0;n<count;n++){
        const uint32_t id=order_[n];
        if(!pool_[id].living||!update(id))
            dead_.push_back(static_cast<uint32_t>(n));
    }

    if(!dead_.empty()){
        // one pass that closes the gaps and keeps the order
        size_t next_dead=0;
        size_t write=dead_[0];
        for(size_t read=write;read<order_.size();read++){
            const uint32_t id=order_[read];
            if(next_dead<dead_.size()&&dead_[next_dead]==read){
                next_dead++;
                total_mutability_-=pool_[id].mutability;
                free_.push_back(id);
            }
            else
                order_[write++]=id;
        }
        order_.resize(write);
        if(order_.empty()&&auto_reset){
            resets_++;
            reset();
        }
    }
    ticks_++;
}

void World::reset(bool reset_life,bool clear_walls){
    order_.clear();
    free_.clear();
    pool_.clear();
    species_.clear();
    grid_.fill(CellType::empty,!clear_walls);
    total_mutability_=0;
    ticks_=0;
    if(reset_life)
        originOfLife();
}

void World::setCell(int c,int r,CellType type){
    changeCell(c,r,type);
}

double World::averageMutability() const{
    if(order_.empty())
        return 0;
    if(params_.useGlobalMutability)
        return params_.globalMutability;
    return static_cast<double>(total_mutability_)/static_cast<double>(order_.size());
}

uint32_t World::lifeHash() const{
    Hash hash;
    hash.add(static_cast<uint32_t>(ticks_));
    hash.add(static_cast<uint32_t>(order_.size()));
    for(const uint32_t id:order_){
        const Organism& org=pool_[id];
        for(const int value:{org.c,org.r,org.lifetime,org.food_collected,org.damage,
                static_cast<int>(org.rotation),static_cast<int>(org.direction),
                org.move_count,org.move_range,org.mutability,org.anatomy.size()})
            hash.add(value);
        for(const auto& cell:org.anatomy.cells()){
            hash.add(typeIndex(cell.type));
            hash.add(static_cast<int>(cell.c));
            hash.add(static_cast<int>(cell.r));
            hash.add(static_cast<int>(cell.direction));
        }
    }
    return hash.value();
}

}
