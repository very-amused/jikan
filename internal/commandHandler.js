/* eslint-disable no-console */
exports.loadCommands = function() {
    const fs = require('fs');
    // Create two objects, one for general commands, one for owner-only commands
    const commands = {};
    const ownerCommands = {};
    fs.readdir('./commands', (err, files) => {
        if (err) console.err(err);
        files.forEach(file => {
            // Ignore non-javascript files
            if (!file.endsWith('.js')) return;

            // Parsing
            file = file.split('.')[0];
            let ownerCommand;
            let commandName;
            /* Owner command files start with the prefix 'owner_', so if the filename begins with that prefix
            the command name is parsed differently and the command is loaded to a different object
            for owner only commands */
            if (file.startsWith('owner_')) {
                ownerCommand = true;
                commandName = file.split('_'[1]);
            }
            else {
                commandName = file;
            }

            // Load owner only commands
            if (ownerCommand) {
                console.log(`Attempting to load owner only command ${commandName}`);
                ownerCommands[commandName] = require(`../commands/${file}`);
            }
            else {
                console.log(`Attempting to load command ${commandName}`);
                commands[commandName] = require(`../commands/${file}`);
            }
        });
    });
    return {
        commands: commands,
        ownerCommands: ownerCommands
    };
};