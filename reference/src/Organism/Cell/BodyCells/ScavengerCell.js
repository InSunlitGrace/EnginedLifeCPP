const CellStates=require("../CellStates");
const BodyCell=require("./BodyCell");
const Hyperparams=require("../../../Hyperparameters");

//offsets exactly 2 steps away (Manhattan distance)
const REACH=[[0,-2],[1,-1],[2,0],[1,1],[0,2],[-1,1],[-2,0],[-1,-1]];

class ScavengerCell extends BodyCell{
    constructor(org,loc_col,loc_row){
        super(CellStates.scavenger,org,loc_col,loc_row);
    }

    performFunction(){
        if(Math.random()*100>=Hyperparams.scavengeProb)
            return;
        const env=this.org.env;
        const c=this.getRealCol();
        const r=this.getRealRow();
        const food=[];
        for(const [dc,dr] of REACH){
            const cell=env.grid_map.cellAt(c+dc,r+dr);
            if(cell!=null&&cell.state==CellStates.food)
                food.push(cell);
        }
        if(food.length==0)
            return;
        const target=food[Math.floor(Math.random()*food.length)];
        env.changeCell(target.col,target.row,CellStates.empty,null);
        this.org.food_collected++;
    }
}

module.exports=ScavengerCell;
