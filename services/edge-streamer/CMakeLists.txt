cmake_minimum_required(VERSION 3.20)
project(nirnay_edge_gateway LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(nirnay_edge_gateway src/edge_gateway.cpp)

if(WIN32)
    target_link_libraries(nirnay_edge_gateway PRIVATE ws2_32)
endif()

install(TARGETS nirnay_edge_gateway DESTINATION bin)
