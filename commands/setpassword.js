exports.run = async function(args, client, message) {
    // Connect to the database
    let conn = await client.pool.getConnection();

    // Check if the user already has a key pair generated (a password set)
    const passwordCheck = await conn.query('SELECT UserID FROM Keys_ WHERE UserID = ?',
    [message.author.id]);
    const fs = require('fs');
    const existingPasswordWarning = fs.readFileSync('./data/passwordwarning2.txt', 'utf8');
    if (passwordCheck.length) {
        conn.end();
        throw existingPasswordWarning;
    }
    conn.end();

    // Send the user a warning of the security level of Jikan passwords
    const securityWarning = fs.readFileSync('./data/passwordwarning.txt', 'utf8');
    await message.channel.send({embed: {
        color: 0xFF0000,
        title: 'WARNING:',
        description: `\`\`\`${securityWarning}\`\`\``,
        footer: {
            text: 'If you understand the level of security of Jikan passwords, and would like to continue to set one, reply \'y\''
        }
    }});

    // Wait for a reply to the warning message, and return if the user canceled setting their password
    const filter = m => {
        return m.author.id === message.author.id;
    };
    let collected = await message.channel.awaitMessages(filter, {max: 1});
    if (collected.first().content.toLowerCase() !== 'y') {
        await message.channel.send({embed: {
            color: 0x00bfff,
            description: 'Your password has not been set'
        }});
        return;
    }

    // Prompt the user to reply with a password
    await message.channel.send({embed: {
        color: 0x00bfff,
        description: 'Reply to this message with what you would like to set your Jikan password to...'
    }});
    collected = await message.channel.awaitMessages(filter, {max: 1});
    const password = collected.first().content;

    // Generate an RSA key pair using the password for encryption
    const crypto = require('crypto');
    /* util.promisify() is used to convert the keypair generation callback into a promise returning
    an object, which can be assigned to a variable with await */
    const util = require('util');
    const generateKeyPairPromise = util.promisify(crypto.generateKeyPair);
    // The private key is encrypted using an AES 128-bit cipher
    const keys = await generateKeyPairPromise('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-128-cbc',
            passphrase: password
        }
    });

    // Store the keys in the database
    conn = await client.pool.getConnection();
    conn.query('INSERT INTO Keys_ (UserID, PublicKey, PrivateKey) VALUES (?, ?, ?)',
    [message.author.id, keys.publicKey, keys.privateKey]);
    conn.end();

    /* Send the user confirmation that their password has been set (even though the passwords themselves
    aren't actually stored in the database) */
    await message.channel.send({embed: {
        color: 0x00bfff,
        description: 'Your password has successfully been set, remember not to forget it or you\'ll lose access to your private tasks'
    }});
};