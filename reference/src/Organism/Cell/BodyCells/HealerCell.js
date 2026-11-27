const CellStates=require("../CellStates");
const BodyCell=require("./BodyCell");
const Hyperparams=require("../../../Hyperparameters");

class HealerCell extends BodyCell{
    constructor(org,loc_col,loc_row){
        super(CellStates.healer,org,loc_col,loc_row);
    }

    performFunction(){
        if(this.org.damage>0&&Math.random()*100<Hyperparams.healProb)
            this.org.damage--;
    }
}

module.exports=HealerCell;
