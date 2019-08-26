const sqlHelper = require('./sqlHelper');

exports.queryPlans = async function(pool, client) {
    // Connect to the db
    const conn = await pool.getConnection();

    // Select all plans in the Pasks table of the database
    const plansData = await conn.query('SELECT * FROM Plans');
    const plans = await sqlHelper.dataToArray(plansData);

    // Use moment to check if each timestamp has elapsed, and remind the user of their plan if it has
    const moment = require('moment');
    plans.forEach(async plan => {
        const timestamp = moment.utc(plan.Timestamp);
        const now = moment.utc();
        // Get the Discord user by their ID stored in the database
        const user = await client.fetchUser(plan.UserID);

        if (!now.isSameOrAfter(timestamp)) {
            return;
        }

        user.send({embed: {
            color: 0x00bfff,
            title: 'Reminder:',
            description: plan.Message
        }});

        // Delete the row from the table
        await conn.query('DELETE FROM Plans WHERE Timestamp = ? AND UserID = ?',
        [plan.Timestamp, plan.UserID]);
    });

    // Close the database connection
    conn.end();
};

exports.queryPrivatePlans = async function(pool, client) {
    // Connect to the db
    const conn = await client.pool.getConnection();

    // Select all plans in the Pasks table of the database
    const privatePlansData = await conn.query('SELECT * FROM Private_Plans');
    const privatePlans = await sqlHelper.dataToArray(privatePlansData);

    // Use moment to check if each timestamp has elapsed, and remind the user of their plan if it has
    const moment = require('moment');
    privatePlans.forEach(async plan => {
        const timestamp = moment.utc(plan.Timestamp);
        const now = moment.utc();

        // Get the Discord user by their ID stored in the database
        const user = await client.fetchUser(plan.UserID);

        if (!now.isSameOrAfter(timestamp) || plan.AwaitingDecryption) {
            return;
        }

        /* If the timestamp has elapsed and isn't already awaiting decryption,
        send the user a prompt to decrypt their plan */
        const msg = await user.send({embed: {
            color: 0x00bfff,
            title: 'Reminder:',
            description: 'You have a reminder to view for an encrypted plan, please enter your Jikan password to decrypt it and view your reminder\'s message...'
        }});

        // Mark that the plan is awaiting decryption to avoid duplicates of the prompt being sent
        await conn.query(`UPDATE Private_Plans SET AwaitingDecryption = 1
        WHERE UserID = ? AND Timestamp = ?`, [plan.UserID, plan.Timestamp]);

        const filter = m => {
            return m.author.id === plan.UserID;
        };
        const collected = await msg.channel.awaitMessages(filter, {max: 1});
        const password = collected.first().content;

        // Select the user's private key and try to decrypt it
        const crypto = require('crypto');
        let encryptedPrivateKey = await conn.query('SELECT PrivateKey FROM Keys_ WHERE UserID = ?',
        [plan.UserID]);
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

        // Decrypt the message and send it back to the user
        const encryptedMessage = plan.Message;
        const message = crypto.privateDecrypt(privateKey, encryptedMessage).toString();

        await user.send({embed: {
            color: 0x00bfff,
            title: 'Reminder:',
            description: message
        }});
    
        // Delete the row from the table
        await conn.query('DELETE FROM Private_Plans WHERE Timestamp = ? AND UserID = ?',
        [plan.Timestamp, plan.UserID]);
    });
    
    // Close the database connection
    conn.end();
};