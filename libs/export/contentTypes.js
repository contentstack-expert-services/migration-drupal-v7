/**
 * Created by pradeep on 22/2/17.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  _ = require("lodash"),
  fs = require("fs"),
  when = require("when"),
  phpUnserialize = require("phpunserialize");

const chalk = require("chalk");
/**
 * Internal module Dependencies.
 */
var helper = require("../../libs/utils/helper.js");

var contenttypesConfig = config.modules.contentTypes,
  contentTypesFolderPath = path.resolve(
    config.data,
    contenttypesConfig.dirName
  );
validKeys = contenttypesConfig.validKeys;

/**
 * Create folders and files
 */
mkdirp.sync(contentTypesFolderPath);
if (!fs.existsSync(contentTypesFolderPath)) {
  mkdirp.sync(contentTypesFolderPath);
  helper.writeFile(
    path.join(contentTypesFolderPath, contenttypesConfig.fileName)
  );
}

const { drupalMapper } = require("./contentstackMapper");

function ExtractContentTypes() {
  this.connection = helper.connect();
}
ExtractContentTypes.prototype = {
  start: function () {
    successLogger("Exporting content-types...");

    var self = this;
    return when.promise(function (resolve, reject) {
      self
        .getcontenttypes()
        .then(function (results) {
          successLogger(
            "Updated priority and reference/file field of Content Types."
          );
          resolve();
        })
        .catch(function (error) {
          errorLogger(error);
          return reject();
        });
    });
  },
  getcontenttypes: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      var details_data = [];
      self.connection.connect();
      var query = config["mysql-query"]["ct_mapped"];

      self.connection.query(query, function (error, rows, fields) {
        for (var i = 0; i < rows.length; i++) {
          var conv_details = phpUnserialize(rows[i].data);
          var instance_data = phpUnserialize(rows[i].instance_data);

          details_data.push({
            field_label: conv_details?.label,
            description: conv_details?.description,
            field_name: rows[i].field_name,
            content_types: rows[i].content_types,
            type: rows[i].type,
            min: conv_details?.settings?.min,
            max: conv_details?.settings?.max,
            reference_type: conv_details?.display?.default?.module,
            behaviour: conv_details?.settings?.behaviors,
            default_value:
              conv_details?.default_value &&
              conv_details?.default_value[0]?.value,
            allowed_values: instance_data?.settings?.allowed_values,
            reference_difference: instance_data?.settings?.target_type,
            reference_content:
              instance_data?.settings?.handler_settings?.target_bundles,
            widget_type: conv_details?.widget?.type,
          });
        }
        if (!error) {
          if (rows.length > 0) {
            self.putContentTypes(details_data);
            self.connection.end();
            resolve();
          } else {
            self.connection.end();
            resolve();
          }
        } else {
          self.connection.end();
          reject(error);
        }
      });
    });
  },
  putContentTypes: function (contentdetails) {
    var self = this;
    var count = 0;
    return when.promise(function (resolve, reject) {
      var content_types = [];
      var ct = Object.keys(_.keyBy(contentdetails, "content_types"));

      //Mapping for content type name and its field name
      ct.map(function (data, index) {
        var allkey = _.filter(contentdetails, { content_types: data });

        drupalMapper(allkey, ct);
        var contenttypeTitle = data.split("_").join(" ");

        var main = {
          title: contenttypeTitle,
          uid: data,
          schema: [...drupalMapper(allkey, ct)],
          description: `Schema for ${contenttypeTitle}`,
          options: {
            is_page: true,
            singleton: false,
            sub_title: [],
            title: `title`,
            url_pattern: "/:title",
            url_prefix: `/${data}/`,
          },
        };
        count++;
        content_types.push(main);
      });
      var entry = {
        content_types: content_types,
      };
      self.putfield(entry, count);
      resolve();
    });
  },
  putfield: function (entry, count) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var authors = helper.readFile(path.join(__dirname, "../authors.json"));
      var taxonomy = helper.readFile(path.join(__dirname, "../taxonomy.json"));
      var vocabulary = helper.readFile(
        path.join(__dirname, "../vocabulary.json")
      );
      helper.writeFile(
        path.join(contentTypesFolderPath, "taxonomy.json"),
        JSON.stringify(taxonomy, null, 4)
      );
      helper.writeFile(
        path.join(contentTypesFolderPath, "vocabulary.json"),
        JSON.stringify(vocabulary, null, 4)
      );
      helper.writeFile(
        path.join(contentTypesFolderPath, "authors.json"),
        JSON.stringify(authors, null, 4)
      );
      entry.content_types.unshift(authors, vocabulary, taxonomy);

      count = count + 4;
      for (var i = 0, total = count; i < total; i++) {
        var contentType = {};

        for (var j = 0, jTotal = validKeys.length; j < jTotal; j++) {
          contentType[validKeys[j]] = entry.content_types[i][validKeys[j]];
        }
        helper.writeFile(
          path.join(contentTypesFolderPath, contentType["uid"] + ".json"),
          JSON.stringify(contentType, null, 4)
        );
        console.log(
          "ContentType",
          chalk.green(`${contentType["uid"]}`),
          "created successfully"
        );

        resolve();
      }
    });
  },
};

module.exports = ExtractContentTypes;
