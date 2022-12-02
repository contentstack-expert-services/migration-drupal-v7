var mysql = require("mysql");
var chalk = require("chalk");

function ExtractAssets() {}
ExtractAssets.prototype = {
  start: function () {
    var connection = mysql.createConnection({
      host: config["mysql"]["host"],
      user: config["mysql"]["user"],
      password: config["mysql"]["password"],
      database: config["mysql"]["database"],
    });
    connection.connect((err) => {
      if (err) {
        console.log(
          chalk.red(
            "\nCannot connect to database please check entered detais!\n"
          )
        );
      } else {
        console.log(chalk.green("\nconnected to database successfully!\n"));
      }
    });

    connection.end();
  },
};
module.exports = ExtractAssets;
