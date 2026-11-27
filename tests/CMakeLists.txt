# use the system package (doctest-dev) when present, otherwise download it
find_package(doctest 2.4 CONFIG QUIET)
if(NOT doctest_FOUND)
    include(FetchContent)
    FetchContent_Declare(doctest
        URL https://github.com/doctest/doctest/archive/refs/tags/v2.4.12.tar.gz
        DOWNLOAD_EXTRACT_TIMESTAMP ON
        SYSTEM)
    set(DOCTEST_NO_INSTALL ON)
    FetchContent_MakeAvailable(doctest)
endif()

add_executable(le_tests main.cpp rng_test.cpp cells_test.cpp grid_test.cpp world_test.cpp)
target_link_libraries(le_tests PRIVATE le_core doctest::doctest)
add_test(NAME unit COMMAND le_tests)

# compare against the JavaScript when Node is installed
find_program(NODE_EXECUTABLE NAMES node nodejs)
function(le_parity name command args)
    add_test(NAME parity_${name}
        COMMAND ${CMAKE_COMMAND}
            -DCLI=$<TARGET_FILE:le_cli>
            -DNODE=${NODE_EXECUTABLE}
            -DSCRIPT=${PROJECT_SOURCE_DIR}/tools/jsref/${command}.js
            -DCOMMAND=${command}
            "-DARGS=${args}"
            -DOUT=${CMAKE_CURRENT_BINARY_DIR}/${name}
            -P ${CMAKE_CURRENT_SOURCE_DIR}/parity.cmake)
endfunction()

if(NODE_EXECUTABLE)
    foreach(seed 1 2 123456789 4294967295)
        le_parity(foundations_${seed} foundations ${seed})
    endforeach()

    set(moving "--types mouth,producer,mover")
    le_parity(life_no_mutation run "--no-mutation --ticks 2000")
    le_parity(life_moving run "${moving} --ticks 2000")
    le_parity(life_extinctions run "${moving} --seed 11 --cols 12 --rows 9 --ticks 20000 --every 10")
    le_parity(life_tiny run "--no-mutation --seed 9 --cols 3 --rows 3 --ticks 3000 --every 1")
    le_parity(life_rules run "${moving} --seed 3 --ticks 2500 --set rotationEnabled=false --set foodBlocksReproduction=false --set moversCanProduce=true")
    le_parity(life_limits run "${moving} --seed 4 --ticks 2500 --set useGlobalMutability=true --set globalMutability=80 --set maxOrganisms=150 --set extraMoverFoodCost=3")
    le_parity(life_zones run "${moving} --seed 6 --ticks 2000 --set addProb=90 --set changeProb=90 --set removeProb=90 --set fertilityEnabled=true --set mutationZonesEnabled=true")
else()
    message(STATUS "Node not found: JavaScript parity tests are skipped")
endif()
