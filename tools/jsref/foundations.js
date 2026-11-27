// usage: node foundations.js [seed]. output must equal `le_cli foundations [seed]`
const {load,CellStates,gridHash}=require('./common');
const Random=load('Utils/Random');
const Directions=load('Organism/Directions');
const Neighbors=load('Grid/Neighbors');
const GridMap=load('Grid/GridMap');
const BodyCell=load('Organism/Cell/BodyCells/BodyCell');

Random.setSeed(process.argv[2]===undefined?1:Number(process.argv[2]));
let draws=0;
const stream=Random.next;
Random.next=()=>{draws++;return stream();};
const out=[];
const offsets=(name,list)=>out.push(name+' '+list.map(o=>o[0]+','+o[1]).join(' '));

Random.run(()=>{
    for(let n=0;n<1000;n++)
        out.push('rng '+Math.random()*4294967296);
    for(let n=0;n<200;n++){
        const living=CellStates.getRandomLivingType().name;
        const any=CellStates.getRandomName();
        const dir=Directions.getRandomDirection();
        const step=Directions.getRandomScalar();
        out.push(`pick ${living} ${any} ${dir} ${step[0]},${step[1]}`);
    }

    for(const name of ['all','adjacent','corners','allSelf'])
        offsets(name,Neighbors[name]);
    offsets('range2',Neighbors.inRange(2));

    for(let d=0;d<4;d++){
        const body={loc_col:2,loc_row:5};
        const col=BodyCell.prototype.rotatedCol.call(body,d);
        const row=BodyCell.prototype.rotatedRow.call(body,d);
        out.push(`dir ${d} ${Directions.getOppositeDirection(d)} ${Directions.rotateRight(d)} ${col},${row}`);
    }

    const grid=new GridMap(37,23,1);
    for(const col of grid.grid){
        for(const cell of col){
            cell.setType(CellStates.all[Math.floor(Math.random()*CellStates.all.length)]);
            cell.fertility=Math.floor(Math.random()*301)/100;
            cell.mutation=Math.floor(Math.random()*501)/100;
        }
    }
    out.push(`grid ${gridHash(grid)} draws ${draws}`);
});
console.log(out.join('\n'));
