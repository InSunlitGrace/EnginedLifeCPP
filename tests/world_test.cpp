#include <doctest/doctest.h>
#include <stdexcept>
#include "core/world.hpp"

using le::CellType;

namespace{
// no random food or mutation, so each test controls what happens
le::Hyperparams quiet(){
    le::Hyperparams params;
    params.foodProdProb=0;
    params.useGlobalMutability=true;
    params.globalMutability=0;
    return params;
}
le::Organism single(CellType type,int c,int r){
    le::Organism org;
    org.c=c;
    org.r=r;
    org.anatomy.add(type,{0,0});
    return org;
}
}

TEST_CASE("origin of life"){
    le::World world(20,20,1);
    CHECK_THROWS_AS(le::World(2,20,1),std::invalid_argument);
    world.originOfLife();
    REQUIRE(world.population()==1);
    CHECK(world.organism(0).anatomy.size()==3);
    CHECK(world.organism(0).anatomy.birthDistance()==4);
    CHECK(world.species().living()==1);
    const auto& grid=world.grid();
    CHECK(grid.type(grid.index(10,10))==CellType::mouth);
    CHECK(grid.type(grid.index(11,11))==CellType::producer);
    CHECK(grid.owner(grid.index(9,9))!=le::kNoOwner);
}

TEST_CASE("spawn needs room"){
    le::World world(10,10,1,quiet());
    CHECK(world.spawn(single(CellType::mouth,2,2)));
    CHECK_FALSE(world.spawn(single(CellType::mouth,2,2)));
    CHECK_FALSE(world.spawn(single(CellType::mouth,10,2)));
    CHECK_FALSE(world.spawn(le::Organism{}));
    CHECK(world.population()==1);
}

TEST_CASE("a mouth eats adjacent food, not diagonal food"){
    le::World world(10,10,1,quiet());
    REQUIRE(world.spawn(single(CellType::mouth,5,5)));
    world.setCell(5,4,CellType::food);
    world.setCell(6,6,CellType::food);
    // one food is enough to reproduce a one-cell body, which then spends it next tick
    world.tick();
    CHECK(world.organism(0).food_collected==1);
    CHECK(world.grid().type(world.grid().index(5,4))==CellType::empty);
    CHECK(world.grid().type(world.grid().index(6,6))==CellType::food);
    world.tick();
    CHECK(world.organism(0).food_collected==0);
}

TEST_CASE("old age turns the body into food and ends the species"){
    auto params=quiet();
    params.lifespanMultiplier=2;
    le::World world(10,10,1,params);
    world.auto_reset=false;
    REQUIRE(world.spawn(single(CellType::mouth,5,5)));
    world.tick();
    world.tick();
    CHECK(world.population()==1);
    world.tick();
    CHECK(world.population()==0);
    CHECK(world.species().living()==0);
    CHECK(world.grid().type(world.grid().index(5,5))==CellType::food);
    CHECK(world.ticks()==3);
}

TEST_CASE("extinction starts life again and keeps walls"){
    auto params=quiet();
    params.lifespanMultiplier=1;
    le::World world(20,20,1,params);
    world.setCell(0,0,CellType::wall);
    REQUIRE(world.spawn(single(CellType::mouth,5,5)));
    world.tick();
    world.tick();
    CHECK(world.resets()==1);
    CHECK(world.ticks()==1);
    CHECK(world.population()==1);
    CHECK(world.grid().type(world.grid().index(0,0))==CellType::wall);
    world.reset(false,true);
    CHECK(world.population()==0);
    CHECK(world.grid().type(world.grid().index(0,0))==CellType::empty);
}

TEST_CASE("anatomy"){
    le::Anatomy body;
    body.add(CellType::mouth,{0,0});
    body.add(CellType::mover,{-3,1});
    CHECK(body.birthDistance()==8);
    CHECK(body.isMover());
    CHECK_FALSE(body.canAddCellAt({-3,1}));
    CHECK_FALSE(body.remove({0,0}));
    CHECK(body.remove({-3,1}));
    CHECK_FALSE(body.isMover());
    CHECK(body.birthDistance()==8);
}

TEST_CASE("species names match the JavaScript"){
    CHECK(le::speciesName(0)=="");
    CHECK(le::speciesName(2147483648u)=="i");
    CHECK(le::speciesName(1)=="000000i8u9");
    CHECK(le::speciesName(123456789)=="1193rfbvph");
    CHECK(le::speciesName(4294967295u)=="zzzzzzhr5q");
    CHECK(le::speciesName(3000000001u)=="p58u81nuph");
}
