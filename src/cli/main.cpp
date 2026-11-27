// headless runner
#include <cstdio>
#include <exception>
#include <string_view>
#include <vector>
#include "cli/commands.hpp"

namespace{

int usage(){
    std::fprintf(stderr,"%s%s",le::cli::kRunHelp,"usage: le_cli foundations [seed]\n");
    return 2;
}

}

int main(int argc,char** argv){
    if(argc<2)
        return usage();
    const std::string_view command=argv[1];
    const std::vector<std::string_view> args(argv+2,argv+argc);
    try{
        if(command=="run")
            return le::cli::run(args);
        if(command=="foundations")
            return le::cli::foundations(args);
    }
    catch(const std::exception& error){
        std::fprintf(stderr,"le_cli: %s\n",error.what());
        return 2;
    }
    return usage();
}
