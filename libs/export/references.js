/**
 * Updated by Rohit on 1/10/19.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  fs = require("fs"),
  when = require("when"),
  guard = require("when/guard"),
  parallel = require("when/parallel"),
  sequence = require("when/sequence"),
  limit = 3;
/**
 * Internal module Dependencies.
 */

var helper = require("../utils/helper");
var referencesConfig = config.modules.references,
  referencesFolderPath = path.resolve(config.data, referencesConfig.dirName);
/**
 * Create folders and files
 */
mkdirp.sync(referencesFolderPath);
if (!fs.existsSync(referencesFolderPath)) {
  mkdirp.sync(referencesFolderPath);
  helper.writeFile(path.join(referencesFolderPath, referencesConfig.fileName));
} else {
  helper.writeFile(path.join(referencesFolderPath, referencesConfig.fileName));
}

function ExtractPosts() {
  this.connection = helper.connect();
}

ExtractPosts.prototype = {
  putPosts: function (postsdetails, key) {
    return when.promise(function (resolve, reject) {
      var referenceData = helper.readFile(
        path.join(
          process.cwd(),
          "drupalMigrationData",
          "references",
          "references.json"
        )
      );

      postsdetails.map((data) => {
        referenceData[`content_type_entries_title_${data.uid}`] = {
          uid: `content_type_entries_title_${data.uid}`,
          _content_type_uid: key,
        };
        helper.writeFile(
          path.join(
            process.cwd(),
            "drupalMigrationData",
            "references",
            "references.json"
          ),
          JSON.stringify(referenceData, null, 4)
        );
      });
      resolve();
    });
  },
  getQuery: function (pagename, skip, queryPageConfig, countentry) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var query = queryPageConfig["page"]["" + pagename + ""];
      query = query + " limit " + skip + ", " + limit;
      self.connection.query(query, function (error, rows, fields) {
        if (!error) {
          if (rows.length > 0) {
            self
              .putPosts(rows, pagename, countentry)
              .then(function (results) {
                resolve(results);
              })
              .catch(function () {
                reject();
              });
          } else {
            resolve();
          }
        } else {
          reject(error);
        }
      });
    });
  },
  getPageCount: function (pagename, countentry, queryPageConfig) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var _getPage = [];

      for (var i = 0, total = countentry; i < total; i += limit) {
        _getPage.push(
          (function (data) {
            return function () {
              return self.getQuery(pagename, data, queryPageConfig, countentry);
            };
          })(i)
        );
      }
      var guardTask = guard.bind(null, guard.n(1));
      _getPage = _getPage.map(guardTask);
      var taskResults = parallel(_getPage);
      taskResults
        .then(function (results) {
          resolve();
        })
        .catch(function (e) {
          errorLogger(
            "something wrong while referencing entries" + pagename + ":",
            e
          );
          reject(e);
        });
    });
  },
  getPageCountQuery: function (pagename, queryPageConfig) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var query = queryPageConfig["count"]["" + pagename + "Count"];
      self.connection.query(query, function (error, rows, fields) {
        if (!error) {
          var countentry = rows[0]["countentry"];
          if (countentry > 0) {
            self
              .getPageCount(pagename, countentry, queryPageConfig)
              .then(function () {
                resolve();
              })
              .catch(function () {
                reject();
              });
          } else {
            resolve();
          }
        } else {
          reject(error);
        }
      });
    });
  },

  start: function () {
    var self = this;
    successLogger("Exporting references...");

    return when.promise(function (resolve, reject) {
      var queryPageConfig = helper.readFile(
        path.join(process.cwd(), "drupalMigrationData", "query", "index.json")
      );
      var pagequery = queryPageConfig.page;
      var _getPage = [];

      for (var key in pagequery) {
        _getPage.push(
          (function (key) {
            return function () {
              return self.getPageCountQuery(key, queryPageConfig);
            };
          })(key)
        );
      }
      var taskResults = sequence(_getPage);
      taskResults
        .then(function (results) {
          self.connection.end();
          resolve();
        })
        .catch(function (e) {
          errorLogger(
            "something wrong while referencing entries " + key + ": ",
            e
          );
          reject(e);
        });
    });
  },
};

module.exports = ExtractPosts;
