// loads the JavaScript game headlessly, without the sticky cell
const path=require('path');
const src=path.resolve(__dirname,'../../reference/src');
const load=name=>require(path.join(src,name));

//modules that need a browser are replaced before anything requires them
function stub(name,exports){
    const file=require.resolve(path.join(src,name));
    require.cache[file]={id:file,filename:file,loaded:true,exports};
}

class Renderer{
    constructor(){
        this.canvas=null;
        this.width=0;
        this.height=0;
        this.cells_to_render=new Set();
    }
    addToRender(){}
    renderFullGrid(){}
    renderCells(){}
    renderHighlights(){}
    fillShape(){}
    fillWindow(){}
}
stub('Rendering/Renderer',Renderer);
stub('Controllers/EnvironmentController',class{});

const CellStates=load('Organism/Cell/CellStates');

//keeps empty, food, wall and the chosen living types. sticky is always removed
function restrictTypes(names){
    CellStates.defineLists();
    const keep=state=>state!==CellStates.sticky&&(!names||names.includes(state.name));
    CellStates.living=CellStates.living.filter(keep);
    CellStates.all=[CellStates.empty,CellStates.food,CellStates.wall,...CellStates.living];
}
restrictTypes();

//Brain.randomizeDecisions names sticky directly, which would draw an extra random number
const Brain=load('Organism/Perception/Brain');
Brain.prototype.randomizeDecisions=function(randomize_all=false){
    const names=['mouth','producer','mover','armor','eye','healer','scavenger','parasite','kamikaze','transporter','drill','regrower'];
    if(randomize_all)
        names.unshift('food','killer');
    for(const name of names)
        this.decisions[name]=Brain.Decision.getRandom();
};

//FNV-1a over 32-bit little-endian words, same as src/core/hash.hpp
class Hash{
    constructor(){this.value=0x811C9DC5;}
    add(word){
        for(let shift=0;shift<32;shift+=8){
            this.value^=(word>>>shift)&0xFF;
            this.value=Math.imul(this.value,0x01000193)>>>0;
        }
    }
    hex(){return (this.value>>>0).toString(16).padStart(8,'0');}
}

function gridHash(grid_map){
    const index=new Map(CellStates.all.map((state,i)=>[state,i]));
    const hash=new Hash();
    hash.add(grid_map.cols);
    hash.add(grid_map.rows);
    for(const col of grid_map.grid){
        for(const cell of col){
            hash.add(index.get(cell.state));
            hash.add(Math.round(cell.fertility*100));
            hash.add(Math.round(cell.mutation*100));
        }
    }
    return hash.hex();
}

//organisms in update order. the C++ version must add the fields in this order
function organismHash(env){
    const index=new Map(CellStates.all.map((state,i)=>[state,i]));
    const hash=new Hash();
    hash.add(env.total_ticks);
    hash.add(env.organisms.length);
    for(const org of env.organisms){
        for(const value of [org.c,org.r,org.lifetime,org.food_collected,org.damage,org.rotation,
                org.direction,org.move_count,org.move_range,org.mutability,org.anatomy.cells.length])
            hash.add(value|0);
        for(const cell of org.anatomy.cells){
            hash.add(index.get(cell.state));
            hash.add(cell.loc_col|0);
            hash.add(cell.loc_row|0);
            hash.add(cell.direction|0);
        }
    }
    return hash.hex();
}

module.exports={load,CellStates,restrictTypes,Hash,gridHash,organismHash};
