const CellStates = require("./Cell/CellStates");
const Neighbors = require("../Grid/Neighbors");
const Hyperparams = require("../Hyperparameters");
const Directions = require("./Directions");
const Anatomy = require("./Anatomy");
const Brain = require("./Perception/Brain");
const FossilRecord = require("../Stats/FossilRecord");
const SerializeHelper = require("../Utils/SerializeHelper");
const Glue=require("./Glue");
let next_uid=0;

class Organism {
    constructor(col, row, env, parent=null) {
        this.c = col;
        this.r = row;
        this.env = env;
        this.lifetime = 0;
        this.food_collected = 0;
        this.living = true;
        this.anatomy = new Anatomy(this)
        this.direction = Directions.down; // direction of movement
        this.rotation = Directions.up; // direction of rotation
        this.can_rotate = Hyperparams.rotationEnabled;
        this.move_count = 0;
        this.move_range = 4;
        this.ignore_brain_for = 0;
        this.mutability = 5;
        this.damage = 0;
        this.brain = new Brain(this);
        this.uid=next_uid++;
        this.lost_cells=[]; //body cells that broke off and can be regrown
        this.bonds=new Map();
        if (parent != null) {
            this.inherit(parent);
        }
    }

    inherit(parent) {
        this.move_range = parent.move_range;
        this.mutability = parent.mutability;
        this.species = parent.species;
        //offspring get the full body, including cells the parent has lost
        for (var c of [...parent.anatomy.cells,...parent.lost_cells]){
            //deep copy parent cells
            this.anatomy.addInheritCell(c);
        }
        if(parent.anatomy.is_mover && parent.anatomy.has_eyes) {
            this.brain.copy(parent.brain);
        }
    }

    // amount of food required before it can reproduce
    foodNeeded() {
        return this.anatomy.is_mover ? this.bodySize() + Hyperparams.extraMoverFoodCost : this.bodySize();
    }

    lifespan() {
        return this.bodySize() * Hyperparams.lifespanMultiplier;
    }

    maxHealth() {
        return this.bodySize();
    }

    //size of the complete body, so losing armor doesn't change lifespan or cost
    bodySize(){
        return this.anatomy.cells.length+this.lost_cells.length;
    }

    loseCell(cell){
        const spot=cell.getRealCell();
        this.anatomy.removeCell(cell.loc_col,cell.loc_row,true);
        cell.broken=true;
        this.lost_cells.push(cell);
        Glue.version++;
        if(spot!=null&&spot.cell_owner===cell)
            this.env.changeCell(spot.col,spot.row,CellStates.empty,null);
        if(this.anatomy.cells.length==0)
            this.die();
    }

    //rebuilds the first lost cell whose square is free
    regrowCell(){
        for(let i=0;i<this.lost_cells.length;i++){
            const lost=this.lost_cells[i];
            const spot=this.getRealCell(lost);
            if(spot==null||(spot.state!=CellStates.empty&&spot.state!=CellStates.food))
                continue;
            const cell=this.anatomy.addInheritCell(lost);
            this.lost_cells.splice(i,1);
            this.env.changeCell(spot.col,spot.row,cell.state,cell);
            return true;
        }
        return false;
    }

    reproduce() {
        //produce mutated child
        //check nearby locations (is there room and a direct path)
        var org = new Organism(0, 0, this.env, this);
        if(Hyperparams.rotationEnabled){
            org.rotation = Directions.getRandomDirection();
        }
        var prob = this.mutability;
        if (Hyperparams.useGlobalMutability){
            prob = Hyperparams.globalMutability;
        }
        else {
            //mutate the mutability
            if (Math.random() <= 0.5)
                org.mutability++;
            else{ 
                org.mutability--;
                if (org.mutability < 1)
                    org.mutability = 1;
            }
        } 
        if(Hyperparams.mutationZonesEnabled)
            prob*=this.env.grid_map.cellAt(this.c,this.r).mutation;
        var mutated = false;
        if (Math.random() * 100 <= prob) {
            if (org.anatomy.is_mover && Math.random() * 100 <= 10) { 
                if (org.anatomy.has_eyes) {
                    org.brain.mutate();
                }
                org.move_range += Math.floor(Math.random() * 4) - 2;
                if (org.move_range <= 0){
                    org.move_range = 1;
                };
                
            }
            else {
                mutated = org.mutate();
            }
        }

        var direction = Directions.getRandomScalar();
        var direction_c = direction[0];
        var direction_r = direction[1];
        var offset = (Math.floor(Math.random() * 3));
        var basemovement = this.anatomy.birth_distance;
        var new_c = this.c + (direction_c*basemovement) + (direction_c*offset);
        var new_r = this.r + (direction_r*basemovement) + (direction_r*offset);

        if (org.isClear(new_c, new_r, org.rotation, true) && 
            org.isStraightPath(new_c, new_r, this.c, this.r, this) && 
            this.env.canAddOrganism())
        {
            org.c = new_c;
            org.r = new_r;
            this.env.addOrganism(org);
            org.updateGrid();
            if (mutated) {
                FossilRecord.addSpecies(org, this.species);
            }
            else {
                org.species.addPop();
            }
        }
        Math.max(this.food_collected -= this.foodNeeded(), 0);
    }

