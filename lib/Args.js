const asArray = it => Array.isArray(it) ? it : [it];

function parseValue(args, option, argValue) {
    if (!option.value) {
        return true;
    }
    if (argValue !== undefined) {
        return option.variadic ? [argValue] : argValue;
    }

    if (args.length === 0) throw new Error(`No value provided for option: --${argKey}`);

    // variadic options take all until next '-'
    if (option.variadic) {
        let end = args.findIndex(it => it.startsWith('-'));
        // consume manual end '-'
        // 'command' should not be parsed as variadic argument: --variadic-opt a b - command
        if (args[end] === "-") ++end;

        // no values before next flag
        if (end === 0) {
            return [];
        } else
            // values continue until end of args
        if (end === -1) {
            // no args after variadic values, clear args array
            return args.splice(0);
        } else {
            return args.splice(0, end);
        }
    } else {
        return args.shift();
    }
}

function parseOptions(args, options) {
    if (!options || args.length === 0) return {};

    const longNameLookup = {};
    const shortNameLookup = {};

    Object.entries(options)
        .forEach(([name, option]) => {
            asArray(option.flag)
                .forEach(flag => {
                    if (flag.startsWith("--")) longNameLookup[flag.slice(2)] = {name, option};
                    else shortNameLookup[flag.slice(1)] = {name, option};
                });
        });

    let results = {};

    while (args.length > 0 && args[0] !== "--" && args[0].startsWith('-')) {
        const arg = args.shift();

        if (arg.startsWith("--")) {
            let argKey = arg.slice(2);
            let argValue;
            if (argKey.includes('='))
                [argKey, argValue] = argKey.split('=', 2);

            const option = longNameLookup[argKey];
            if (option === undefined) throw new Error(`Unknown option provided: --${argKey}`);
            // variadic options can be provided multiple times, but regular options can not.
            if (!option.option.variadic && results[argKey] !== undefined) throw new Error(`Duplicate option provided: --${argKey}`);

            const value = parseValue(args, option.option, argValue);
            // merge variadic argument with previous
            if (Array.isArray(results[option.name]) && Array.isArray(value))
                results[option.name].push(...value);
            else
                results[option.name] = value;
        } else {
            let shortArgs = arg.slice(1);
            while (shortArgs.length > 0) {
                const name = shortArgs.charAt(0);
                shortArgs = shortArgs.slice(1);

                const option = shortNameLookup[name];
                if (option === undefined) throw new Error(`Unknown option provided: -${name}`);
                if (!option.option.variadic && results[name] !== undefined) throw new Error(`Duplicate option provided: -${name}`);

                let argValue;
                // equals sign interprets remaining as option value
                if (shortArgs.charAt(0) === '=') {
                    argValue = shortArgs.slice(1)
                    shortArgs = "";
                // take remaining as value if option expects a value
                } else if (option.option.value && shortArgs.length > 0) {
                    argValue = shortArgs;
                    shortArgs = "";
                }
                const value = parseValue(args, option.option, argValue);
                if (Array.isArray(results[option.name]) && Array.isArray(value))
                    results[option.name].push(...value);
                else
                    results[option.name] = value;
            }
        }
    }

    return results;
}

function parseCommand(args, commands) {
    const arg = args[0];
    if (arg === "--") return undefined;

    const command = commands.find(it => it.name === arg)
    if (command === undefined) throw new Error(`Unrecognized command: ${arg}`);

    args.shift();
    return {command: command.name, options: parseOptions(args, command.options)};
}

function parseArgs(args, opts) {
    const output = {
        options: parseOptions(args, opts.options),
    };
    if (opts.command) {
        output.commands = parseCommand(args, opts.commands);
    }
    if (args.length > 0 && args[0] === "--") {
        output.rest = args.slice(1);
    }

    return output;
}

module.exports = {parseArgs, parseOptions, parseCommand};
