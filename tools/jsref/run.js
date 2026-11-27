// headless run of the JavaScript game: parity hashes and speed
const {load,CellStates,restrictTypes,gridHash,organismHash}=require('./common');

const HELP=`usage: node run.js [options]
  --seed N          simulation seed (1)
  --cols N          grid columns (200)
  --rows N          grid rows (200)
  --ticks N         ticks to run (1000)
  --every N         print hashes every N ticks (100)
  --no-mutation     global mutability 0
  --types a,b,c     only these living cell types
  --set name=value  change a hyperparameter (value is read as JSON), repeatable
  --bench           print only the speed`;

const options={seed:1,cols:200,rows:200,ticks:1000,every:100,set:[]};
const args=process.argv.slice(2);
const fail=message=>{console.error(message+'\n'+HELP);process.exit(2);};
const value=()=>args.length?args.shift():fail('missing value');
const integer=(min)=>{
    const n=Number(value());
    if(!Number.isInteger(n)||n<min)
        fail('expected a whole number of at least '+min);
    return n;
};
while(args.length){
    const arg=args.shift();
    if(arg==='--seed')options.seed=integer(0);
    else if(arg==='--cols')options.cols=integer(1);
    else if(arg==='--rows')options.rows=integer(1);
    else if(arg==='--ticks')options.ticks=integer(0);
    else if(arg==='--every')options.every=integer(1);
    else if(arg==='--no-mutation')options.set.push('useGlobalMutability=true','globalMutability=0');
    else if(arg==='--types')options.types=value().split(',');
    else if(arg==='--set')options.set.push(value());
    else if(arg==='--bench')options.bench=true;
    else fail('unknown option '+arg);
}

if(options.types){
    for(const name of options.types){
        if(!CellStates.living.some(state=>state.name===name))
            fail('unknown cell type '+name);
    }
    restrictTypes(options.types);
}

const Hyperparams=load('Hyperparameters');
for(const pair of options.set){
    const [key,...rest]=pair.split('=');
    if(!(key in Hyperparams)||rest.length===0)
        fail('bad setting '+pair);
    Hyperparams[key]=JSON.parse(rest.join('='));
}

const Random=load('Utils/Random');
const WorldEnvironment=load('Environments/WorldEnvironment');
const FossilRecord=load('Stats/FossilRecord');

Random.setSeed(options.seed);
let draws=0;
const stream=Random.next;
Random.next=()=>{draws++;return stream();};

//cell size 1, so the stub renderer's size gives the grid size
const env=new WorldEnvironment(1);
env.resizeGridColRow(1,options.cols,options.rows);
Random.run(()=>env.OriginOfLife());

const report=()=>console.log(
    `tick ${env.total_ticks} orgs ${env.organisms.length} grid ${gridHash(env.grid_map)} life ${organismHash(env)} `+
    `species ${Object.keys(FossilRecord.extant_species).length} draws ${draws}`);

if(!options.bench)
    report();
let organism_ticks=0;
const start=process.hrtime.bigint();
for(let n=1;n<=options.ticks;n++){
    env.update();
    organism_ticks+=env.organisms.length;
    //an automatic reset after extinction sets total_ticks back to 0, so count with n
    if(!options.bench&&n%options.every===0)
        report();
}
const seconds=Number(process.hrtime.bigint()-start)/1e9;
if(options.bench){
    console.log(`${options.cols}x${options.rows} seed ${options.seed} ticks ${options.ticks}: `+
        `${seconds.toFixed(2)} s, ${(options.ticks/seconds).toFixed(0)} ticks/s, `+
        `${(organism_ticks/seconds/1e6).toFixed(2)} M organism-updates/s, `+
        `${env.organisms.length} organisms at end, ${env.reset_count} resets`);
}
