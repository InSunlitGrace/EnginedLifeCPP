# simulation only: no window or UI code belongs here
add_library(le_core STATIC
    behaviours.cpp
    cells.cpp
    grid.cpp
    life.cpp
    organism.cpp
    species.cpp
    world.cpp)
target_include_directories(le_core PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/..)
target_link_libraries(le_core PUBLIC le_options)
