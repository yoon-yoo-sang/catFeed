var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'nodejs',
  password : 'dd5404',
  database : 'catfeed'
});
 
connection.connect();
 
connection.query('SELECT * FROM feed_name', function (error, results, fields) {
  if (error){
      console.log(error)
  };
  console.log(results);
});
 
connection.end();