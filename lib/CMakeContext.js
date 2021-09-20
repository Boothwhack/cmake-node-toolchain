const Path = require("path");
const {spawn} = require("child_process");
const FS = require("fs/promises");

class CMakeContext {
    constructor({sourceDir, buildDir} = {}) {
        this.sourceDir = Path.resolve(process.cwd(), sourceDir || "");
        this.buildDir = Path.resolve(this.sourceDir, buildDir || "build");
    }

    async execute(command, args, opts = {}) {
        console.debug("Executing:", command, args, "with options:", opts);

        return new Promise((resolve, reject) => {
            const p = spawn(command, args, {
                cwd: this.buildDir,
                stdio: "inherit",
                ...opts,
            });
            p.on("exit", code => {
                if (code !== 0) reject(new Error(`Process exited with code: ${code}`));
                else resolve();
            });
        })
    }

    async setupBuildDir(clean) {
        if (clean)
            await this.execute("cmake", ["-E", "rm", "-rf", this.buildDir], {cwd: this.sourceDir});
        await FS.mkdir(this.buildDir, {recursive: true});
    }

    async configure() {
        return this.execute(
            "cmake",
            [
                "--toolchain",
                Path.resolve(__dirname, "..", "node.cmake"),
                "-S",
                this.sourceDir,
                "-B",
                this.buildDir,
            ],
        );
    }

    async build(extraOptions) {
        return this.execute(
            "cmake",
            [
                "--build",
                this.buildDir,
                ...extraOptions,
            ],
        );
    }

    async install(extraOptions) {
        return this.execute(
            "cmake",
            [
                "--install",
                this.buildDir,
                ...extraOptions,
            ],
        );
    }
}

module.exports = CMakeContext;
