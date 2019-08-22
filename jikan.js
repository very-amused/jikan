// Initialize Discord.js
const Discord = require('discord.js');
const client = new Discord.Client();
const {owners, token} = require('./config.json');

// Load commands
const {loadCommands} = require('./internal/commandHandler');
const {commands, ownerCommands} = loadCommands();

// Initialize MariaDB
const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: '208.167.233.12',
    user: 'testing',
    password: process.env.MARIADB_PASS, // $MARIADB_PASS environment variable
    database: 'jikan_testing'
});
client.pool = pool; // Attach db pool to the client object

client.login(token);

// This is ran once all commands are loaded
client.on('ready', () => {
    console.log('Jikan is up and ready for use!'); // eslint-disable-line no-console
});

/* Functions run at a 1 second interval to query the database for plans
and send the user a reminder if the timestamp for a plan has passed */
const {queryPlans, queryPrivatePlans} = require('./internal/queryPlans');
setInterval(() => {
    queryPlans(pool, client);
    queryPrivatePlans(pool, client);
}, 1000);

client.on('message', async message => {
    const prefix = '!';
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    
    // Get command args from messages
	const command = message.content.slice(prefix.length).split(/ +/).shift().toLowerCase();
    const args = message.content.slice(prefix.length + command.length).trim();
    
    try {
		if (command in commands) {
            // Run the command
			await commands[command].run(args, client, message);
		}
        // Some commands are reserved for use by bot owners
        else if (command in ownerCommands && owners.includes(message.author.id)) {
			await ownerCommands[command].run(args, client, message);
		}
	}
	catch (err) {
		message.channel.send({embed: {
			color: 0xDC143C,
            title: 'ERROR:',
            description: err.message ? err.message : err
		}});
	}
});