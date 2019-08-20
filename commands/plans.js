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

    // Select the user's plans from the database
    const conn = await client.pool.getConnection();
    const plans = await selectRowsConditional('Plans',
    `UserID = ${message.author.id}`, conn);
    conn.end(); // The database connection is closed because it no longer needs to be used

    // Create an embed template
    const embed = {
        color: 0x00bfff,
        title: 'Your plans:',
        fields: []
    };

    // Add a field for each plan to the embed
    plans.forEach(plan => {
        const message = plan.Message;

        // Parse the timestamp with moment and calculate the distance until then
        const moment = require('moment');
        const timestamp = moment.utc(plan.Timestamp);
        const now = moment.utc();
        /* The line below generates a human-friendly string stating the remaining time
        before a reminder of a plan will be sent */
        const distance = moment.duration(timestamp.diff(now)).humanize(true);

        // Add the information to the embed's fields
        embed.fields.push({
            name: message,
            value: distance
        });
    });

    // Add a message if there are no plans
    if (!plans.length) {
        embed.description = 'You have no current plans, you can create some with `!plan`';
    }

    // Send the user a list of their private plans/plans in the form of an embed
    message.channel.send({embed: embed});
};