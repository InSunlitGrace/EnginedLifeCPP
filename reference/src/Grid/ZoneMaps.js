const Perlin=require("../Utils/Perlin");
const Random=require("../Utils/Random");
const WorldConfig=require("../WorldConfig");

//per-cell multipliers. 1 is neutral
const ZoneMaps={
    max:{fertility:3,mutation:5},
    //[above neutral, below neutral]
    colors:{fertility:["60,255,60","255,60,40"],mutation:["255,40,220","40,200,255"]},

    clamp(key,value){
        return Math.round(Math.min(this.max[key],Math.max(0,value))*100)/100;
    },

    //calls fn(cell,noise) for every cell, using layered perlin noise
    forEachNoise(grid_map,settings,fn){
        const {seed,scale,octaves,persistence,lacunarity}=settings;
        Random.withSeed(seed,()=>{
            Perlin.seed();
            for(const col of grid_map.grid){
                for(const cell of col){
                    let sum=0,norm=0,amp=1,freq=1/scale;
                    for(let i=0;i<octaves;i++){
                        sum+=amp*Perlin.get(cell.col*freq+i*17.3,cell.row*freq+i*17.3);
                        norm+=amp;
                        amp*=persistence;
                        freq*=lacunarity;
                    }
                    fn(cell,sum/norm);
                }
            }
        });
    },

    randomize(grid_map,key){
        const settings=WorldConfig.noise[key];
        this.forEachNoise(grid_map,settings,(cell,noise)=>{
            cell[key]=this.clamp(key,1+settings.offset+noise*settings.amplitude);
        });
    },

    flatten(grid_map,key){
        for(const col of grid_map.grid){
            for(const cell of col)
                cell[key]=1;
        }
    },

    //heat map tint for a cell, or null
    color(cell,key){
        if(!this.max[key]||cell[key]==1)
            return null;
        const above=cell[key]>1;
        const strength=above?(cell[key]-1)/(this.max[key]-1):1-cell[key];
        return "rgba("+this.colors[key][above?0:1]+","+(0.12+0.5*strength)+")";
    },
}

module.exports=ZoneMaps;
