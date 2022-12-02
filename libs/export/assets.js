/**
 * External module Dependencies.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  Q = require("q"),
  request = require("request"),
  _ = require("lodash"),
  when = require("when"),
  guard = require("when/guard"),
  parallel = require("when/parallel"),
  fs = require("fs"),
  limit = 100;

/**
 * Internal module Dependencies .
 */
var helper = require("../utils/helper");

var assetConfig = config.modules.asset,
  assetFolderPath = path.resolve(config.data, assetConfig.dirName),
  masterFolderPath = path.resolve(config.data, "master"),
  assetmasterFolderPath = path.resolve(config.data, "master"),
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
var assetMapping = helper.readFile(
  path.join(masterFolderPath, assetConfig.fileName)
);
var assetURLMapping = helper.readFile(
  path.join(masterFolderPath, assetConfig.masterfile)
);
var failedAssets = [];

function ExtractAssets() {
  this.connection = helper.connect();
}

ExtractAssets.prototype = {
  saveAsset: function (assets, value, url) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var name = assets["filename"];
      url = encodeURI(url);
      if (
        fs.existsSync(
          path.resolve(assetFolderPath, assets["fid"].toString(), name)
        )
      ) {
        // successLogger("asset already present " + "'" + name + "'");
        resolve(assets["fid"]);
      } else {
        request.get(
          {
            url: url,
            timeout: 60000,
            encoding: "binary",
          },
          function (err, response, body) {
            if (err) {
              if (failedAssets.indexOf(assets["fid"]) == -1) {
                failedAssets.push(assets["fid"]);
                failedJSON[assets["fid"]] = err;
              }
              resolve(assets["fid"]);
            } else {
              if (response.statusCode != 200) {
                if (failedAssets.indexOf(assets["fid"]) == -1) {
                  failedAssets.push(assets["fid"]);
                  failedJSON[assets["fid"]] = body;
                }
                resolve(assets["fid"]);
              } else {
                mkdirp.sync(
                  path.resolve(assetFolderPath, `assets_${assets["fid"]}`)
                );
                fs.writeFile(
                  path.join(assetFolderPath, `assets_${assets["fid"]}`, name),
                  body,
                  "binary",
                  function (writeerror) {
                    if (writeerror) {
                      if (
                        failedAssets.indexOf(`assets_${assets["fid"]}`) == -1
                      ) {
                        failedAssets.push(`assets_${assets["fid"]}`);
                        failedJSON[`assets_${assets["fid"]}`] = writeerror;
                      }
                    } else {
                      assetData[`assets_${assets["fid"]}`] = {
                        uid: `assets_${assets["fid"]}`,
                        status: true,
                        file_size: assets["filesize"],
                        tag: [],
                        filename: name,
                        url: url,
                        ACL: {
                          roles: [],
                          others: {
                            read: false,
                            create: false,
                            update: false,
                            delete: false,
                            sub_acl: {
                              read: false,
                              create: false,
                              update: false,
                              delete: false,
                              publish: false,
                            },
                          },
                        },
                        is_dir: false,
                        parent_uid: null,
                        _version: 1,
                        title: name,
                        publish_details: [],
                      };
                      const assetVersionInfoFile = path.resolve(
                        assetFolderPath,
                        `assets_${assets["fid"]}`,
                        "_contentstack_" + `assets_${assets["fid"]}` + ".json"
                      );
                      helper.writeFile(
                        assetVersionInfoFile,
                        JSON.stringify(
                          assetData[`assets_${assets["fid"]}`],
                          null,
                          4
                        )
                      );

                      assetMapping[`assets_${assets["fid"]}`] = "";
                      assetURLMapping[url] = "";
                      if (failedJSON[`assets_${assets["fid"]}`]) {
                        delete failedJSON[`assets_${assets["fid"]}`];
                      }
                    }
                    resolve(`assets_${assets["fid"]}`);
                  }
                );
              }
            }
          }
        );
      }
    });
  },
  retryFailedAssets: function (assetids) {
    var self = this;
    return when.promise(function (resolve, reject) {
      if (assetids.length > 0) {
        assetids = assetids.join();
        var query = config["mysql-query"]["assetsFID"];
        //query = query + "(" + assetids + ") GROUP BY a.fid"
        query = query + "(" + assetids + ")";
        self.connection.query(query, function (error, rows, fields) {
          if (!error) {
            if (rows.length > 0) {
              //self.connection.end();
              var _getAsset = [];
              for (var i = 0, total = rows.length; i < total; i++) {
                _getAsset.push(
                  (function (data) {
                    return function () {
                      var url = data["uri"];

                      let replaceValue =
                        config.base_url +
                        config.drupal_base_url +
                        config.public_path;
                      if (!url.startsWith("http")) {
                        url = url.replace("public://", replaceValue);
                        url = url.replace("private://", replaceValue);
                      }
                      return self.saveAsset(data, 0, url);
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
                    path.join(assetmasterFolderPath, assetConfig.fileName),
                    JSON.stringify(assetMapping, null, 4)
                  );
                  helper.writeFile(
                    path.join(assetmasterFolderPath, assetConfig.masterfile),
                    JSON.stringify(assetURLMapping, null, 4)
                  );
                  helper.writeFile(
                    path.join(masterFolderPath, "failed.json"),
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
  getAllAssets: function (skip) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var query = config["mysql-query"]["assets"];

      query = query + " limit " + skip + ", " + limit;
      self.connection.query(query, function (error, rows, fields) {
        if (!error) {
          if (rows.length > 0) {
            var _getAsset = [];
            for (var i = 0, total = rows.length; i < total; i++) {
              _getAsset.push(
                (function (data) {
                  return function () {
                    var url = data["uri"];

                    let replaceValue = config.base_url + config.public_path;
                    if (!url.startsWith("http")) {
                      url = url.replace("public://", replaceValue);
                      url = url.replace("private://", replaceValue);
                    }

                    return self.saveAsset(data, 0, url);
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
                  path.join(assetmasterFolderPath, assetConfig.fileName),
                  JSON.stringify(assetMapping, null, 4)
                );
                helper.writeFile(
                  path.join(assetmasterFolderPath, assetConfig.masterfile),
                  JSON.stringify(assetURLMapping, null, 4)
                );
                if (failedAssets.length > 0) {
                  self.retryFailedAssets(failedAssets);
                }
                resolve(results);
              })
              .catch(function (e) {
                errorLogger("failed to download assets: ", e);
                resolve();
              });
          } else {
            errorLogger("no assets found");
            resolve();
          }
        } else {
          errorLogger("error while exporting assets:", query);
          resolve(error);
        }
      });
    });
  },
  getAssetCount: function (assetcount) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var _getAssets = [];
      for (var i = 0, total = assetcount; i < total; i += limit) {
        _getAssets.push(
          (function (data) {
            return function () {
              return self.getAllAssets(data);
            };
          })(i)
        );
      }
      var guardTask = guard.bind(null, guard.n(1));
      _getAssets = _getAssets.map(guardTask);
      var taskResults = parallel(_getAssets);
      taskResults
        .then(function (results) {
          // self.connection.end();
          helper.writeFile(
            path.join(assetmasterFolderPath, "failed.json"),
            JSON.stringify(failedJSON, null, 4)
          );
          resolve();
        })
        .catch(function (e) {
          errorLogger("something wrong while exporting assets:", e);
          reject(e);
        });
    });
  },
  start: function () {
    // successLogger("exporting assets...");
    var self = this;

    return when.promise(function (resolve, reject) {
      var query = config["mysql-query"]["assetCount"];

      self.connection.query(query, function (error, rows, fields) {
        if (!error) {
          var assetcount = rows[0].assetcount;
          if (assetcount > 0) {
            self
              .getAssetCount(assetcount)
              .then(function () {
                self.connection.end();
                resolve();
              })
              .catch(function () {
                self.connection.end();
                reject();
              });
          } else {
            errorLogger("no assets found");
            self.connection.end();
            resolve();
          }
        } else {
          errorLogger("failed to get assets count: ", error);
          self.connection.end();
          reject(error);
        }
      });
    });
  },
};

module.exports = ExtractAssets;
