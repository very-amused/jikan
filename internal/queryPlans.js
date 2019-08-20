/* Function to select an SQL table as an array, where each item is an object
containing key value pairs that correspond to the data entries in a row */
async function selectTableAsArray(tableName, conn) {
    const table = await conn.query(`SELECT * FROM ${tableName}`);
    const dataArray = [];
    table.forEach(row => {
        dataArray.push(row);
    }); // A forEach loop is used to convert the sql table to an array
    return dataArray;
}

exports.queryPlans = async function(pool, client) {
    // Connect to the db
    const conn = await pool.getConnection();

    // Select all tasks in the Tasks table of the database
    const plans = await selectTableAsArray('Plans', conn);

    // Use moment to check if each timestamp has elapsed, and remind the user of their task if it has
    const moment = require('moment');
    plans.forEach(async plan => {
        const timestamp = moment.utc(plan.Timestamp);
        const now = moment.utc();
        // If the timestamp has elapsed, send the user a reminder of their task
        if (now.isSameOrAfter(timestamp)) { 
            client.users.get(plan.UserID).send({embed: {
                color: 0x00bfff,
                title: 'Reminder:',
                description: plan.Message
            }});

            // Delete the row from the table
            await conn.query('DELETE FROM Plans WHERE Timestamp = ? AND UserID = ?',
            [plan.Timestamp, plan.UserID]);
        }
    });

    // Close the database connection
    conn.end();
};