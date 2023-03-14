/**
 * External module Dependencies.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  when = require("when"),
  guard = require("when/guard"),
  parallel = require("when/parallel"),
  fs = require("fs"),
  axios = require("axios"),
  chalk = require("chalk");
/**
 * Internal module Dependencies .
 */
var helper = require("../utils/helper");

var assetConfig = config.modules.asset,
  assetFolderPath = path.resolve(config.data, assetConfig.dirName),
  masterFolderPath = path.resolve(config.data, "logs"),
  assetmasterFolderPath = path.resolve(config.data, "logs", "assets"),
  failedJSON =
    helper.readFile(path.join(assetmasterFolderPath, "failed.json")) || {};

if (!fs.existsSync(assetFolderPath)) {
  mkdirp.sync(assetFolderPath);
  helper.writeFile(path.join(assetFolderPath, assetConfig.fileName));
  helper.writeFile(path.join(assetFolderPath, assetConfig.featuredfileName));

  mkdirp.sync(assetmasterFolderPath);
  helper.writeFile(path.join(assetmasterFolderPath, assetConfig.fileName));
  helper.writeFile(path.join(assetmasterFolderPath, assetConfig.masterfile));
}

//Reading a File
var assetData = helper.readFile(
  path.join(assetFolderPath, assetConfig.fileName)
);

var failedAssets = [];

function ExtractAssets() {
  this.connection = helper.connect();
}

ExtractAssets.prototype = {
  saveAsset: function (assets) {
    var self = this;
    return when.promise(async function (resolve, reject) {
      var url = assets["uri"];
      // console.log(url);
      let replaceValue = config.base_url + config.public_path;
      if (!url.startsWith("http")) {
        url = url.replace("public://", replaceValue);
        url = url.replace("private://", replaceValue);
      }
      // console.log(url);
      var name = assets["filename"];
      url = encodeURI(url);

      if (
        fs.existsSync(
          path.resolve(assetFolderPath, assets["fid"].toString(), name)
        )
      ) {
        resolve(assets["fid"]);
      } else {
        try {
          const response = await axios.get(url, {
            responseType: "arraybuffer",
          });
          mkdirp.sync(path.resolve(assetFolderPath, `assets_${assets["fid"]}`));
          fs.writeFileSync(
            path.join(assetFolderPath, `assets_${assets["fid"]}`, name),
            response.data
          );

          assetData[`assets_${assets["fid"]}`] = {
            uid: `assets_${assets["fid"]}`,
            status: true,
            file_size: assets["filesize"],
            tag: [],
            filename: name,
            url: url,
            is_dir: false,
            parent_uid: null,
            _version: 1,
            title: name,
            publish_details: [],
          };

          if (failedJSON[`assets_${assets["fid"]}`]) {
            delete failedJSON[`assets_${assets["fid"]}`];
          }
          helper.writeFile(
            path.join(assetFolderPath, assetConfig.fileName),
            JSON.stringify(assetData, null, 4)
          );
          console.log(
            "An asset with id",
            chalk.green(`${assets["fid"]}`),
            "and name",
            chalk.green(`${name}`),
            "got downloaded successfully."
          );
        } catch (error) {
          if (failedAssets.indexOf(`assets_${assets["fid"]}`) == -1) {
            self.retryFailedAssets(assets["fid"]);
          }
          failedJSON[`assets_${assets["fid"]}`] = {
            failedUid: assets["fid"],
            name: name,
            url: url,
            file_size: assets["filesize"],
            reason_for_error: error.message,
          };
          helper.writeFile(
            path.join(assetmasterFolderPath, "failed.json"),
            JSON.stringify(failedJSON, null, 4)
          );
          console.error(
            "Failed to download asset with id",
            chalk.red(`${assets["fid"].toString()}`),
            "and name",
            chalk.red(`${name}`),
            `: ${error}`
          );
        }

        resolve(`assets_${assets["fid"]}`);
      }
    });
  },
  retryFailedAssets: function (assetids) {
    var self = this;
    return when.promise(function (resolve, reject) {
      if (assetids.length > 0) {
        assetids = assetids.join();

        var query = config["mysql-query"]["assetsFID"];
        query = query + "(" + assetids + ")";
        self.connection.query(query, function (error, rows, fields) {
          if (!error) {
            if (rows.length > 0) {
              var _getAsset = [];
              for (var i = 0, total = rows.length; i < total; i++) {
                _getAsset.push(
                  (function (data) {
                    return function () {
                      return self.saveAsset(data, 0);
                    };
                  })(rows[i])
                );
              }
              var guardTask = guard.bind(null, guard.n(2));
              _getAsset = _getAsset.map(guardTask);
              var taskResults = parallel(_getAsset);
              taskResults
                .then(function (results) {
                  helper.writeFile(
                    path.join(assetFolderPath, assetConfig.fileName),
                    JSON.stringify(assetData, null, 4)
                  );

                  helper.writeFile(
                    path.join(assetmasterFolderPath, "failed.json"),
                    JSON.stringify(failedJSON, null, 4)
                  );
                  resolve();
                })
                .catch(function (e) {
                  errorLogger("failed to download assets: ", e);
                  reject(e);
                });
            } else {
              errorLogger("no assets found");
              self.connection.end();
              resolve();
            }
          } else {
            errorLogger("failed to get assets: ", error);
            self.connection.end();
            reject(error);
          }
        });
      } else {
        resolve();
      }
    });
  },

  start: function () {
    // successLogger("exporting assets...", database);
    var self = this;

    return when.promise(function (resolve, reject) {
      //var query = config["mysql-query"]["assets"];
      var query = config["mysql-query"]["assets"];

      self.connection.query(query, function (error, rows, fields) {
        if (!error) {
          if (rows.length > 0) {
            var _getAsset = [];
            for (var i = 0, total = rows.length; i < total; i++) {
              _getAsset.push(
                (function (data) {
                  return function () {
                    return self.saveAsset(data, 0);
                  };
                })(rows[i])
              );
            }
            var guardTask = guard.bind(null, guard.n(2));
            _getAsset = _getAsset.map(guardTask);
            var taskResults = parallel(_getAsset);
            taskResults
              .then(function (results) {
                helper.writeFile(
                  path.join(assetFolderPath, assetConfig.fileName),
                  JSON.stringify(assetData, null, 4)
                );

                if (failedAssets.length > 0) {
                  self.retryFailedAssets(failedAssets);
                }
                self.connection.end();
                resolve(results);
              })
              .catch(function (e) {
                errorLogger("failed to download assets : ", e);
                resolve();
              });
          } else {
            errorLogger("no assets found");
            self.connection.end();
            resolve();
          }
        } else {
          errorLogger("error while exporting assets :", query);
          self.connection.end();
          resolve(error);
        }
      });
    });
  },
};

module.exports = ExtractAssets;
