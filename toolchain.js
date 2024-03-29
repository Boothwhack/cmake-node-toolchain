#!/usr/bin/env node

const {parseArgs} = require("./lib/Args");
const CMakeContext = require("./lib/CMakeContext");

(async () => {
    console.log("Argv:", process.argv);

    // look for help argument before anything else
    for (let arg of process.argv.slice(2)) {
        if (arg === "--") break;
        if (arg === "-h" || arg === "--help") {
            console.log(
                "CMake wrapper with NodeJS Toolchain\n" +
                "\n" +
                "Usage:\n" +
                "  toolchain [options] build [--clean]\n" +
                "  toolchain [options] install\n" +
                "\n" +
                "Options:\n" +
                "  -h, --help                       Show this message\n" +
                "  -S <path>, --source-dir=<path>   CMake project source directory. Defaults to current working directory.\n" +
                "  -B <path>, --build-dir=<path>    Build directory, relative to the source directory. Defaults to 'build'.\n" +
                "  --config <config>                CMake build configuration; Debug, Release, etc.\n" +
                "\n" +
                "Build options:\n" +
                "  -c, --clean                      Clean build directory before building.\n" +
                "  -t <tgt...>, --target=<tgt>      Specify which CMake target(s) to build."
            );
            return;
        }
    }

    const {options: {sourceDir, buildDir, config}, command: {command, options: {clean, targets}}, rest} = parseArgs(
        process.argv.slice(2),
        {
            options: {
                sourceDir: {
                    flag: ["-S", "--source-dir"],
                    value: "path",
                },
                buildDir: {
                    flag: ["-B", "--build-dir"],
                    value: "path",
                },
                config: {
                    flag: ["--config"],
                    value: "config",
                }
            },
            commands: [
                {
                    name: "build",
                    options: {
                        clean: {
                            flag: ["-c", "--clean"],
                        },
                        targets: {
                            flag: ["-t", "--target"],
                            value: "tgt...",
                            variadic: true,
                        }
                    },
                },
                {
                    name: "install",
                }
            ],
        },
    );

    switch (command) {
        case "build": {
            const cmake = new CMakeContext({sourceDir, buildDir});

            const buildArguments = [];
            if (config !== undefined) buildArguments.push("--config", config);
            if (Array.isArray(targets) && targets.length > 0)
                buildArguments.push("-t", ...targets);

            await cmake.setupBuildDir(clean);
            await cmake.configure(rest);
            await cmake.build(buildArguments);

            break;
        }
        case "install": {
            const cmake = new CMakeContext({sourceDir, buildDir});

            const extraOptions = [];
            if (config !== undefined) extraOptions.push("--config", config);

            await cmake.install(extraOptions);

            break;
        }
    }
})().catch(error => {
    console.error(error);
    process.exitCode = error.statusCode !== undefined ? error.statusCode : 1;
})
