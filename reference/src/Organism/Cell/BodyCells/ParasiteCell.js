const CellStates=require("../CellStates");
const BodyCell=require("./BodyCell");
const Hyperparams=require("../../../Hyperparameters");
const Neighbors=require("../../../Grid/Neighbors");

class ParasiteCell extends BodyCell{
    constructor(org,loc_col,loc_row){
        super(CellStates.parasite,org,loc_col,loc_row);
        this.cooldown=0;
    }

    performFunction(){
        if(this.cooldown>0){
            this.cooldown--;
            return;
        }
        const env=this.org.env;
        const c=this.getRealCol();
        const r=this.getRealRow();
        for(const [dc,dr] of Neighbors.adjacent){
            if(this.stealFrom(env.grid_map.cellAt(c+dc,r+dr))){
                this.cooldown=Hyperparams.parasiteCooldown;
                return;
            }
        }
    }

    //returns true if any food was taken
    stealFrom(cell){
        if(cell==null||cell.owner==null||cell.owner==this.org||!cell.owner.living)
            return false;
        if(cell.state==CellStates.armor||cell.state==CellStates.killer)
            return false;
        const victim=cell.owner;
        if(Hyperparams.kinRecognition&&victim.species===this.org.species)
            return false;
        //rounded up, so a victim holding 1 food can still be robbed
        const amount=Math.ceil(victim.food_collected*Hyperparams.parasiteStealPercent/100);
        if(amount<=0)
            return false;
        victim.food_collected-=amount;
        this.org.food_collected+=amount;
        return true;
    }
}

module.exports=ParasiteCell;
