exports.run = async function(args, client, message) {
    if (args.startsWith('```js')) {
        args = args.slice(5, -4);
    }
    else if (args.startsWith('```')) {
        args = args.slice(3, -4);
    }
    try {
        const returns = eval(args);
        if (returns.length) {
            await message.channel.send(returns);
        }
    }
    catch (err) {
        throw new Error(err);
    }
};