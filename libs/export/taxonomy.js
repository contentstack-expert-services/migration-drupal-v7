var mkdirp = require("mkdirp"),
  path = require("path"),
  fs = require("fs"),
  when = require("when"),
  guard = require("when/guard"),
  parallel = require("when/parallel");

const { JSDOM } = require("jsdom");
const { htmlToJson } = require("@contentstack/json-rte-serializer");

/**
 * Internal module Dependencies.
 */
var helper = require("../utils/helper");

var vocabularyConfig = config.modules.taxonomy,
  vocabularyFolderPath = path.resolve(
    config.data,
    config.entryfolder,
    vocabularyConfig.dirName
  ),
  limit = 100;

/**
 * Create folders and files
 */
if (!fs.existsSync(vocabularyFolderPath)) {
  mkdirp.sync(vocabularyFolderPath);
  helper.writeFile(path.join(vocabularyFolderPath, vocabularyConfig.fileName));
}

function ExtractTaxonomy() {
  this.connection = helper.connect();
}

ExtractTaxonomy.prototype = {
  putTaxonomy: function (categorydetails) {
    return when.promise(function (resolve, reject) {
      var categorydata = helper.readFile(
        path.join(vocabularyFolderPath, vocabularyConfig.fileName)
      );

      categorydetails.map(function (data, index) {
        var parent = data["parent"];
        let vocabularyRef = [
          {
            uid: `vocabulary_${data.vid}`,
            _content_type_uid: "vocabulary",
          },
        ];
        let taxonomyRef = [
          {
            uid: `taxonomy_${data["tid"]}`,
            _content_type_uid: "taxonomy",
          },
        ];

        var description = data["description"] || "";

        // for HTML RTE to JSON RTE convert
        const dom = new JSDOM(description.replace(/&amp;/g, "&"));
        let htmlDoc = dom.window.document.querySelector("body");
        const jsonValue = htmlToJson(htmlDoc);
        description = jsonValue;
        if (parent != 0 && parent !== undefined) {
          categorydata[`taxonomy_${data["tid"]}`] = {
            uid: `taxonomy_${data["tid"]}`,
            title: data["title"],
            description: description,
            vid: vocabularyRef,
            parent: taxonomyRef,
          };
        } else {
          categorydata[`taxonomy_${data["tid"]}`] = {
            uid: `taxonomy_${data["tid"]}`,
            title: data["title"],
            description: description,
            vid: vocabularyRef,
          };
        }
      });
      helper.writeFile(
        path.join(vocabularyFolderPath, vocabularyConfig.fileName),
        JSON.stringify(categorydata, null, 4)
      );

      resolve();
    });
  },
  getTaxonomyTermData: function (skip) {
    var self = this;
    return when.promise(function (resolve, reject) {
      // self.connection.connect()
      var query = config["mysql-query"]["taxonomy_term_data"];
      query = query + " limit " + skip + ", " + limit;
      self.connection.query(query, function (error, rows, fields) {
        if (!error) {
          if (rows.length > 0) {
            self.putTaxonomy(rows);
            resolve();
          }
        } else {
          errorLogger("failed to get taxonomy: ", error);
          reject(error);
        }
      });
    });
  },
  getTaxonomyCount: function (taxanomycount) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var _gettaxonomy = [];
      for (var i = 0, total = taxanomycount; i < total; i += limit) {
        _gettaxonomy.push(
          (function (data) {
            return function () {
              return self.getTaxonomyTermData(data);
            };
          })(i)
        );
      }
      var guardTask = guard.bind(null, guard.n(1));
      _gettaxonomy = _gettaxonomy.map(guardTask);
      var taskResults = parallel(_gettaxonomy);
      taskResults
        .then(function (results) {
          self.connection.end();
          resolve();
        })
        .catch(function (e) {
          errorLogger("something wrong while exporting taxonomy:", e);
          reject(e);
        });
    });
  },
  start: function () {
    // successLogger("exporting taxonomy...");
    var self = this;
    return when.promise(function (resolve, reject) {
      self.connection.connect();
      var query = config["mysql-query"]["taxonomyCount"];
      self.connection.query(query, function (error, rows, fields) {
        if (!error) {
          var taxanomycount = rows[0].taxonomycount;
          if (taxanomycount > 0) {
            self
              .getTaxonomyCount(taxanomycount)
              .then(function () {
                resolve();
              })
              .catch(function () {
                reject();
              });
          } else {
            errorLogger("no taxonomy found");
            self.connection.end();
            resolve();
          }
        } else {
          errorLogger("failed to get taxonomy count: ", error);
          self.connection.end();
          reject(error);
        }
      });
    });
  },
};

module.exports = ExtractTaxonomy;
