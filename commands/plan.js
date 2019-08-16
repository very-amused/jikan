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

    function parseTimeIncrement(increment) {
        /* Generate regex to select the correct increment from the message, then parse the integer
        For example, if 'seconds' is provided as the increment,
        it will select values such as 5s or 10 seconds */
        const regex = new RegExp(`\\d${increment.charAt(0)}\\b|\\d ${increment}\\b`);
        let parsed = parseInt(timeDistance.match(regex));

        // Set the value to 0 if none of that increment can be parsed
        parsed = parsed ? parsed : 0;
        return parsed;
    }

    // Parse the days, hours, minutes, and seconds values from the command
    const days = parseTimeIncrement('days');
    const hours = parseTimeIncrement('hours');
    const minutes = parseTimeIncrement('minutes');
    const seconds = parseTimeIncrement('seconds');

    // Throw an error if no timestamp data can be parsed
    if (!(days || hours || minutes || seconds)) {
        throw 'A validtimestamp either can\'t be found or isn\'t specified';
    }

    // Organize the time difference parsed from the message as an object
    const difference = {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds
    };

    // Create a local and UTC timestamp specifying when the task is planned for
    const moment = require('moment');
    const UTCTimestamp = moment.utc().add(difference).format('YYYY-MM-DD HH:mm:ss');
    const localTimestamp = moment().add(difference).format('YYYY-MM-DD HH:mm:ss');

    // Create an embed template
    const embed = {
        color: 0x00bfff,
        title: 'Plan created!',
        description: `I'll remind you to \`${task}\` in...`,
        fields: [],
        footer: {
            text: `Local Timestamp: ${localTimestamp}, UTC Timestamp: ${UTCTimestamp}`
        }
    };

    // Add corresponding fields for days, hours, minutes, and seconds in the embed
    for (const i in difference) { // For each key-value pair in the difference object
        if (difference[i]) { // If the value isn't 0
            embed.fields.push({ // Add a field for it to the embed
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