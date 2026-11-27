#pragma once
#include <charconv>
#include <stdexcept>
#include <string>
#include <string_view>
#include <vector>

namespace le::cli{

using Args=std::vector<std::string_view>;

inline constexpr const char* kRunHelp=
    "usage: le_cli run [options]\n"
    "  --seed N          simulation seed (1)\n"
    "  --cols N          grid columns (200)\n"
    "  --rows N          grid rows (200)\n"
    "  --ticks N         ticks to run (1000)\n"
    "  --every N         print hashes every N ticks (100)\n"
    "  --no-mutation     global mutability 0\n"
    "  --types a,b,c     only these living cell types\n"
    "  --set name=value  change a hyperparameter, repeatable\n"
    "  --bench           print only the speed\n";

// the whole text as a number, or an error
template<class T>
T number(std::string_view text){
    T value{};
    const auto [end,error]=std::from_chars(text.data(),text.data()+text.size(),value);
    if(text.empty()||error!=std::errc()||end!=text.data()+text.size())
        throw std::invalid_argument("not a valid number: "+std::string(text));
    return value;
}

int run(const Args& args);
// output must equal tools/jsref/foundations.js
int foundations(const Args& args);

}
