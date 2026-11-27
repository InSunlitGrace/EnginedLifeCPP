add_executable(le_cli foundations.cpp main.cpp run.cpp)
target_link_libraries(le_cli PRIVATE le_core)
