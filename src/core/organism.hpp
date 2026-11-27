#pragma once
#include <cstddef>
#include <cstdint>
#include <vector>
#include "core/cells.hpp"
#include "core/directions.hpp"

namespace le{

// one cell of a body, positioned relative to the organism's centre
struct BodyCell{
    CellType type=CellType::empty;
    Direction direction=Direction::up; // only eyes use it
    int16_t c=0;
    int16_t r=0;

    Offset local() const{return {c,r};}
};

// the body plan (reference/src/Organism/Anatomy.js). cell order matters: it is the update order
class Anatomy{
public:
    void clear();

    const std::vector<BodyCell>& cells() const{return cells_;}
    int size() const{return static_cast<int>(cells_.size());}
    bool isProducer() const{return is_producer_;}
    bool isMover() const{return is_mover_;}
    bool hasEyes() const{return has_eyes_;}
    // how far away offspring are placed. grows with the body and never shrinks
    int birthDistance() const{return birth_distance_;}

    bool canAddCellAt(Offset at) const{return find(at)<0;}
    // index of the cell at this offset, or -1
    int find(Offset at) const;

    // appends a cell. also used for inherited cells
    void add(const BodyCell& cell);
    void add(CellType type,Offset at,Direction direction=Direction::up){
        add({type,direction,static_cast<int16_t>(at.c),static_cast<int16_t>(at.r)});
    }
    // with random values, like addRandomizedCell
    void addRandomized(CellType type,Offset at,Rng& rng);
    // false only when refusing to remove the centre cell
    bool remove(Offset at,bool allow_center=false);
    void replaceRandomized(CellType type,Offset at,Rng& rng){
        remove(at,true);
        addRandomized(type,at,rng);
    }
    const BodyCell& randomCell(Rng& rng) const{return cells_[rng.below(size())];}

private:
    void noteType(CellType type);
    void checkTypes();

    std::vector<BodyCell> cells_;
    int birth_distance_=4;
    bool is_producer_=false;
    bool is_mover_=false;
    bool has_eyes_=false;
};

struct Organism{
    int c=0;
    int r=0;
    int lifetime=0;
    int food_collected=0;
    int damage=0;
    int move_count=0;
    int move_range=4;
    int ignore_brain_for=0;
    int mutability=5;
    Direction direction=Direction::down; // of movement
    Direction rotation=Direction::up;
    bool can_rotate=true;
    bool living=true;
    uint32_t species=0;
    Anatomy anatomy;

    // back to a newly made organism, keeping the body's memory for reuse
    void reset(bool rotation_enabled);
    // body and traits copied from the parent
    void inherit(const Organism& parent);

    int bodySize() const{return anatomy.size();}
};

}
