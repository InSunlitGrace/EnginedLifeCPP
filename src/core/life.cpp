// the life of an organism (reference/src/Organism/Organism.js)
// random numbers are drawn in the same order as the JavaScript, so keep statements in order
#include <algorithm>
#include "core/world.hpp"

namespace le{

int World::foodNeeded(const Organism& org) const{
    return org.bodySize()+(org.anatomy.isMover()?params_.extraMoverFoodCost:0);
}

bool World::update(uint32_t id){
    Organism& org=pool_[id];
    org.lifetime++;
    if(org.lifetime>org.bodySize()*params_.lifespanMultiplier){
        die(id);
        return false;
    }
    if(org.food_collected>=foodNeeded(org))
        reproduce(id);
    for(const auto& cell:org.anatomy.cells()){
        act(id,cell);
        if(!org.living)
            return false;
    }

    if(org.anatomy.isMover()){
        org.move_count++;
        const bool changed_direction=false; // the brain decides here from Part 3
        if(org.ignore_brain_for>0)
            org.ignore_brain_for--;
        const bool moved=attemptMove(id);
        if((org.move_count>org.move_range&&!changed_direction)||!moved){
            if(!attemptRotate(id)){
                org.direction=randomDirection(rng_);
                org.move_count=0;
                if(changed_direction)
                    org.ignore_brain_for=org.move_range+1;
            }
        }
    }
    return org.living;
}

void World::reproduce(uint32_t id){
    Organism& parent=pool_[id]; // stays valid: pool_ is a deque
    Organism& child=child_;
    child.reset(params_.rotationEnabled);
    child.inherit(parent);
    if(params_.rotationEnabled)
        child.rotation=randomDirection(rng_);

    double mutation_chance=parent.mutability;
    if(params_.useGlobalMutability)
        mutation_chance=params_.globalMutability;
    else if(rng_.next()<=0.5)
        child.mutability++;
    else
        child.mutability=std::max(child.mutability-1,1);
    if(params_.mutationZonesEnabled)
        mutation_chance*=grid_.mutation(grid_.index(parent.c,parent.r));

    bool mutated=false;
    if(rng_.next()*100<=mutation_chance){
        if(child.anatomy.isMover()&&rng_.next()*100<=10){
            // brains of sighted organisms mutate here from Part 3
            child.move_range=std::max(child.move_range+rng_.below(4)-2,1);
        }
        else
            mutated=mutate(child);
    }

    const Offset step=randomScalar(rng_);
    const int offset=rng_.below(3);
    const int distance=parent.anatomy.birthDistance()+offset;
    const int c=parent.c+step.c*distance;
    const int r=parent.r+step.r*distance;

    const int cost=foodNeeded(parent);
    if(isClear(child,kUnplaced,c,r,child.rotation)&&
       isStraightPath(c,r,parent.c,parent.r,kUnplaced,id)&&
       canAddOrganism()){
        child.c=c;
        child.r=r;
        const uint32_t born=addChild();
        if(mutated)
            pool_[born].species=species_.create(pool_[born].anatomy,ticks_,rng_);
        else
            species_.addMember(parent.species);
    }
    parent.food_collected-=cost;
}

bool World::mutate(Organism& org){
    Anatomy& body=org.anatomy;
    bool added=false;
    bool changed=false;
    bool removed=false;
    if(chance(params_.addProb)){
        const Offset branch=body.randomCell(rng_).local();
        const CellType type=types_.randomLiving(rng_);
        const Offset growth=kAllNeighbors[rng_.below(static_cast<int>(kAllNeighbors.size()))];
        const Offset at{branch.c+growth.c,branch.r+growth.r};
        if(body.canAddCellAt(at)){
            added=true;
            body.addRandomized(type,at,rng_);
        }
    }
    if(chance(params_.changeProb)){
        const Offset at=body.randomCell(rng_).local();
        const CellType type=types_.randomLiving(rng_);
        body.replaceRandomized(type,at,rng_);
        changed=true;
    }
    if(chance(params_.removeProb)){
        if(body.size()>1){
            const Offset at=body.randomCell(rng_).local();
            removed=body.remove(at);
        }
    }
    return added||changed||removed;
}

void World::die(uint32_t id){
    Organism& org=pool_[id];
    if(!org.living)
        return;
    org.living=false;
    for(const auto& cell:org.anatomy.cells()){
        const Offset at=rotate(cell.local(),org.rotation);
        changeCell(org.c+at.c,org.r+at.r,CellType::food);
    }
    species_.removeMember(org.species);
}

void World::draw(uint32_t id){
    const Organism& org=pool_[id];
    const auto& cells=org.anatomy.cells();
    for(size_t i=0;i<cells.size();i++){
        const Offset at=rotate(cells[i].local(),org.rotation);
        changeCell(org.c+at.c,org.r+at.r,cells[i].type,id,static_cast<uint16_t>(i));
    }
}

void World::erase(const Organism& org){
    for(const auto& cell:org.anatomy.cells()){
        const Offset at=rotate(cell.local(),org.rotation);
        changeCell(org.c+at.c,org.r+at.r,CellType::empty);
    }
}

bool World::isClear(const Organism& org,uint32_t id,int c,int r,Direction rotation) const{
    for(const auto& cell:org.anatomy.cells()){
        const Offset at=rotate(cell.local(),rotation);
        if(!grid_.inBounds(c+at.c,r+at.r))
            return false;
        const size_t i=grid_.index(c+at.c,r+at.r);
        const CellType type=grid_.type(i);
        if(grid_.owner(i)==id||type==CellType::empty||
           (!params_.foodBlocksReproduction&&type==CellType::food))
            continue;
        return false;
    }
    return true;
}

// the squares between two points on one row or column, excluding the higher end
bool World::isStraightPath(int c1,int r1,int c2,int r2,uint32_t child,uint32_t parent) const{
    const auto passable=[&](int c,int r){
        if(!grid_.inBounds(c,r))
            return false;
        const size_t i=grid_.index(c,r);
        const CellType type=grid_.type(i);
        const uint32_t owner=grid_.owner(i);
        return type==CellType::empty||owner==child||owner==parent||type==CellType::food;
    };
    if(c1==c2){
        for(int r=std::min(r1,r2);r!=std::max(r1,r2);r++){
            if(!passable(c1,r))
                return false;
        }
    }
    else{
        for(int c=std::min(c1,c2);c!=std::max(c1,c2);c++){
            if(!passable(c,r1))
                return false;
        }
    }
    return true;
}

bool World::attemptMove(uint32_t id){
    Organism& org=pool_[id];
    const Offset step=scalar(org.direction);
    const int c=org.c+step.c;
    const int r=org.r+step.r;
    if(!isClear(org,id,c,r,org.rotation))
        return false;
    erase(org);
    org.c=c;
    org.r=r;
    draw(id);
    return true;
}

bool World::attemptRotate(uint32_t id){
    Organism& org=pool_[id];
    if(!org.can_rotate){
        org.direction=randomDirection(rng_);
        org.move_count=0;
        return true;
    }
    const Direction rotation=randomDirection(rng_);
    if(!isClear(org,id,org.c,org.r,rotation))
        return false;
    erase(org);
    org.rotation=rotation;
    org.direction=randomDirection(rng_);
    draw(id);
    org.move_count=0;
    return true;
}

}
