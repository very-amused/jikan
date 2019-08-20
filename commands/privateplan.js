exports.run = async function(args, client, message) {
    // Connect to the database
    let conn = await client.pool.getConnection();

    // Check if the user already has a key pair generated (a password set)
    const passwordCheck = await conn.query('SELECT UserID FROM Keys_ WHERE UserID = ?',
    [message.author.id]);
    conn.end();
    if (!passwordCheck.length) {
        throw 'You need to have a password set to use this command. You can set one using `!setpassword`';
    }

    // Check if the command is formatted properly
    if (!args.length) {
        throw 'No plan is supplied';
    }
    else if (!args.includes('in')) {
        throw `You must use the keyword 'in' to specify a time to be reminded of your plan\n
        Example: \`\`\`!plan improve my bot in 2h 30m\`\`\``;
    }

    // Parse command args
    /* The split term is surrounded by a whitespace character on each side
    to prevent splitting in the middle of a word that contains 'in'*/
    args = args.split(' in ');
    if (!args[1]) {
        throw 'No timestamp is given for the reminder';
    }
    const plan = args[0].trim();
    if (plan.length > 1000) {
        throw 'Maximum length for a message is 1,000 characters';
    }
    const timeDistance = args[1].trim();

    function parseTimeIncrement(increment) {
        /* Generate regex to select the correct increment from the message, then parse the integer
        For example, if 'seconds' is provided as the increment,
        it will select values such as 5s or 10 seconds */
        const regex = new RegExp(`\\d+${increment.charAt(0)}\\b|\\d+ ${increment}\\b`);
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

    // Create a local and UTC timestamp specifying when the plan is set for
    const moment = require('moment');
    const UTCTimestamp = moment.utc().add(difference).format('YYYY-MM-DD HH:mm:ss');
    const localTimestamp = moment().add(difference).format('YYYY-MM-DD HH:mm:ss');

    // Create an embed template
    const embed = {
        color: 0x00bfff,
        title: 'Private plan created!',
        description: `I'll remind you to \`${plan}\` in...`,
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

    // Encrypt the message using the user's keypair
    conn = await client.pool.getConnection();
    const crypto = require('crypto');
    // Get the user's public key from the database
    let publicKey = await conn.query('SELECT PublicKey FROM Keys_ WHERE UserID = ?',
    [message.author.id]);
    publicKey = publicKey[0].PublicKey;
    // crypto.publicEncrypt() requires a buffer to encrypt, not a string
    const encryptedPlan = crypto.publicEncrypt(publicKey, Buffer.from(plan));

    // Insert the timestamp into the db
    conn = await client.pool.getConnection();
    conn.query('INSERT INTO Private_Plans (Timestamp, Message, UserID) VALUES (?, ?, ?)',
    [`${UTCTimestamp}+0000`, encryptedPlan, message.author.id]);
    conn.end();

    await message.channel.send({embed: embed});
};