cmake_minimum_required(VERSION 3.22)
project(EnginedLife VERSION 0.1.0 LANGUAGES CXX)

if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
    set(CMAKE_BUILD_TYPE Release CACHE STRING "Build type" FORCE)
endif()

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

option(LE_NATIVE "Optimise for this machine's CPU" ON)
option(LE_LTO "Link-time optimisation in release builds" ON)
option(LE_SANITIZE "Address and undefined behaviour sanitizers" OFF)
option(LE_TESTS "Build the tests" ON)

# flags shared by every target of this project (not by dependencies)
add_library(le_options INTERFACE)
# -ffp-contract=off keeps floating point results identical to the JavaScript
target_compile_options(le_options INTERFACE -Wall -Wextra -Wpedantic -ffp-contract=off)
if(LE_NATIVE)
    target_compile_options(le_options INTERFACE -march=native)
endif()
if(LE_SANITIZE)
    target_compile_options(le_options INTERFACE -fsanitize=address,undefined -fno-omit-frame-pointer)
    target_link_options(le_options INTERFACE -fsanitize=address,undefined)
endif()

if(LE_LTO AND NOT LE_SANITIZE)
    include(CheckIPOSupported)
    check_ipo_supported(RESULT le_ipo)
    if(le_ipo)
        set(CMAKE_INTERPROCEDURAL_OPTIMIZATION_RELEASE ON)
    endif()
endif()

add_subdirectory(src/core)
add_subdirectory(src/cli)

if(LE_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()
