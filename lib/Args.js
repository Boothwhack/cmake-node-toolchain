const asArray = it => Array.isArray(it) ? it : [it];

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
            let name = arg.slice(2);
            let value;
            if (name.includes('='))
                [name, value] = name.split('=', 2);

            const option = longNameLookup[name];
            if (option === undefined) throw new Error(`Unknown option provided: --${name}`);
            if (results[name] !== undefined) throw new Error(`Duplicate option provided: --${name}`);

            if (option.option.value) {
                if (value === undefined) {
                    if (args.length === 0) throw new Error(`No value provided for option: -${name}`);
                    value = args.shift();
                }
                results[name] = value;
            } else
                results[name] = true;

        } else {
            let shortArgs = arg;
            while (shortArgs = shortArgs.slice(1), shortArgs.length > 0) {
                const name = shortArgs.charAt(0);
                const option = shortNameLookup[name];
                if (option === undefined) throw new Error(`Unknown option provided: -${name}`);
                if (results[name] !== undefined) throw new Error(`Duplicate option provided: -${name}`);

                if (option.option.value !== undefined) {
                    if (shortArgs.length > 1) {
                        if (shortArgs.charAt(1) === '=') {
                            results[option.name] = shortArgs.slice(2);
                        } else {
                            // parse remaining as this options value
                            results[option.name] = shortArgs.slice(1);
                        }
                    } else {
                        // parse next argument as this options value
                        if (args.length === 0) throw new Error(`No value provided for option: -${name}`);
                        results[option.name] = args.shift();
                    }
                } else
                    results[option.name] = true;
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
    const options = parseOptions(args, opts.options);
    const command = parseCommand(args, opts.commands);

    const rest = args.length > 0 && args[0] === "--"
        ? args.slice(1)
        : undefined;

    return {
        options,
        command,
        rest,
    };
}

module.exports = {parseArgs, parseOptions, parseCommand};
