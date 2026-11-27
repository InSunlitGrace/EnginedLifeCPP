// same options and output as tools/jsref/run.js
#include <chrono>
#include <cstdio>
#include "cli/commands.hpp"
#include "core/world.hpp"

namespace le::cli{
namespace{

// living types whose behaviour has been ported. later parts add to this
constexpr CellType kPorted[]={CellType::mouth,CellType::producer,CellType::mover};

bool boolean(std::string_view text){
    if(text=="true")
        return true;
    if(text=="false")
        return false;
    throw std::invalid_argument("expected true or false: "+std::string(text));
}

// only settings whose rules have been ported, so nothing is silently ignored
void set(Hyperparams& p,std::string_view pair){
    const size_t equals=pair.find('=');
    if(equals==std::string_view::npos)
        throw std::invalid_argument("expected name=value: "+std::string(pair));
    const auto name=pair.substr(0,equals);
    const auto value=pair.substr(equals+1);

    if(name=="lifespanMultiplier")p.lifespanMultiplier=number<double>(value);
    else if(name=="foodProdProb")p.foodProdProb=number<double>(value);
    else if(name=="fertilityEnabled")p.fertilityEnabled=boolean(value);
    else if(name=="mutationZonesEnabled")p.mutationZonesEnabled=boolean(value);
    else if(name=="useGlobalMutability")p.useGlobalMutability=boolean(value);
    else if(name=="globalMutability")p.globalMutability=number<double>(value);
    else if(name=="addProb")p.addProb=number<double>(value);
    else if(name=="changeProb")p.changeProb=number<double>(value);
    else if(name=="removeProb")p.removeProb=number<double>(value);
    else if(name=="rotationEnabled")p.rotationEnabled=boolean(value);
    else if(name=="foodBlocksReproduction")p.foodBlocksReproduction=boolean(value);
    else if(name=="moversCanProduce")p.moversCanProduce=boolean(value);
    else if(name=="extraMoverFoodCost")p.extraMoverFoodCost=number<int>(value);
    else if(name=="maxOrganisms")p.maxOrganisms=number<int>(value);
    else throw std::invalid_argument("unknown or not yet ported setting: "+std::string(name));
}

std::vector<CellType> parseTypes(std::string_view list){
    std::vector<CellType> types;
    while(true){
        const size_t comma=list.find(',');
        const auto name=list.substr(0,comma);
        const auto type=cellFromName(name);
        if(!type||!isLiving(*type))
            throw std::invalid_argument("unknown cell type: "+std::string(name));
        types.push_back(*type);
        if(comma==std::string_view::npos)
            return types;
        list.remove_prefix(comma+1);
    }
}

void report(const World& world){
    std::printf("tick %llu orgs %zu grid %08x life %08x species %d draws %llu\n",
        static_cast<unsigned long long>(world.ticks()),world.population(),world.grid().hash(),
        world.lifeHash(),world.species().living(),static_cast<unsigned long long>(world.rng().draws()));
}

}

int run(const Args& args){
    uint32_t seed=1;
    int cols=200,rows=200,ticks=1000,every=100;
    bool bench=false;
    Hyperparams params;
    TypeLists types;

    for(size_t n=0;n<args.size();n++){
        const auto arg=args[n];
        const auto value=[&]{
            if(++n>=args.size())
                throw std::invalid_argument("missing value for "+std::string(arg));
            return args[n];
        };
        if(arg=="--seed")seed=number<uint32_t>(value());
        else if(arg=="--cols")cols=number<int>(value());
        else if(arg=="--rows")rows=number<int>(value());
        else if(arg=="--ticks")ticks=number<int>(value());
        else if(arg=="--every")every=number<int>(value());
        else if(arg=="--no-mutation"){
            params.useGlobalMutability=true;
            params.globalMutability=0;
        }
        else if(arg=="--types")types.restrictTo(parseTypes(value()));
        else if(arg=="--set")set(params,value());
        else if(arg=="--bench")bench=true;
        else throw std::invalid_argument("unknown option "+std::string(arg));
    }
    if(ticks<0||every<1)
        throw std::invalid_argument("--ticks must be at least 0 and --every at least 1");

    const bool can_mutate=!params.useGlobalMutability||params.globalMutability>0;
    if(can_mutate){
        for(int i=0;i<types.livingCount();i++){
            bool ported=false;
            for(const CellType type:kPorted)
                ported|=types.living(i)==type;
            if(!ported)
                throw std::invalid_argument("only mouth, producer and mover are ported: "
                    "use --types mouth,producer,mover or --no-mutation");
        }
    }

    World world(cols,rows,seed,params,types);
    world.originOfLife();
    if(!bench)
        report(world);
    uint64_t organism_ticks=0;
    const auto start=std::chrono::steady_clock::now();
    for(int n=1;n<=ticks;n++){
        world.tick();
        organism_ticks+=world.population();
        if(!bench&&n%every==0)
            report(world);
    }
    const double seconds=std::chrono::duration<double>(std::chrono::steady_clock::now()-start).count();
    if(bench){
        std::printf("%dx%d seed %u ticks %d: %.2f s, %.0f ticks/s, %.2f M organism-updates/s, %zu organisms at end, %d resets\n",
            cols,rows,seed,ticks,seconds,ticks/seconds,organism_ticks/seconds/1e6,world.population(),world.resets());
    }
    return 0;
}

}