    mutate() {
        let added = false;
        let changed = false;
        let removed = false;
        if (this.calcRandomChance(Hyperparams.addProb)) {
            let branch = this.anatomy.getRandomCell();
            let state = CellStates.getRandomLivingType();//branch.state;
            let growth_direction = Neighbors.all[Math.floor(Math.random() * Neighbors.all.length)]
            let c = branch.loc_col+growth_direction[0];
            let r = branch.loc_row+growth_direction[1];
            if (this.anatomy.canAddCellAt(c, r)){
                added = true;
                this.anatomy.addRandomizedCell(state, c, r);
            }
        }
        if (this.calcRandomChance(Hyperparams.changeProb)){
            let cell = this.anatomy.getRandomCell();
            let state = CellStates.getRandomLivingType();
            this.anatomy.replaceCell(state, cell.loc_col, cell.loc_row);
            changed = true;
        }
        if (this.calcRandomChance(Hyperparams.removeProb)){
            if(this.anatomy.cells.length > 1) {
                let cell = this.anatomy.getRandomCell();
                removed = this.anatomy.removeCell(cell.loc_col, cell.loc_row);
            }
        }
        return added || changed || removed;
    }

    calcRandomChance(prob) {
        return (Math.random() * 100) < prob;
    }

    attemptMove() {
        var direction = Directions.scalars[this.direction];
        var direction_c = direction[0];
        var direction_r = direction[1];
        var new_c = this.c + direction_c;
        var new_r = this.r + direction_r;
        const group=Glue.group(this);
        if(group.members.length>1)
            return Glue.move(group.members,direction_c,direction_r);
        if (this.isClear(new_c, new_r)) {
            for (var cell of this.anatomy.cells) {
                var real_c = this.c + cell.rotatedCol(this.rotation);
                var real_r = this.r + cell.rotatedRow(this.rotation);
                this.env.changeCell(real_c, real_r, CellStates.empty, null);
            }
            this.c = new_c;
            this.r = new_r;
            this.updateGrid();
            return true;
        }
        return false;
    }

    attemptRotate() {
        if(!this.can_rotate){
            this.direction = Directions.getRandomDirection();
            this.move_count = 0;
            return true;
        }
        if(Glue.group(this).members.length>1) //glued groups only translate
            return false;
        var new_rotation = Directions.getRandomDirection();
        if(this.isClear(this.c, this.r, new_rotation)){
            for (var cell of this.anatomy.cells) {
                var real_c = this.c + cell.rotatedCol(this.rotation);
                var real_r = this.r + cell.rotatedRow(this.rotation);
                this.env.changeCell(real_c, real_r, CellStates.empty, null);
            }
            this.rotation = new_rotation;
            this.direction = Directions.getRandomDirection();
            this.updateGrid();
            this.move_count = 0;
            return true;
        }
        return false;
    }

    changeDirection(dir) {
        this.direction = dir;
        this.move_count = 0;
    }

    // assumes either c1==c2 or r1==r2, returns true if there is a clear path from point 1 to 2
    isStraightPath(c1, r1, c2, r2, parent){
        if (c1 == c2) {
            if (r1 > r2){
                var temp = r2;
                r2 = r1;
                r1 = temp;
            }
            for (var i=r1; i!=r2; i++) {
                var cell = this.env.grid_map.cellAt(c1, i)
                if (!this.isPassableCell(cell, parent)){
                    return false;
                }
            }
            return true;
        }
        else {
            if (c1 > c2){
                var temp = c2;
                c2 = c1;
                c1 = temp;
            }
            for (var i=c1; i!=c2; i++) {
                var cell = this.env.grid_map.cellAt(i, r1);
                if (!this.isPassableCell(cell, parent)){
                    return false;
                }
            }
            return true;
        }
    }

    isPassableCell(cell, parent){
        return cell != null && (cell.state == CellStates.empty || cell.owner == this || cell.owner == parent || cell.state == CellStates.food);
    }

    isClear(col, row, rotation=this.rotation) {
        for(var loccell of this.anatomy.cells) {
            var cell = this.getRealCell(loccell, col, row, rotation);
            if (cell==null) {
                return false;
            }
            if (cell.owner==this || cell.state==CellStates.empty || (!Hyperparams.foodBlocksReproduction && cell.state==CellStates.food)){
                continue;
            }
            return false;
        }
        return true;
    }

