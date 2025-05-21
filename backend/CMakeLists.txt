cmake_minimum_required(VERSION 3.5.0)
project(DeepDive VERSION 0.1.0 LANGUAGES C CXX)

if(DEFINED ENV{VCPKG_ROOT})
    set(CMAKE_TOOLCHAIN_FILE "$ENV{VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake" CACHE STRING "vcpkg toolchain file")
else()
    message(FATAL_ERROR "VCPKG_ROOT is not set, please set it to your vcpkg directory.")
endif()

list(APPEND CMAKE_PREFIX_PATH "$ENV{VCPKG_ROOT}/installed/x64-windows/share")
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/../server)

find_package(asio REQUIRED)
find_package(Crow REQUIRED)
find_package(nlohmann_json REQUIRED)
find_package(nlohmann_json_schema_validator REQUIRED)


include_directories(${CMAKE_SOURCE_DIR}/../libs) 
link_directories(${CMAKE_SOURCE_DIR}/../libs/build)

include_directories("C:/Users/pavel/vcpkg/installed/x64-mingw-static/include")
link_directories("C:/Users/pavel/vcpkg/installed/x64-mingw-static/lib")

add_library(bscrypt STATIC ../libs/bcrypt/bcrypt.cpp ../libs/bcrypt/blowfish.cpp)
find_package(OpenSSL REQUIRED)

add_executable(DeepDive main.cpp ApiRouter.cpp Services.cpp)
target_link_libraries(DeepDive PRIVATE bscrypt SQLiteCpp sqlite3 Crow::Crow ws2_32 mswsock OpenSSL::SSL OpenSSL::Crypto nlohmann_json_schema_validator )