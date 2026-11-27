const Hyperparams=require("../Hyperparameters");
const CellStates=require("./Cell/CellStates");

//bonds between organisms. each organism has a Map: partner -> tick the bond ends
const Glue={
    version:0, //bumped on every change so cached groups are rebuilt

    canBond(a,b){
        const until=a.bonds.get(b);
        return until===undefined||a.env.total_ticks>=until+Hyperparams.glueCooldown;
    },

    bond(a,b){
        const until=a.env.total_ticks+Hyperparams.glueTimeout;
        a.bonds.set(b,until);
        b.bonds.set(a,until);
        this.version++;
    },

    release(org){
        for(const other of org.bonds.keys())
            other.bonds.delete(org);
        org.bonds.clear();
        this.version++;
    },

    //movers x total cells
    weight(org){
        const movers=org.anatomy.cells.filter(cell=>cell.state==CellStates.mover).length;
        return movers*org.anatomy.cells.length;
    },

    //{members,leader} of the connected group containing org
    group(org){
        if(org.bonds.size==0)
            return {members:[org],leader:org};
        const tick=org.env.total_ticks;
        const cached=org._group;
        if(cached&&cached.tick==tick&&cached.version==this.version)
            return cached;
        const found=new Set([org]);
        for(const member of found){ //a Set visits items added during the loop
            for(const [other,until] of member.bonds){
                if(!other.living||tick>=until+Hyperparams.glueCooldown)
                    member.bonds.delete(other);
                else if(tick<until)
                    found.add(other);
            }
        }
        const members=[...found];
        let leader=members[0];
        let best=this.weight(leader);
        for(const member of members){
            const w=this.weight(member);
            //ties go to the older organism, so every member agrees
            if(w>best||(w==best&&member.uid<leader.uid)){
                leader=member;
                best=w;
            }
        }
        const group={members,leader,tick,version:this.version};
        for(const member of members)
            member._group=group;
        return group;
    },

    //moves the whole group one step, only if every member fits
    move(members,dc,dr){
        const env=members[0].env;
        const own=new Set(members);
        for(const org of members){
            for(const body of org.anatomy.cells){
                const target=org.getRealCell(body,org.c+dc,org.r+dr);
                if(target==null)
                    return false;
                const free=own.has(target.owner)||target.state==CellStates.empty||
                    (!Hyperparams.foodBlocksReproduction&&target.state==CellStates.food);
                if(!free)
                    return false;
            }
        }
        //erase everyone before drawing anyone
        for(const org of members){
            for(const body of org.anatomy.cells){
                const cell=org.getRealCell(body);
                env.changeCell(cell.col,cell.row,CellStates.empty,null);
            }
        }
        for(const org of members){
            org.c+=dc;
            org.r+=dr;
            org.updateGrid();
        }
        return true;
    },
}

module.exports=Glue;
