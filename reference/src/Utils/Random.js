const native=Math.random;

//small seeded generator (mulberry32)
function generator(seed){
    let a=seed>>>0;
    return function(){
        a=(a+0x6D2B79F5)>>>0;
        let t=a;
        t=Math.imul(t^(t>>>15),t|1);
        t^=t+Math.imul(t^(t>>>7),t|61);
        return ((t^(t>>>14))>>>0)/4294967296;
    };
}

//the simulation runs on a seeded stream. UI actions keep the browser's generator
const Random={
    newSeed(){
        return Math.floor(native()*4294967296);
    },

    setSeed(seed){
        this.seed=seed>>>0;
        this.restart();
    },

    restart(){
        this.next=generator(this.seed);
    },

    //runs fn with Math.random drawing from the simulation stream
    run(fn){
        return this.use(this.next,fn);
    },

    //runs fn on a separate stream, used for noise maps
    withSeed(seed,fn){
        return this.use(generator(seed),fn);
    },

    use(source,fn){
        const previous=Math.random;
        Math.random=source;
        try{
            return fn();
        }
        finally{
            Math.random=previous;
        }
    },
}
Random.setSeed(Random.newSeed());

module.exports=Random;
