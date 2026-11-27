const Random=require('./Utils/Random');

const WorldConfig = {
    headless: false,
    clear_walls_on_reset: false,
    auto_reset: true,
    auto_pause: false,
    brush_size: 2,
    zone_view:'off',
    brush_shape:'square',
    brush_intensity:100, //percent
    //perlin settings, one set per use
    noise:{
        fertility:{seed:Random.newSeed(),scale:20,octaves:1,persistence:0.5,lacunarity:2,amplitude:2.5,offset:0},
        mutation:{seed:Random.newSeed(),scale:20,octaves:1,persistence:0.5,lacunarity:2,amplitude:2.5,offset:0},
        walls:{seed:Random.newSeed(),scale:30,octaves:1,persistence:0.5,lacunarity:2,threshold:-0.017,thickness:0.05},
    },
}

module.exports = WorldConfig;