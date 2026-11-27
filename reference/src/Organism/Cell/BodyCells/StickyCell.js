const CellStates=require("../CellStates");
const BodyCell=require("./BodyCell");
const Hyperparams=require("../../../Hyperparameters");
const Neighbors=require("../../../Grid/Neighbors");
const Glue=require("../../Glue");

//glues its organism to any organism it touches
class StickyCell extends BodyCell{
    constructor(org,loc_col,loc_row){
        super(CellStates.sticky,org,loc_col,loc_row);
    }

    performFunction(){
        if(Hyperparams.glueTimeout<=0)
            return;
        const env=this.org.env;
        const c=this.getRealCol();
        const r=this.getRealRow();
        for(const [dc,dr] of Neighbors.adjacent){
            const cell=env.grid_map.cellAt(c+dc,r+dr);
            const other=cell==null?null:cell.owner;
            if(other!=null&&other!=this.org&&other.living&&Glue.canBond(this.org,other))
                Glue.bond(this.org,other);
        }
    }
}

module.exports=StickyCell;
