#pragma once
#include <cstdint>
#include <random>

namespace le{

// mulberry32, bit-for-bit the same stream as reference/src/Utils/Random.js
class Rng{
public:
    explicit Rng(uint32_t seed=0){setSeed(seed);}

    void setSeed(uint32_t seed){
        seed_=seed;
        restart();
    }
    void restart(){
        state_=seed_;
        draws_=0;
    }
    uint32_t seed() const{return seed_;}
    // values drawn since the last restart, to find where parity breaks
    uint64_t draws() const{return draws_;}

    uint32_t nextU32(){
        draws_++;
        state_+=0x6D2B79F5u;
        uint32_t t=state_;
        t=(t^(t>>15))*(t|1u);
        t^=t+(t^(t>>7))*(t|61u);
        return t^(t>>14);
    }
    // same value as Math.random(): [0,1)
    double next(){return nextU32()*(1.0/4294967296.0);}
    // Math.floor(Math.random()*n)
    int below(int n){return static_cast<int>(next()*n);}

    static uint32_t newSeed(){
        std::random_device device;
        return device();
    }

private:
    uint32_t seed_=0;
    uint32_t state_=0;
    uint64_t draws_=0;
};

}
