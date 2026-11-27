const CellStates=require("../CellStates");
const BodyCell=require("./BodyCell");
const Hyperparams=require("../../../Hyperparameters");
const Neighbors=require("../../../Grid/Neighbors");

class TransporterCell extends BodyCell{
    constructor(org,loc_col,loc_row){
        super(CellStates.transporter,org,loc_col,loc_row);
    }

    //at most one transfer per tick
    performFunction(){
        const env=this.org.env;
        const c=this.getRealCol();
        const r=this.getRealRow();
        for(const [dc,dr] of Neighbors.adjacent){
            const cell=env.grid_map.cellAt(c+dc,r+dr);
            if(cell!=null&&this.shareWith(cell.owner))
                return;
        }
    }

    shareWith(other){
        const mine=this.org;
        if(other==null||other==mine||!other.living||other.species!==mine.species)
            return false;
        const deficit=org=>org.foodNeeded()-org.food_collected;
        //one of them can already reproduce, so leave both alone
        if(deficit(mine)<=0||deficit(other)<=0)
            return false;

        //1. complete one organism's reproduction, using the smaller transfer
        const options=[[mine,other],[other,mine]]
            .filter(([from,to])=>from.food_collected>=deficit(to))
            .sort((a,b)=>deficit(a[1])-deficit(b[1]));
        if(options.length>0){
            const [from,to]=options[0];
            return this.move(from,to,deficit(to));
        }

        let from,to;
        if(Math.abs(mine.lifetime-other.lifetime)>=Hyperparams.transportAgeGap){
            //2. older to younger
            [from,to]=mine.lifetime>other.lifetime?[mine,other]:[other,mine];
        }
        else if(mine.damage!=other.damage){
            //3. more damaged to less damaged
            [from,to]=mine.damage>other.damage?[mine,other]:[other,mine];
        }
        else{
            return false;
        }
        return this.move(from,to,Math.min(Hyperparams.transportAmount,from.food_collected,deficit(to)));
    }

    move(from,to,amount){
        if(amount<=0)
            return false;
        from.food_collected-=amount;
        to.food_collected+=amount;
        return true;
    }
}

module.exports=TransporterCell;
