#pragma once
#include <cstdint>

namespace le{

// FNV-1a over 32-bit little-endian words, same as tools/jsref/common.js
class Hash{
public:
    void add(uint32_t word){
        for(int shift=0;shift<32;shift+=8){
            value_^=(word>>shift)&0xFFu;
            value_*=0x01000193u;
        }
    }
    void add(int word){add(static_cast<uint32_t>(word));}
    uint32_t value() const{return value_;}

private:
    uint32_t value_=0x811C9DC5u;
};

}
