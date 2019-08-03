exports.run = async function(args, client, message) {
    const initialTime = Date.now();
    const msg = await message.channel.send({embed: {
        color: 0x00bfff,
        title: 'Pong!',
        description: `Average heartbeat ping: ${Math.floor(client.ping)}ms`
    }});
    const roundTrip = Date.now() - initialTime;
    msg.edit({embed: {
        color: 0x00bfff,
        title: 'Pong!',
        description: `Average heartbeat ping: ${Math.floor(client.ping)}ms\n
        Message roundtrip ping: ${roundTrip}ms`
    }});
};