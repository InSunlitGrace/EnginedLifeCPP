#include <doctest/doctest.h>
#include "core/cells.hpp"
#include "core/directions.hpp"
#include "core/hyperparams.hpp"

using le::CellType;
using le::Direction;

TEST_CASE("cell types"){
    CHECK(le::kLivingTypes==13);
    CHECK_FALSE(le::isLiving(CellType::wall));
    CHECK_FALSE(le::isLiving(CellType::border));
    CHECK(le::isLiving(CellType::regrower));
    for(int i=0;i<le::kCellTypes;i++){
        const auto type=static_cast<CellType>(i);
        CHECK(le::cellFromName(le::cellName(type))==type);
    }
    CHECK_FALSE(le::cellFromName("sticky").has_value());
}

TEST_CASE("restricted type lists keep the usual order"){
    le::TypeLists lists;
    lists.restrictTo({CellType::mover,CellType::mouth});
    CHECK(lists.livingCount()==2);
    CHECK(lists.allCount()==5);
    CHECK(lists.living(0)==CellType::mouth);
    CHECK(lists.living(1)==CellType::mover);
    CHECK(lists.all(2)==CellType::wall);
}

TEST_CASE("directions"){
    CHECK(le::opposite(Direction::left)==Direction::right);
    CHECK(le::rotateRight(Direction::left)==Direction::up);
    CHECK(le::combine(Direction::left,Direction::down)==Direction::right);
    // turning a point four quarter turns brings it back
    le::Offset o{2,5};
    for(int n=0;n<4;n++)
        o=le::rotate(o,Direction::right);
    CHECK(o==le::Offset{2,5});
}

TEST_CASE("hyperparameter defaults"){
    const le::Hyperparams params;
    CHECK(params.foodProdProb==5);
    CHECK(params.lifespanMultiplier==100);
    CHECK(params.seasons.size()==2);
    CHECK(le::neighbors(params.edibleNeighbors).size()==4);
}
