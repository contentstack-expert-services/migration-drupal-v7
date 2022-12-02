/**
 * Updated by Rohit on 1/10/19.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  _ = require("lodash"),
  fs = require("fs"),
  when = require("when"),
  guard = require("when/guard"),
  parallel = require("when/parallel"),
  sequence = require("when/sequence"),
  limit = 3,
  phpUnserialize = require("phpunserialize");
/**
 * Internal module Dependencies.
 */
const { JSDOM } = require("jsdom");
const { htmlToJson } = require("@contentstack/json-rte-serializer");

var helper = require("../../libs/utils/helper.js");

var entriesConfig = config.modules.entries,
  entriesFolderPath = path.resolve(config.data, entriesConfig.dirName);
function ExtractPosts() {
  this.connection = helper.connect();
}

let dropDownData = [];
let textData = [];
let dropDownValue = {};

ExtractPosts.prototype = {
  putPosts: function (postsdetails, key) {
    var self = this;
    var folderpath = entriesFolderPath + "/" + key;
    if (!fs.existsSync(folderpath)) {
      mkdirp.sync(folderpath);
      helper.writeFile(path.join(folderpath, "en-us.json"));
    }
    var contenttype = helper.readFile(path.join(folderpath, "en-us.json"));

    return when.promise(function (resolve, reject) {
      var field_name = Object.keys(postsdetails[0]);
      var isoDate = new Date();
      var contentTypeQuery = config["mysql-query"]["ct_mapped"];
      let assetId = helper.readFile(
        path.join(process.cwd(), "drupalMigrationData/assets/assets.json")
      );
      let referenceId = helper.readFile(
        path.join(
          process.cwd(),
          "drupalMigrationData/references/references.json"
        )
      );
      let taxonomyId = helper.readFile(
        path.join(
          process.cwd(),
          "drupalMigrationData/entries/taxonomy/en-us.json"
        )
      );
      let vocabularyId = helper.readFile(
        path.join(
          process.cwd(),
          "drupalMigrationData/entries/vocabulary/en-us.json"
        )
      );
      self.connection.query(contentTypeQuery, function (error, rows, fields) {
        for (var i = 0; i < rows.length; i++) {
          var conv_details = phpUnserialize(rows[i].data);
          var instance_data = phpUnserialize(rows[i].instance_data);

          for (const data of Object.values(postsdetails)) {
            for (const [dataKey, value] of Object.entries(data)) {
              //for image and files
              if (
                (rows[i].type === "file" || rows[i].type === "image") &&
                dataKey === `${rows[i].field_name}_fid`
              ) {
                if (dataKey.endsWith("_fid")) {
                  if (`assets_${value}` in assetId) {
                    data[dataKey] = assetId[`assets_${value}`];
                  }
                }
              }
              if (value === 1 || value === 0) {
                if (dataKey.endsWith("_value")) {
                  if (parseInt(value) === 1) {
                    data[dataKey] = true;
                  } else if (parseInt(value) === 0) {
                    data[dataKey] = false;
                  }
                }
              }
              if (
                rows[i].type === "list_integer" ||
                rows[i].type === "list_float" ||
                rows[i].type === "list_text"
              ) {
                if (
                  conv_details?.widget?.type === "options_select" ||
                  conv_details?.widget?.type === "options_buttons"
                ) {
                  if (dataKey === `${rows[i].field_name}_value`) {
                    if (typeof value?.children === "object") {
                      dropDownValue[dataKey] =
                        value?.children[0].children[0].text;
                      dropDownData = _.union(dropDownData, [dropDownValue]);
                      data[dataKey] = value?.children[0].children[0].text;
                    }
                  }
                }
              }
              if (
                (rows[i].type === "text_long" ||
                  rows[i].type === "text_with_summary") &&
                (rows[i].type !== "list_integer" ||
                  rows[i].type !== "list_float" ||
                  rows[i].type !== "list_text")
              ) {
                if (
                  conv_details?.widget?.type !== "options_select" ||
                  conv_details?.widget?.type !== "options_buttons"
                ) {
                  if (
                    !Date.parse(value) &&
                    typeof value !== "number" &&
                    typeof value !== "object" &&
                    dataKey.endsWith("_value") &&
                    value !== true &&
                    value !== false
                  ) {
                    if (conv_details?.widget?.modules !== "options") {
                      for (const tValue of Object.values(textData)) {
                        for (const tKey of Object.keys(tValue)) {
                          if (tKey === dataKey) {
                            delete data[dataKey];
                          } else {
                            const dom = new JSDOM(value);
                            let htmlDoc =
                              dom.window.document.querySelector("body");
                            const jsonValue = htmlToJson(htmlDoc);
                            data[dataKey] = jsonValue;
                          }
                        }
                      }
                    }
                  }
                }
                if (
                  `${rows[i].field_name}_value` === dataKey &&
                  typeof value !== "object" &&
                  !Date.parse(value)
                ) {
                  const dom = new JSDOM(value);
                  let htmlDoc = dom.window.document.querySelector("body");
                  const jsonValue = htmlToJson(htmlDoc);
                  data[dataKey] = jsonValue;
                }
              }
              if (rows[i].type === "entityreference") {
                // for references
                if (
                  instance_data?.settings?.target_type !== "file" &&
                  typeof value === "number" &&
                  /^-?[0-9]+$/.test(value)
                ) {
                  if (
                    `${rows[i].field_name}_target_id` === dataKey &&
                    Object.keys(instance_data["foreign keys"])[0] !== "node"
                  ) {
                    if (
                      Object.keys(instance_data["foreign keys"])[0] ===
                      "taxonomy_vocabulary"
                    ) {
                      if (`vocabulary_${value}` in vocabularyId) {
                        data[dataKey] = [
                          {
                            uid: `vocabulary_${value}`,
                            _content_type_uid: "vocabulary",
                          },
                        ];
                      }
                    } else if (
                      Object.keys(instance_data["foreign keys"])[0] ===
                      "taxonomy_term_data"
                    ) {
                      if (`taxonomy_${value}` in taxonomyId) {
                        data[dataKey] = [
                          {
                            uid: `taxonomy_${value}`,
                            _content_type_uid: "taxonomy",
                          },
                        ];
                      }
                    }
                  } else if (
                    `${rows[i].field_name}_target_id` === dataKey &&
                    Object.keys(instance_data["foreign keys"])[0] === "node"
                  ) {
                    if (`content_type_entries_title_${value}` in referenceId) {
                      data[dataKey] = [
                        referenceId[`content_type_entries_title_${value}`],
                      ];
                    }
                  }
                } else if (
                  typeof value === "number" &&
                  dataKey.endsWith("_tid")
                ) {
                  if (`content_type_entries_title_${value}` in referenceId) {
                    data[dataKey] = [
                      referenceId[`content_type_entries_title_${value}`],
                    ];
                  }
                } else {
                  if (
                    instance_data?.settings?.target_type === "file" &&
                    typeof value === "number" &&
                    /^-?[0-9]+$/.test(value) &&
                    dataKey.endsWith("_target_id")
                  ) {
                    if (`assets_${value}` in assetId) {
                      data[dataKey] = assetId[`assets_${value}`];
                    }
                  }
                }
              }

              // for datetime and timestamps
              if (
                rows[i].type === "datetime" ||
                rows[i].type === "timestamp" ||
                rows[i].type === "datestamp"
              ) {
                if (
                  typeof value !== "object" &&
                  `${value}`.length >= 10 &&
                  /^\d(.*\d)?$/.test(value)
                ) {
                  data[dataKey] = isoDate.toISOString(value);
                }
              }

              if (value === null) {
                delete data[dataKey];
              }
            }

            var ct_value = {};
            for (var key in field_name) {
              if (field_name[key] == "uid") {
                ct_value[
                  field_name[key]
                ] = `content_type_entries_title_${data["uid"]}`;
              } else if (field_name[key] == "locale") {
                ct_value[field_name[key]] = "en-us";
              } else if (field_name[key].endsWith("_url")) {
                if (data[field_name[key]]) {
                  ct_value[field_name[key].replace("_url", "")] = {
                    title: data[field_name[key]],
                    href: data[field_name[key]],
                  };
                } else {
                  ct_value[field_name[key].replace("_url", "")] = {
                    title: "",
                    href: "",
                  };
                }
              } else if (field_name[key].endsWith("_target_id")) {
                ct_value[field_name[key].replace("_target_id", "")] =
                  data[field_name[key]];
              } else if (field_name[key].endsWith("_tid")) {
                ct_value[field_name[key].replace("_tid", "")] =
                  data[field_name[key]];
              } else if (field_name[key].endsWith("_fid")) {
                ct_value[field_name[key].replace("_fid", "")] =
                  data[field_name[key]];
              } else if (field_name[key].endsWith("_value")) {
                if (rows[i].type === "text") {
                  if (typeof data[field_name[key]] === "string") {
                    if (typeof data[field_name[key]] !== "undefined") {
                      if (rows[i].type === "text") {
                        textData.map((tData) => {
                          for (const [tKey, tValue] of Object.entries(tData)) {
                            if (tValue === data[field_name[key]]) {
                              ct_value[field_name[key]] = tValue;
                            }
                          }
                        });
                      }
                      ct_value[field_name[key]] = data[field_name[key]];
                    }
                  }
                } else {
                  if (/<\/?[a-z][\s\S]*>/i.test(data[field_name[key]])) {
                    const dom = new JSDOM(data[field_name[key]]);
                    let htmlDoc = dom.window.document.querySelector("body");
                    const jsonValue = htmlToJson(htmlDoc);
                    ct_value[field_name[key].replace("_value", "")] = jsonValue;
                  } else {
                    if (rows[i].type === "text") {
                      if (typeof data[field_name[key]] === "string") {
                        if (typeof data[field_name[key]] !== "undefined") {
                          if (rows[i].type === "text") {
                            textData.map((tData) => {
                              for (const [tKey, tValue] of Object.entries(
                                tData
                              )) {
                                if (tValue === data[field_name[key]]) {
                                  // delete field_name[key];
                                  ct_value[field_name[key]] = tValue;
                                }
                              }
                            });
                          }
                        }
                      }
                    } else {
                    }
                    ct_value[field_name[key].replace("_value", "")] =
                      data[field_name[key]];
                  }
                  if (
                    rows[i].type === "list_integer" ||
                    rows[i].type === "list_float" ||
                    rows[i].type === "list_text"
                  ) {
                    if (
                      conv_details?.widget?.type === "options_select" ||
                      conv_details?.widget?.type === "options_buttons"
                    ) {
                      if (typeof data[field_name[key]] === "object") {
                        if (
                          typeof data[field_name[key]]?.children !== "undefined"
                        ) {
                          if (rows[i].type === "list_text") {
                            dropDownData.map((dData) => {
                              for (const [dKey, dValue] of Object.entries(
                                dData
                              )) {
                                if (
                                  dValue ===
                                  data[field_name[key]]?.children[0].children[0]
                                    .text
                                ) {
                                  ct_value[field_name[key]] = dValue;
                                }
                              }
                            });
                          }
                        }
                      }
                    }
                  }
                }
              } else if (field_name[key].endsWith("_status")) {
                ct_value[field_name[key].replace("_status", "")] =
                  data[field_name[key]];
              } else {
                if (/<\/?[a-z][\s\S]*>/i.test(data[field_name[key]])) {
                  const dom = new JSDOM(data[field_name[key]]);
                  let htmlDoc = dom.window.document.querySelector("body");
                  const jsonValue = htmlToJson(htmlDoc);
                  ct_value[field_name[key]] = jsonValue;
                } else {
                  ct_value[field_name[key]] = data[field_name[key]];
                }
              }

              if (typeof data["uid"] === "number") {
                contenttype[`content_type_entries_title_${data["uid"]}`] =
                  ct_value;
              }
            }
          }

          helper.writeFile(
            path.join(folderpath, "en-us.json"),
            JSON.stringify(contenttype, null, 4)
          );

          resolve({ last: contenttype });
        }
      });
    });
  },
  getQuery: function (pagename, skip, queryPageConfig) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var query = queryPageConfig["page"]["" + pagename + ""];
      query = query + " limit " + skip + ", " + limit;
      self.connection.query(query, function (error, rows, fields) {
        if (!error) {
          if (rows.length > 0) {
            self
              .putPosts(rows, pagename)
              .then(function (results) {
                resolve(results);
              })
              .catch(function () {
                reject();
              });
          } else {
            errorLogger("no entries found");
            resolve();
          }
        } else {
          errorLogger("failed to get entries: ", error);
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
              return self.getQuery(pagename, data, queryPageConfig);
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
            "something wrong while exporting entries" + pagename + ":",
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
            errorLogger("no entries found for " + pagename + " ...");
            resolve();
          }
        } else {
          errorLogger("failed to get " + pagename + " count: ", error);
          reject(error);
        }
      });
    });
  },
  getAllPosts: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      var queryPageConfig = helper.readFile(
        path.join(process.cwd(), "/drupalMigrationData/query/index.json")
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
            "something wrong while exporting entries " + key + ": ",
            e
          );
          reject(e);
        });
    });
  },
  start: function () {
    successLogger("Exporting entries...");
    var self = this;

    return when.promise(function (resolve, reject) {
      self
        .getAllPosts()
        .then(function () {
          resolve();
        })
        .catch(function () {
          reject();
        });
    });
  },
};

module.exports = ExtractPosts;
