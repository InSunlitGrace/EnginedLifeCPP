#pragma once
#include <array>
#include <cstdint>
#include <string>
#include <vector>
#include "core/organism.hpp"

namespace le{

struct Species{
    std::string name;
    uint64_t serial=0; // creation order
    uint64_t start_tick=0;
    int population=0;
    int cumulative_population=0;
    std::array<int,kLivingTypes> cell_counts{};
};

// the living species. extinct ones are dropped and their slot reused
class SpeciesRegistry{
public:
    // draws one random number for the name, like the JavaScript
    uint32_t create(const Anatomy& anatomy,uint64_t tick,Rng& rng);
    void addMember(uint32_t id){
        slots_[id].population++;
        slots_[id].cumulative_population++;
    }
    // frees the species when its last member goes
    void removeMember(uint32_t id);
    void clear();

    // only valid for living species
    const Species& get(uint32_t id) const{return slots_[id];}
    int living() const{return static_cast<int>(slots_.size()-free_.size());}

private:
    std::vector<Species> slots_;
    std::vector<uint32_t> free_;
    uint64_t next_serial_=0;
};

// the first ten base-36 digits of value/2^32, as Math.random().toString(36).substr(2,10)
std::string speciesName(uint32_t value);

}
