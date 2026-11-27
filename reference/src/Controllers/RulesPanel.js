const Hyperparams=require("../Hyperparameters");
const WorldConfig=require("../WorldConfig");
const WorldRules=require("../Environments/WorldRules");
const ZoneMaps=require("../Grid/ZoneMaps");

const CHECKBOXES={
    'kin-recognition':'kinRecognition',
    'food-rot-enabled':'foodRotEnabled',
    'seasons-enabled':'seasonsEnabled',
    'meteor-enabled':'meteorEnabled',
    'fertility-enabled':'fertilityEnabled',
    'mutation-zones-enabled':'mutationZonesEnabled',
};
//element id -> [hyperparameter, minimum]
const NUMBERS={
    'transport-gap':['transportAgeGap',0],
    'transport-amount':['transportAmount',1],
    'food-rot-ticks':['foodRotTicks',1],
    'meteor-interval':['meteorInterval',1],
    'meteor-radius':['meteorRadius',0],
    'armor-durability':['armorDurability',1],
    'drill-damage':['drillDamage',0],
    'drill-interval':['drillInterval',0],
    'drill-break':['drillBreakDamage',1],
    'glue-timeout':['glueTimeout',0],
    'glue-cooldown':['glueCooldown',0],
    'regrow-cost':['regrowCost',0],
    'regrow-interval':['regrowInterval',0],
    'parasite-steal':['parasiteStealPercent',0,100],
    'parasite-cooldown':['parasiteCooldown',0],
    'kamikaze-range':['kamikazeRange',0,20],
    'heal-prob':['healProb',0,100,true],
    'scavenge-prob':['scavengeProb',0,100,true],
};

//UI for the world rules in Evolution Controls
const RulesPanel={
    init(env){
        this.env=env;
        for(const [id,key] of Object.entries(CHECKBOXES)){
            $('#'+id).change(function(){
                Hyperparams[key]=this.checked;
            });
        }
        for(const [id,[key,min,max=Infinity,decimal]] of Object.entries(NUMBERS)){
            $('#'+id).change(function(){
                const value=decimal?parseFloat(this.value):parseInt(this.value);
                if(!isNaN(value))
                    Hyperparams[key]=Math.min(max,Math.max(min,value));
                this.value=Hyperparams[key];
            });
        }
        $('#add-season').click(()=>{
            Hyperparams.seasons.push({ticks:1000,multiplier:1});
            this.renderSeasons();
        });
        $('#meteor-now').click(()=>WorldRules.strikeMeteor(env));
        $('#zone-view').change(function(){
            RulesPanel.setView(this.value);
        });
        for(const key of ['fertility','mutation']){
            $('#'+key+'-randomize').click(()=>{
                ZoneMaps.randomize(env.grid_map,key);
                this.setView(key);
            });
            $('#'+key+'-flatten').click(()=>{
                ZoneMaps.flatten(env.grid_map,key);
                this.setView(key);
            });
        }
    },

    setView(view){
        WorldConfig.zone_view=view;
        $('#zone-view').val(view);
        if(!WorldConfig.headless)
            this.env.renderFull();
    },

    refresh(){
        for(const [id,key] of Object.entries(CHECKBOXES))
            $('#'+id).prop('checked',Hyperparams[key]);
        for(const [id,[key]] of Object.entries(NUMBERS))
            $('#'+id).val(Hyperparams[key]);
        this.renderSeasons();
    },

    renderSeasons(){
        const list=$('#season-list').empty();
        Hyperparams.seasons.forEach((season,i)=>{
            const row=$('<div class="season-row"></div>').append('<b>Season '+(i+1)+'</b> ');
            const field=(label,key,min,step)=>{
                const input=$('<input type="number" style="width:70px">')
                    .attr({min,step,'data-key':key}).val(season[key]);
                input.change(()=>{
                    const value=parseFloat(input.val());
                    if(!isNaN(value))
                        season[key]=Math.max(min,key=='ticks'?Math.round(value):value);
                    input.val(season[key]);
                });
                row.append(label+' ',input,' ');
            };
            field('ticks','ticks',1,1);
            field('food x','multiplier',0,'any');
            const remove=$('<button title="Remove season">x</button>').click(()=>{
                Hyperparams.seasons.splice(i,1);
                this.renderSeasons();
            });
            list.append(row.append(remove));
        });
    },

    updateStatus(){
        const now=WorldRules.currentSeason(this.env);
        $('#season-status').text(now?
            'Current: season '+(now.index+1)+', '+now.ticks_left+' ticks left':
            'Seasons inactive');
    },
}

module.exports=RulesPanel;