    harm() {
        this.damage++;
        if (this.damage >= this.maxHealth() || Hyperparams.instaKill) {
            this.die();
        }
    }

    die() {
        if(!this.living) return;
        Glue.release(this);
        //marked dead first so chain explosions can't kill it twice
        this.living=false;
        const others=this.anatomy.cells.filter(cell=>cell.state!=CellStates.kamikaze);
        const can_explode=this.food_collected>=others.length;
        for (var cell of this.anatomy.cells) {
            var real_c = this.c + cell.rotatedCol(this.rotation);
            var real_r = this.r + cell.rotatedRow(this.rotation);
            this.env.changeCell(real_c, real_r, CellStates.food, null);
        }
        this.species.decreasePop();
        if(can_explode){
            const bombs=this.anatomy.cells.filter(cell=>cell.state==CellStates.kamikaze);
            for(const bomb of bombs)
                bomb.explode();
            for(const bomb of bombs)
                bomb.destroyFood();
        }
    }

    updateGrid() {
        for (var cell of this.anatomy.cells) {
            var real_c = this.c + cell.rotatedCol(this.rotation);
            var real_r = this.r + cell.rotatedRow(this.rotation);
            this.env.changeCell(real_c, real_r, cell.state, cell);
        }
    }

    update() {
        this.lifetime++;
        if (this.lifetime > this.lifespan()) {
            this.die();
            return this.living;
        }
        if (this.food_collected >= this.foodNeeded()) {
            this.reproduce();
        }
        //iterate over a copy, because cells can break off or regrow
        for (var cell of [...this.anatomy.cells]) {
            if(cell.broken) continue;
            cell.performFunction();
            if (!this.living)
                return this.living
        }
        
        //in a glued group only the leader moves
        const leads=Glue.group(this).leader===this;
        if(!leads||!this.anatomy.is_mover)
            this.brain.observations=[];
        if (leads&&this.anatomy.is_mover) {
            this.move_count++;
            var changed_dir = false;
            if (this.ignore_brain_for == 0){
                changed_dir = this.brain.decide();
            }  
            else{
                this.ignore_brain_for --;
            }
            var moved = this.attemptMove();
            if ((this.move_count > this.move_range && !changed_dir) || !moved){
                var rotated = this.attemptRotate();
                if (!rotated) {
                    this.changeDirection(Directions.getRandomDirection());
                    if (changed_dir)
                        this.ignore_brain_for = this.move_range + 1;
                }
            }
        }
        return this.living;
    }

    getRealCell(local_cell, c=this.c, r=this.r, rotation=this.rotation){
        var real_c = c + local_cell.rotatedCol(rotation);
        var real_r = r + local_cell.rotatedRow(rotation);
        return this.env.grid_map.cellAt(real_c, real_r);
    }

    isNatural() {
        let found_center = false;
        if (this.anatomy.cells.length === 0) {
            return false;
        }
        for (let i=0; i<this.anatomy.cells.length; i++) {
            let cell = this.anatomy.cells[i];
            for (let j=i+1; j<this.anatomy.cells.length; j++) {
                let toCompare = this.anatomy.cells[j];
                if (cell.loc_col === toCompare.loc_col && cell.loc_row === toCompare.loc_row) {
                    return false;
                }
            }
            if (cell.loc_col === 0 && cell.loc_row === 0) {
                found_center = true;
            }
        }
        return found_center;
    }

    serialize() {
        let org = SerializeHelper.copyNonObjects(this);
        org.anatomy = this.anatomy.serialize();
        if (this.anatomy.is_mover && this.anatomy.has_eyes)
            org.brain = this.brain.serialize();
        org.species_name = this.species.name;
        org.lost_cells=this.lost_cells.map(c=>({loc_col:c.loc_col,loc_row:c.loc_row,direction:c.direction,state:{name:c.state.name}}));
        //wear on armor and drills is saved with each cell
        return org;
    }

    loadRaw(org) {
        const uid=this.uid;
        SerializeHelper.overwriteNonObjects(org, this);
        this.uid=uid;
        this.anatomy.loadRaw(org.anatomy)
        for(const raw of org.anatomy.cells){
            const cell=this.anatomy.getLocalCell(raw.loc_col,raw.loc_row);
            for(const key of ['wear','dealt']){
                if(raw[key]!==undefined)
                    cell[key]=raw[key];
            }
        }
        this.lost_cells=[];
        for(const raw of org.lost_cells||[]){
            const state=CellStates[raw.state.name];
            const cell=this.anatomy.addInheritCell({...raw,state});
            this.anatomy.cells.pop();
            cell.broken=true;
            this.lost_cells.push(cell);
        }
        this.anatomy.checkTypeChange();
        if (org.brain)
            this.brain.copy(org.brain)
    }

}

module.exports = Organism;
