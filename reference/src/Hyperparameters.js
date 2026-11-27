const Neighbors = require("./Grid/Neighbors");

const Hyperparams = {
    setDefaults: function() {
        this.lifespanMultiplier = 100;
        this.foodProdProb = 5;
        this.healProb=5;
        this.scavengeProb=10;
        this.parasiteStealPercent=50;
        this.parasiteCooldown=20;
        this.kamikazeRange=2;
        this.armorDurability=10;
        this.drillDamage=2;
        this.drillInterval=5;
        this.drillBreakDamage=30;
        this.glueTimeout=100;
        this.glueCooldown=50;
        this.regrowCost=2;
        this.regrowInterval=20;
        this.transportAgeGap=40;
        this.transportAmount=1;
        this.kinRecognition=false;
        this.foodRotEnabled=false;
        this.foodRotTicks=500;
        this.seasonsEnabled=false;
        this.seasons=[{ticks:1000,multiplier:1.5},{ticks:1000,multiplier:0.5}];
        this.meteorEnabled=false;
        this.meteorInterval=2000;
        this.meteorRadius=10;
        this.fertilityEnabled=false;
        this.mutationZonesEnabled=false;
        this.killableNeighbors = Neighbors.adjacent;
        this.edibleNeighbors = Neighbors.adjacent;
        this.growableNeighbors = Neighbors.adjacent;

        this.useGlobalMutability = false;
        this.globalMutability = 5;
        this.addProb = 33;
        this.changeProb = 33;
        this.removeProb = 33;
        
        this.rotationEnabled = true;

        this.foodBlocksReproduction = true;
        this.moversCanProduce = false;

        this.instaKill = false;

        this.lookRange = 20;
        this.seeThroughSelf = false;

        this.foodDropProb = 0;

        this.extraMoverFoodCost = 0;

        this.maxOrganisms = -1;
    },

    loadJsonObj(obj) {
        for (let key in obj) {
            this[key] = obj[key];
        }
    }
}

Hyperparams.setDefaults();

module.exports = Hyperparams;