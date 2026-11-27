const CellStates=require("../CellStates");
const BodyCell=require("./BodyCell");
const Hyperparams=require("../../../Hyperparameters");
const Neighbors=require("../../../Grid/Neighbors");

class KamikazeCell extends BodyCell{
    constructor(org,loc_col,loc_row){
        super(CellStates.kamikaze,org,loc_col,loc_row);
    }

    blastArea(){
        const grid=this.org.env.grid_map;
        const c=this.getRealCol();
        const r=this.getRealRow();
        return Neighbors.inRange(Hyperparams.kamikazeRange)
            .map(([dc,dr])=>grid.cellAt(c+dc,r+dr))
            .filter(cell=>cell!=null);
    }

    //called by Organism.die()
    explode(){
        for(const cell of this.blastArea()){
            if(cell.owner==null||cell.owner==this.org||!cell.owner.living)
                continue;
            if(cell.state==CellStates.armor)
                continue;
            cell.owner.harm();
        }
    }

    //also called by Organism.die(), after every blast has done its damage
    destroyFood(){
        for(const cell of this.blastArea()){
            if(cell.state==CellStates.food)
                this.org.env.changeCell(cell.col,cell.row,CellStates.empty,null);
        }
    }
}

module.exports=KamikazeCell;
