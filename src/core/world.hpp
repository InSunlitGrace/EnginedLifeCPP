#pragma once
#include <cstdint>
#include <deque>
#include <vector>
#include "core/grid.hpp"
#include "core/hyperparams.hpp"
#include "core/organism.hpp"
#include "core/species.hpp"

namespace le{

// one simulation. not thread safe: a single thread owns it
class World{
public:
    static constexpr int kMinSize=3;

    // starts empty. call originOfLife, or add organisms
    World(int cols,int rows,uint32_t seed,Hyperparams params={},TypeLists types={});

    void tick();
    // removes all life and food and starts the tick count again. walls stay unless asked
    void reset(bool reset_life=true,bool clear_walls=false);
    void originOfLife();

    // copies a prototype into the world as a new species. false if it does not fit
    bool spawn(const Organism& prototype);

    const Grid& grid() const{return grid_;}
    Hyperparams& params(){return params_;}
    const Hyperparams& params() const{return params_;}
    const SpeciesRegistry& species() const{return species_;}
    const Rng& rng() const{return rng_;}
    const TypeLists& types() const{return types_;}

    // in update order, including any that died since their last turn
    size_t population() const{return order_.size();}
    const Organism& organism(size_t n) const{return pool_[order_[n]];}

    uint64_t ticks() const{return ticks_;}
    int resets() const{return resets_;}
    int largestOrganism() const{return largest_;}
    double averageMutability() const;

    // matches the "life" hash printed by tools/jsref
    uint32_t lifeHash() const;

    // for editing the map. does not touch organisms, so only use it on cells without an owner
    void setCell(int c,int r,CellType type);

    bool auto_reset=true; // start again after extinction

private:
    // owner id of an organism that is not in the world yet
    static constexpr uint32_t kUnplaced=kNoOwner-1;

    void changeCell(int c,int r,CellType type,uint32_t owner=kNoOwner,uint16_t cell_idx=0){
        if(grid_.inBounds(c,r))
            grid_.set(grid_.index(c,r),type,owner,cell_idx);
    }
    // moves the organism in child_ into a slot and onto the grid
    uint32_t addChild();
    bool canAddOrganism() const;

    // life.cpp
    bool update(uint32_t id);
    void reproduce(uint32_t id);
    bool mutate(Organism& org);
    bool chance(double percent){return rng_.next()*100<percent;}
    void die(uint32_t id);
    void draw(uint32_t id);
    void erase(const Organism& org);
    bool isClear(const Organism& org,uint32_t id,int c,int r,Direction rotation) const;
    bool isStraightPath(int c1,int r1,int c2,int r2,uint32_t child,uint32_t parent) const;
    bool attemptMove(uint32_t id);
    bool attemptRotate(uint32_t id);
    int foodNeeded(const Organism& org) const;

    // behaviours.cpp
    void act(uint32_t id,const BodyCell& cell);
    void eat(Organism& org,int c,int r);
    void produce(const Organism& org,int c,int r);

    Grid grid_;
    Hyperparams params_;
    TypeLists types_;
    Rng rng_;
    SpeciesRegistry species_;

    std::deque<Organism> pool_; // a deque, so adding never moves existing organisms
    std::vector<uint32_t> free_;
    std::vector<uint32_t> order_;
    std::vector<uint32_t> dead_; // positions in order_, reused every tick
    Organism child_;

    uint64_t ticks_=0;
    int64_t total_mutability_=0;
    int largest_=0;
    int resets_=0;
};

}
