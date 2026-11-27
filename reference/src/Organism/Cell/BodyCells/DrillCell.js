const CellStates=require("../CellStates");
const BodyCell=require("./BodyCell");
const Hyperparams=require("../../../Hyperparameters");
const Neighbors=require("../../../Grid/Neighbors");

//wears down adjacent armor, and breaks after dealing enough damage
class DrillCell extends BodyCell{
    constructor(org,loc_col,loc_row){
        super(CellStates.drill,org,loc_col,loc_row);
        this.dealt=0;
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
            if(this.drill(env.grid_map.cellAt(c+dc,r+dr))){
                this.cooldown=Hyperparams.drillInterval;
                return;
            }
        }
    }

    drill(cell){
        if(cell==null||cell.state!=CellStates.armor)
            return false;
        const victim=cell.owner;
        if(victim==null||victim==this.org||!victim.living)
            return false;
        if(Hyperparams.kinRecognition&&victim.species===this.org.species)
            return false;
        const armor=cell.cell_owner;
        const amount=Math.max(0,Math.min(Hyperparams.drillDamage,
            Hyperparams.armorDurability-armor.wear,
            Hyperparams.drillBreakDamage-this.dealt));
        armor.wear+=amount;
        this.dealt+=amount;
        if(armor.wear>=Hyperparams.armorDurability)
            victim.loseCell(armor);
        if(this.dealt>=Hyperparams.drillBreakDamage)
            this.org.loseCell(this);
        return true;
    }
}

module.exports=DrillCell;
