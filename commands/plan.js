exports.run = async function(args, client, message) {
    // Check if the command is formatted properly
    if (!args.length) {
        throw 'No task to plan is supplied';
    }
    else if (!args.includes('in')) {
        throw `You must use the keyword 'in' to specify a time to be reminded of your task\n
        Example: \`\`\`!plan improve my bot in 2h 30m\`\`\``;
    }

    // Parse command args
    /* The split term is surrounded by a whitespace character on each side
    to prevent splitting in the middle of a word that contains 'in'*/
    args = args.split(' in ');
    if (!args[1]) {
        throw 'No timestamp is given for the reminder';
    }
    const task = args[0].trim();
    if (task.length > 1000) {
        throw 'Maximum length for a message is 1,000 characters';
    }
    const timeDistance = args[1].trim();

    // Parse the days, hours, and minutes values from the command
    let days = parseInt(timeDistance.match(/\w*d\b|\w* days\b/));
    days = days ? days : 0;
    let hours = parseInt(timeDistance.match(/\w*h\b|\w* hours\b/));
    hours = hours ? hours : 0;
    let minutes = parseInt(timeDistance.match(/\w*m\b|\w* minutes\b/));
    minutes = minutes ? minutes : 0;

    if (!days && !hours && !minutes) {
        throw 'A validtimestamp either can\'t be found or isn\'t specified';
    }

    // Organize the time difference parsed from the message as an object
    const difference = {
        days: days,
        hours: hours,
        minutes: minutes
    };

    // Create a UTC timestamp specifying when the task is planned for
    const moment = require('moment');
    const UTCTimestamp = moment.utc().add(difference).format('YYYY-MM-DD hh:mm:ss');

    // Create an embed template
    const embed = {
        color: 0x00bfff,
        title: 'Plan created!',
        description: `I'll remind you to ${task} in...`,
        fields: [],
        footer: {
            text: `UTC Timestamp: ${UTCTimestamp}`
        }
    };

    // Add corresponding fields for days, hours, and minutes in the embed
    for (const i in difference) {
        if (difference[i]) {
            embed.fields.push({
                // Capitalize the string and add a colon to the end
                name: `${i.charAt(0).toUpperCase()}${i.slice(1)}:`,
                value: difference[i]
            });
        }
    }

    // Insert the timestamp into the db
    const conn = await client.pool.getConnection();
    conn.query('INSERT INTO Tasks (Timestamp, Message, UserID) VALUES (?, ?, ?)',
    [UTCTimestamp, task, message.author.id]);

    await message.channel.send({embed: embed});
};