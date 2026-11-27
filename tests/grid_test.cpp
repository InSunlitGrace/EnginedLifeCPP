#include <doctest/doctest.h>
#include <stdexcept>
#include "core/grid.hpp"

using le::CellType;

TEST_CASE("new grid is empty inside a border"){
    const le::Grid grid(4,3);
    for(int c=-1;c<=grid.cols();c++){
        for(int r=-1;r<=grid.rows();r++){
            const size_t i=grid.index(c,r);
            CHECK(grid.type(i)==(grid.inBounds(c,r)?CellType::empty:CellType::border));
            CHECK(grid.owner(i)==le::kNoOwner);
            CHECK(grid.fertility(i)==1.0);
        }
    }
    CHECK(grid.size()==6*5);
    CHECK(grid.center()==le::Offset{2,1});
}

TEST_CASE("index steps"){
    const le::Grid grid(10,8);
    CHECK(grid.index(3,4)+grid.step({-1,1})==grid.index(2,5));
    CHECK_FALSE(grid.inBounds(-1,0));
    CHECK_FALSE(grid.inBounds(10,0));
    CHECK_FALSE(grid.inBounds(0,8));
}

TEST_CASE("fill can keep walls and leaves zones"){
    le::Grid grid(3,3);
    const size_t wall=grid.index(0,0);
    const size_t body=grid.index(1,1);
    grid.set(wall,CellType::wall);
    grid.set(body,CellType::mouth,7,2);
    grid.setFertilityRaw(body,250);
    grid.fill(CellType::empty,true);
    CHECK(grid.type(wall)==CellType::wall);
    CHECK(grid.type(body)==CellType::empty);
    CHECK(grid.owner(body)==le::kNoOwner);
    CHECK(grid.cellIndex(body)==0);
    CHECK(grid.fertility(body)==2.5);
    grid.fill(CellType::empty);
    CHECK(grid.type(wall)==CellType::empty);
}

TEST_CASE("resize clears zones and rejects empty grids"){
    le::Grid grid(3,3);
    grid.setMutationRaw(grid.index(1,1),400);
    grid.resize(5,5);
    CHECK(grid.mutation(grid.index(1,1))==1.0);
    CHECK_THROWS_AS(grid.resize(0,5),std::invalid_argument);
}
