const CellStates = require("../CellStates");
const BodyCell = require("./BodyCell");
const Hyperparams = require("../../../Hyperparameters");
const WorldRules=require("../../../Environments/WorldRules");

class ProducerCell extends BodyCell{
    constructor(org, loc_col, loc_row){
        super(CellStates.producer, org, loc_col, loc_row);
        this.org.anatomy.is_producer = true;
    }

    performFunction() {
        if (this.org.anatomy.is_mover && !Hyperparams.moversCanProduce)
            return;
        var env = this.org.env;
        var real_c = this.getRealCol();
        var real_r = this.getRealRow();
        var loc = Hyperparams.growableNeighbors[Math.floor(Math.random() * Hyperparams.growableNeighbors.length)]
        var cell = env.grid_map.cellAt(real_c+loc[0], real_r+loc[1]);
        if (cell == null || cell.state != CellStates.empty)
            return;
        var prob=WorldRules.foodProdProb(env);
        if(Hyperparams.fertilityEnabled)
            prob*=cell.fertility;
        if (Math.random() * 100 < prob)
            env.changeCell(cell.col, cell.row, CellStates.food, null);
    }
}

module.exports = ProducerCell;
