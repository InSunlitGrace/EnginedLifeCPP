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

add_executable(le_tests main.cpp rng_test.cpp cells_test.cpp grid_test.cpp)
target_link_libraries(le_tests PRIVATE le_core doctest::doctest)
add_test(NAME unit COMMAND le_tests)

# compare against the JavaScript when Node is installed
find_program(NODE_EXECUTABLE NAMES node nodejs)
if(NODE_EXECUTABLE)
    foreach(seed 1 2 123456789 4294967295)
        add_test(NAME parity_foundations_${seed}
            COMMAND ${CMAKE_COMMAND}
                -DCLI=$<TARGET_FILE:le_cli>
                -DNODE=${NODE_EXECUTABLE}
                -DSCRIPT=${PROJECT_SOURCE_DIR}/tools/jsref/foundations.js
                -DSEED=${seed}
                -DOUT=${CMAKE_CURRENT_BINARY_DIR}/foundations_${seed}
                -P ${CMAKE_CURRENT_SOURCE_DIR}/parity.cmake)
    endforeach()
else()
    message(STATUS "Node not found: JavaScript parity tests are skipped")
endif()
