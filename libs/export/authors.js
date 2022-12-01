/**
 * External module Dependencies.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  fs = require("fs"),
  when = require("when"),
  guard = require("when/guard"),
  parallel = require("when/parallel"),
  phpUnserialize = require("phpunserialize");

/**
 * Internal module Dependencies.
 */
var helper = require("../utils/helper");

var authorConfig = config.modules.authors,
  authorsFolderPath = path.resolve(
    config.data,
    config.entryfolder,
    authorConfig.dirName
  );
limit = 100;

/**
 * Create folders and files
 */
if (!fs.existsSync(authorsFolderPath)) {
  mkdirp.sync(authorsFolderPath);
  helper.writeFile(path.join(authorsFolderPath, authorConfig.fileName));
}

function ExtractAuthors() {
  this.connection = helper.connect();
}

ExtractAuthors.prototype = {
  putAuthors: function (authordetails) {
    return when.promise(function (resolve, reject) {
      var authordata = helper.readFile(
        path.join(authorsFolderPath, authorConfig.fileName)
      );

      let assetId = helper.readFile(
        path.join(process.cwd(), "drupalMigrationData/assets/assets.json")
      );

      authordetails.map(function (data) {
        if (data["name"] !== "") {
          let uid = `${data["uid"]}_${data["name"].toLowerCase()}`;

          var profileimage;

          if (`assets_${data["picture"]}` in assetId) {
            profileimage = assetId[`assets_${data["picture"]}`];
          }

          if (profileimage) {
            authordata[uid] = {
              uid: uid,
              title: data["name"],
              email: data["mail"],
              timezone: data["timezone"],
              admin_picture: profileimage,
            };
          } else {
            authordata[uid] = {
              uid: uid,
              title: data["name"],
              email: data["mail"],
              timezone: data["timezone"],
            };
          }
        } else {
          //
        }
        // successLogger("exported author " + "'" + data["name"] + "'");
      });
      helper.writeFile(
        path.join(authorsFolderPath, authorConfig.fileName),
        JSON.stringify(authordata, null, 4)
      );
      resolve();
    });
  },
  getAuthors: function (skip) {
    var self = this;
    return when.promise(function (resolve, reject) {
      // self.connection.connect()
      var query = config["mysql-query"]["authors"];
      query = query + " limit " + skip + ", " + limit;
      self.connection.query(query, function (error, rows, fields) {
        if (!error) {
          if (rows.length > 0) {
            self.putAuthors(rows);
            resolve();
          }
        } else {
          errorLogger("no authors found");
          resolve(error);
        }
      });
    });
  },
  getAllAuthors: function (usercount) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var _getAuthors = [];
      for (var i = 0, total = usercount; i < total; i += limit) {
        _getAuthors.push(
          (function (data) {
            return function () {
              return self.getAuthors(data);
            };
          })(i)
        );
      }
      var guardTask = guard.bind(null, guard.n(1));
      _getAuthors = _getAuthors.map(guardTask);
      var taskResults = parallel(_getAuthors);
      taskResults
        .then(function (results) {
          self.connection.end();
          resolve();
        })
        .catch(function (e) {
          errorLogger("something wrong while exporting authors:", e);
          reject(e);
        });
    });
  },
  start: function () {
    // successLogger("exporting authors...");
    var self = this;
    return when.promise(function (resolve, reject) {
      self.connection.connect();
      var query = config["mysql-query"]["authorCount"];
      self.connection.query(query, function (error, rows, fields) {
        if (!error) {
          var usercount = rows[0]["usercount"];
          if (usercount > 0) {
            self
              .getAllAuthors(usercount)
              .then(function () {
                resolve();
              })
              .catch(function () {
                reject();
              });
          } else {
            errorLogger("no authors found");
            self.connection.end();
            resolve();
          }
        } else {
          errorLogger("failed to get authors count: ", error);
          self.connection.end();
          reject(error);
        }
      });
    });
  },
};

module.exports = ExtractAuthors;
