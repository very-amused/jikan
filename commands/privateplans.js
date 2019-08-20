exports.run = async function(args, client, message) {
    // Function to select a column from an SQL table and convert it to an array
    async function selectRowsConditional(table, condition, conn) {
        const sqlColumn = await conn.query(`SELECT * FROM ${table} WHERE ${condition}`);
        const dataArray = [];
        sqlColumn.forEach(row => {
            dataArray.push(row);
        }); // A forEach loop is used to convert the sql column to an array
        return dataArray;
    }

    // Prompt the user for their password
    await message.channel.send({embed: {
        color: 0x00bfff,
        description: 'Please enter your Jikan password for decryption'
    }});

    // awaitMessages() is used to collect the user's response
    const filter = m => {
        return m.author.id === message.author.id;
    };
    const collected = await message.channel.awaitMessages(filter, {max: 1});
    const password = collected.first().content;

    // Select the user's private key and try to decrypt it
    const conn = await client.pool.getConnection();
    const crypto = require('crypto');
    let encryptedPrivateKey = await conn.query('SELECT PrivateKey FROM Keys_ WHERE UserID = ?',
    [message.author.id]);
    encryptedPrivateKey = encryptedPrivateKey[0].PrivateKey;

    let privateKey;
    try {
        privateKey = await crypto.createPrivateKey({
            key: encryptedPrivateKey,
            format: 'pem',
            passphrase: password
        });
    }
    /* Throw an error if the decryption of the private key fails
    due to an incorrect passphrase or any other error */
    catch (err) {
        if (err.code === 'ERR_OSSL_EVP_BAD_DECRYPT') {
            conn.end();
            throw 'Incorrect password';
        }
        else {
            conn.end();
            throw new Error(err);
        }
    }

    // Select the user's encrypted private plans from the database
    const privatePlans = await selectRowsConditional('Private_Tasks',
    `UserID = ${message.author.id}`, conn);
    conn.end(); // The database connection is closed because it no longer needs to be used

    // Create an embed template
    const embed = {
        color: 0x00bfff,
        title: 'Your private (encrypted) plans:',
        fields: []
    };

    privatePlans.forEach(row => {
        const encryptedMessage = row.Message;

        const moment = require('moment');
        const timestamp = moment.utc(row.Timestamp);
        const now = moment.utc();
        /* The line below generates a human-friendly string stating the remaining time
        before a reminder of a task will be sent */
        const distance = moment.duration(timestamp.diff(now)).humanize(true);

        // Decrypt each task message using the user's private key
        const message = crypto.privateDecrypt(privateKey, encryptedMessage).toString();
        
        embed.fields.push({
            name: message,
            value: distance
        });
    });

    // Add a message if there are no plans
    if (!privatePlans.length) {
        embed.description = 'You have no current plans, you can create some with `!privateplan`';
    }

    // Send the user a list of their private plans in the form of an embed
    message.channel.send({embed: embed});
};