function(execute_node script)
    cmake_parse_arguments(PARSE_ARGV 1 node "TRIM_QUOTES" "RESULT_VARIABLE;OUTPUT_VARIABLE;ERROR_VARIABLE;WORKING_DIRECTORY" "")

    execute_process(COMMAND node -p "${script}"
            OUTPUT_STRIP_TRAILING_WHITESPACE
            WORKING_DIRECTORY "${node_WORKING_DIRECTORY}"
            RESULT_VARIABLE result
            OUTPUT_VARIABLE output
            ERROR_VARIABLE error)

    string(REPLACE "\\" "\\\\" output "${output}")

    if (node_TRIM_QUOTES)
        trim_quotes(output "${output}")
    endif ()

    if (node_RESULT_VARIABLE)
        set(${node_RESULT_VARIABLE} "${result}" PARENT_SCOPE)
    endif ()

    if (node_OUTPUT_VARIABLE)
        set(${node_OUTPUT_VARIABLE} "${output}" PARENT_SCOPE)
    endif ()

    if (node_ERROR_VARIABLE)
        set(${node_ERROR_VARIABLE} "${error}" PARENT_SCOPE)
    endif ()
endfunction()

macro(trim_quotes output_var input)
    string(REGEX REPLACE "^\"|\"\n?$" "" ${output_var} "${input}")
endmacro()
