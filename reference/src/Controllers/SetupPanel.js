const WorldConfig=require("../WorldConfig");
const Random=require("../Utils/Random");

//[key,label,min,max,step]
const COMMON=[
    ['scale','Scale (cells per feature)',2,500,1],
    ['octaves','Octaves (detail layers)',1,8,1],
    ['persistence','Persistence',0,1,0.05],
    ['lacunarity','Lacunarity',1,6,0.1],
];
const ZONE=[['amplitude','Amplitude (contrast)',0,10,0.1],['offset','Offset (bias)',-1,4,0.1]];
const WALLS=[['threshold','Band start',-1,1,0.001],['thickness','Band thickness',0,2,0.005]];

//seed and noise controls
const SetupPanel={
    init(control_panel){
        this.env=control_panel.engine.env;
        $('.noise-options').each((i,box)=>this.buildNoise($(box),box.dataset.noise));
        $('#sim-seed').val(Random.seed);
        $('#seed-random').click(()=>$('#sim-seed').val(Random.newSeed()));
        $('#seed-apply').click(()=>{
            const seed=Number($('#sim-seed').val());
            if(!Number.isInteger(seed)||seed<0||seed>4294967295){
                alert('The seed must be a whole number from 0 to 4294967295');
                return;
            }
            const previous=Random.seed;
            Random.setSeed(seed);
            if(this.env.reset())
                control_panel.stats_panel.reset();
            else
                Random.setSeed(previous);
        });
        this.updateStatus();
    },

    buildNoise(box,name){
        const settings=WorldConfig.noise[name];
        const fields=[['seed','Seed',0,4294967295,1],...COMMON,...(name=='walls'?WALLS:ZONE)];
        for(const [key,label,min,max,step] of fields){
            const input=$('<input type="number">').attr({min,max,step}).val(settings[key]);
            input.change(()=>{
                let value=Number(input.val());
                if(input.val()!==''&&!isNaN(value)){
                    value=Math.min(max,Math.max(min,value));
                    settings[key]=(key=='seed'||key=='octaves')?Math.floor(value):value;
                }
                input.val(settings[key]);
            });
            const row=$('<div class="row"></div>').append($('<label></label>').text(label),input);
            if(key=='seed'){
                row.append($('<button title="New random seed"><i class="fa fa-dice"></i></button>').click(()=>{
                    settings.seed=Random.newSeed();
                    input.val(settings.seed);
                }));
            }
            box.append(row);
        }
    },

    updateStatus(){
        $('#seed-current').text('Current seed: '+Random.seed);
    },
}

module.exports=SetupPanel;
