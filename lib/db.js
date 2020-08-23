const mysql = require('mysql');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'nodejs',
    password: 'dd5404',
    database: 'catfeed'
});
db.connect();
module.exports = db;