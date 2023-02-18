import {describe, it} from "mocha";
import Chai from "chai";
import DeepEql from "deep-eql";
import {parseArgs} from "../lib/Args.js";

Chai.should();
Chai.use(DeepEql);

describe("Args", function () {
    it("should parse basic options", function () {
        const definition = {
            options: {
                testOption: {
                    flag: ["-t", "--test"],
                    value: "test",
                },
            },
        };
        parseArgs(["--test", "value1"], definition)
            .should.deep.eq({options: {testOption: "value1"}});
        parseArgs(["--test=value2"], definition)
            .should.deep.eq({options: {testOption: "value2"}});
        parseArgs(["-t=value3"], definition)
            .should.deep.eq({options: {testOption: "value3"}});
        parseArgs(["-t", "value4"], definition)
            .should.deep.eq({options: {testOption: "value4"}});
    });

    it("should interpret characters immediately after short name as value", function () {
        const definition = {
            options: {
                output: {
                    flag: ["-o", "--output"],
                    value: "path",
                },
                include: {
                    flag: ["-I"],
                    value: "path",
                },
            },
        };
        parseArgs(["-I/usr/lib", "-o", "out.file"], definition)
            .should.deep.eq({options: {output: "out.file", include: "/usr/lib"}});
    });

    it("should parse short names tightly packed", function () {
        const definition = {
            options: {
                optionA: {
                    flag: ["-a", "--opt-a"],
                    // this option is just a flag
                    value: false,
                },
                optionB: {
                    flag: ["-b", "--opt-b"],
                    value: "opt-b",
                },
            },
        };
        parseArgs(["-a", "-b", "value1"], definition)
            .should.deep.eq({options: {optionA: true, optionB: "value1"}});
        parseArgs(["-ab", "value2"], definition)
            .should.deep.eq({options: {optionA: true, optionB: "value2"}});
    });

    it("should parse variadic arguments as space separated list after flag", function () {
        const definition = {
            options: {
                varOption: {
                    flag: ["-v", "--var-opt"],
                    value: "t...",
                    variadic: true,
                },
                otherOption: {
                    flag: ["-t", "--test"],
                    value: "test",
                },
            },
        };
        parseArgs(["-v", "value-a", "value-b", "value-c", "-t", "test-value"], definition)
            .should.deep.eq({options: {varOption: ["value-a", "value-b", "value-c"], otherOption: "test-value"}});
    });

    it("should allow variadic option to be specified multiple times", function () {
        const definition = {
            options: {
                output: {
                    flag: ["-o", "--output"],
                    value: "path",
                },
                include: {
                    flag: ["-I"],
                    value: "path",
                    variadic: true,
                },
            },
        };
        parseArgs(["-Ipath1", "-o", "out.file", "-Ipath2"], definition)
            .should.deep.eq({options: {include: ["path1", "path2"], output: "out.file"}});
        parseArgs(["-I", "path1", "path2", "-o=out.file", "-Ipath3", "-I=path4"], definition)
            .should.deep.eq({
            options: {
                include: ["path1", "path2", "path3", "path4"],
                output: "out.file",
            },
        });
    });
});
