const mysql = require("mysql");
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "jerusha@666",
  database: "hardware_logsheet",
  timezone: "Asia/Kolkata",
});
connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database!");
});
module.exports = connection;
