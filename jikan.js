// Initialize Discord.js
const Discord = require('discord.js');
const client = new Discord.Client();
const {owners, token} = require('./config.json');

// Load commands
const {loadCommands} = require('./internal/commandHandler');
const {commands, ownerCommands} = loadCommands();

client.login(token);

client.on('ready', () => {
    console.log('Jikan is up and ready for use!'); // eslint-disable-line no-console
});

client.on('message', message => {
    const prefix = '!';
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    
    // Get command args from messages
	const command = message.content.slice(prefix.length).split(/ +/).shift().toLowerCase();
    const args = message.content.slice(prefix.length + command.length).trim();
    
    // Run the command
    if (command in commands) {
        commands[command].run(args, client, message);
    }
    // Some commands are reserved for use by bot owners
    else if (command in ownerCommands && owners.includes(message.author.id)) {
        ownerCommands[command].run(args, client, message);
    }
});