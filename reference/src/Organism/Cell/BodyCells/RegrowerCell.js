const CellStates=require("../CellStates");
const BodyCell=require("./BodyCell");
const Hyperparams=require("../../../Hyperparameters");

//spends stored food to rebuild lost body cells
class RegrowerCell extends BodyCell{
    constructor(org,loc_col,loc_row){
        super(CellStates.regrower,org,loc_col,loc_row);
        this.cooldown=0;
    }

    performFunction(){
        if(this.cooldown>0){
            this.cooldown--;
            return;
        }
        if(this.org.food_collected<Hyperparams.regrowCost)
            return;
        if(this.org.regrowCell()){
            this.org.food_collected-=Hyperparams.regrowCost;
            this.cooldown=Hyperparams.regrowInterval;
        }
    }
}

module.exports=RegrowerCell;
