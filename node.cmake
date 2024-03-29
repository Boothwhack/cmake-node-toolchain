cmake_minimum_required(VERSION 3.19)

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_LIST_DIR}/cmake")

# Assume package.json is in the same directory as CMakeLists.txt
set(NODE_PACKAGE_DIR ${CMAKE_SOURCE_DIR})

if (NODE_CHAINLOAD_TOOLCHAIN_FILE)
    include("${NODE_CHAINLOAD_TOOLCHAIN_FILE}")
endif ()

if (NOT CMAKE_SYSTEM_PROCESSOR)
    set(CMAKE_SYSTEM_PROCESSOR "${CMAKE_HOST_SYSTEM_PROCESSOR}")
endif ()

# Node JS compatible platform and arch
if (WIN32)
    set(NODE_PLATFORM "win32")
elseif (UNIX)
    set(NODE_PLATFORM "linux")
elseif (APPLE)
    set(NODE_PLATFORM "darwin")
else ()
    message(FATAL_ERROR "Unable to determine platform.")
endif ()

if (CMAKE_SYSTEM_PROCESSOR MATCHES "x86_64|AMD64")
    set(NODE_ARCH "x64")
elseif (CMAKE_SYSTEM_PROCESSOR MATCHES "i368|x86")
    set(NODE_ARCH "x32")
else ()
    message(FATAL_ERROR "Unable to determine architecture.")
endif ()

# Discover cmake modules in dependencies
macro(scan_modules module_dir)
    message(STATUS "Scanning for cmake modules in ${module_dir}...")

    file(GLOB modules "${module_dir}/*")
    foreach (dir ${modules})
        if (IS_DIRECTORY "${dir}")
            get_filename_component(name "${dir}" NAME)
            if (name MATCHES "^@")
                scan_modules("${dir}")
            elseif (EXISTS "${dir}/package.cmake")
                include("${dir}/package.cmake")
            endif ()
        endif ()
    endforeach ()
endmacro()
scan_modules("${NODE_PACKAGE_DIR}/node_modules")

# Utility to generate .node module from a shared library target
function(node_module target module_name)
    get_target_property(target_type ${target} TYPE)
    if (NOT target_type STREQUAL "SHARED_LIBRARY")
        message(FATAL_ERROR "Cannot create node native module for '${target}', it is not a shared library.")
    endif ()

    set_target_properties(${target} PROPERTIES
            PREFIX ""
            SUFFIX ".node")
    target_compile_definitions(${target} PRIVATE "NODE_GYP_MODULE_NAME=${module_name}")
endfunction()
