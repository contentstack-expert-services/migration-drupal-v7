var sequence = require("when/sequence");
global.config = require("./config");
// global.querypageconfig = require('./query');
global.errorLogger = require("./libs/utils/logger.js")("error").error;
global.successLogger = require("./libs/utils/logger.js")("success").log;
global.warnLogger = require("./libs/utils/logger.js")("warn").log;

// var modulesList = ['query','contentTypes','vocabulary','assets','authors','taxonomy','page'];
var modulesList = [
  "query",
  //   "locales",
  "assets",
  "vocabulary",
  "references",
  "contentTypes",
  "authors",
  "taxonomy",
  "page",
];
//var modulesList = ['contentTypes'];
var _export = [];
var database = config.mysql.database;
global.filePath = undefined;

// Module List for Entries
for (var i = 0, total = modulesList.length; i < total; i++) {
  var ModuleExport = require("./libs/export/" + modulesList[i] + ".js");
  var moduleExport = new ModuleExport();
  _export.push(
    (function (moduleExport) {
      return function () {
        return moduleExport.start(database);
      };
    })(moduleExport)
  );
}

var taskResults = sequence(_export);

taskResults
  .then(async function (results) {
    successLogger(
      "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nData exporting has been completed"
    );
    // await StackCloneCommand.run(); // to run to fetch stack from CS
  })
  .catch(function (error) {
    errorLogger(error);
  });
