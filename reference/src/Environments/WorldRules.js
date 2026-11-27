const Hyperparams=require("../Hyperparameters");
const CellStates=require("../Organism/Cell/CellStates");
const Random=require("../Utils/Random");

//world-level rules: seasons, food rot and meteors
const WorldRules={
    //returns {index,season,ticks_left}, or null when seasons have no effect
    currentSeason(env){
        if(!Hyperparams.seasonsEnabled)
            return null;
        const total=Hyperparams.seasons.reduce((sum,s)=>sum+s.ticks,0);
        if(total<=0)
            return null;
        let t=env.total_ticks%total;
        for(let index=0;index<Hyperparams.seasons.length;index++){
            const season=Hyperparams.seasons[index];
            if(t<season.ticks)
                return {index,season,ticks_left:season.ticks-t};
            t-=season.ticks;
        }
        return null;
    },

    foodProdProb(env){
        const now=this.currentSeason(env);
        const base=Number(Hyperparams.foodProdProb);
        // a season scales the producer probability; a missing multiplier means 1x
        return now?base*(now.season.multiplier??1):base;
    },

    //food_ages is ordered oldest first, so stop at the first fresh item
    rotFood(env){
        if(!Hyperparams.foodRotEnabled)
            return;
        for(const [cell,born] of env.food_ages){
            if(env.total_ticks-born<Hyperparams.foodRotTicks)
                break;
            env.food_ages.delete(cell);
            if(cell.state==CellStates.food)
                env.changeCell(cell.col,cell.row,CellStates.empty,null);
        }
    },

    maybeMeteor(env){
        if(Hyperparams.meteorEnabled&&Math.random()<1/Hyperparams.meteorInterval)
            this.strikeMeteor(env);
    },

    //kills organisms and destroys food in a circle. walls survive
    strikeMeteor(env,col,row){
        const grid=env.grid_map;
        if(col===undefined){
            col=Math.floor(Math.random()*grid.cols);
            row=Math.floor(Math.random()*grid.rows);
        }
        const radius=Hyperparams.meteorRadius;
        const hit=[];
        for(let dc=-radius;dc<=radius;dc++){
            for(let dr=-radius;dr<=radius;dr++){
                const cell=grid.cellAt(col+dc,row+dr);
                if(cell!=null&&dc*dc+dr*dr<=radius*radius)
                    hit.push(cell);
            }
        }
        //dead organisms are removed from the list on the next tick
        for(const cell of hit){
            if(cell.owner!=null&&cell.owner.living)
                cell.owner.die();
        }
        for(const cell of hit){
            if(cell.state==CellStates.food)
                env.changeCell(cell.col,cell.row,CellStates.empty,null);
        }
    },
}

module.exports=WorldRules;
