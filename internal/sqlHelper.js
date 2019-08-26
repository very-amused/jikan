// A small collection of SQL helper functions used in Jikan's code
module.exports = {
    /* Function to convert an SQL table to an array, where each item is an object
    containing key value pairs that correspond to the data entries in a row */
    dataToArray: async function(data) {
        const dataArray = [];
        data.forEach(row => {
            dataArray.push(row);
        }); // A forEach loop is used to convert the SQL table to an array
        return dataArray;
    }
};