// what each cell type does on its organism's turn (reference/src/Organism/Cell/BodyCells)
// Part 2 has mouth and producer. mover is passive. the rest do nothing yet
#include "core/world.hpp"

namespace le{

void World::act(uint32_t id,const BodyCell& cell){
    if(cell.type!=CellType::mouth&&cell.type!=CellType::producer)
        return;
    Organism& org=pool_[id];
    const Offset at=rotate(cell.local(),org.rotation);
    if(cell.type==CellType::mouth)
        eat(org,org.c+at.c,org.r+at.r);
    else
        produce(org,org.c+at.c,org.r+at.r);
}

// living bodies are always inside the grid, so neighbours are at worst on the border
void World::eat(Organism& org,int c,int r){
    const size_t center=grid_.index(c,r);
    for(const Offset o:neighbors(params_.edibleNeighbors)){
        const size_t i=center+grid_.step(o);
        if(grid_.type(i)==CellType::food){
            grid_.set(i,CellType::empty);
            org.food_collected++;
        }
    }
}

void World::produce(const Organism& org,int c,int r){
    if(org.anatomy.isMover()&&!params_.moversCanProduce)
        return;
    const auto around=neighbors(params_.growableNeighbors);
    const Offset o=around[rng_.below(static_cast<int>(around.size()))];
    const size_t i=grid_.index(c,r)+grid_.step(o);
    if(grid_.type(i)!=CellType::empty)
        return;
    double probability=params_.foodProdProb; // seasons apply here from Part 6
    if(params_.fertilityEnabled)
        probability*=grid_.fertility(i);
    if(chance(probability))
        grid_.set(i,CellType::food);
}

}
