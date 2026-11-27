#include "core/species.hpp"

namespace le{

std::string speciesName(uint32_t value){
    static constexpr char kDigits[]="0123456789abcdefghijklmnopqrstuvwxyz";
    std::string name;
    uint64_t fraction=value;
    for(int n=0;n<10&&fraction!=0;n++){
        fraction*=36;
        name+=kDigits[fraction>>32];
        fraction&=0xFFFFFFFFu;
    }
    return name;
}

uint32_t SpeciesRegistry::create(const Anatomy& anatomy,uint64_t tick,Rng& rng){
    uint32_t id;
    if(free_.empty()){
        id=static_cast<uint32_t>(slots_.size());
        slots_.emplace_back();
    }
    else{
        id=free_.back();
        free_.pop_back();
    }
    Species& species=slots_[id];
    species.name=speciesName(rng.nextU32());
    species.serial=next_serial_++;
    species.start_tick=tick;
    species.population=1;
    species.cumulative_population=1;
    species.cell_counts.fill(0);
    for(const auto& cell:anatomy.cells())
        species.cell_counts[typeIndex(cell.type)-kFirstLiving]++;
    return id;
}

void SpeciesRegistry::removeMember(uint32_t id){
    if(--slots_[id].population<=0)
        free_.push_back(id);
}

void SpeciesRegistry::clear(){
    slots_.clear();
    free_.clear();
    next_serial_=0;
}

}
