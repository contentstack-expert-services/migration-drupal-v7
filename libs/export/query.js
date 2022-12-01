/**
 * Created by pradeep on 27/2/17.
 */
var mkdirp = require("mkdirp"),
  path = require("path"),
  _ = require("lodash"),
  fs = require("fs"),
  when = require("when");

var helper = require("../../libs/utils/helper.js");

var queryConfig = config.modules.query,
  queryFolderPath = path.resolve(config.data, queryConfig.dirName);

if (!fs.existsSync(queryFolderPath)) {
  mkdirp.sync(queryFolderPath);
  helper.writeFile(path.join(queryFolderPath, queryConfig.fileName));
} else {
  helper.writeFile(path.join(queryFolderPath, queryConfig.fileName));
}

function Extractfield() {
  this.connection = helper.connect();
}
Extractfield.prototype = {
  getQuery: function (data1) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var value = data1["field_name"];
      var query = "SELECT * FROM" + " " + "field_data_" + value;
      self.connection.query(query, function (error, rows, fields) {
        if (!error) {
          // if(rows.length>0){
          var fd_table = [];
          for (var field in fields) {
            if (fields[field].name == value + "_value") {
              fd_table =
                "field_data_" + data1["field_name"] + "." + fields[field].name;
              //resolve(fd_table);
            } else if (fields[field].name == value + "_fid") {
              fd_table =
                "field_data_" + data1["field_name"] + "." + fields[field].name;
              //resolve(fd_table);
            } else if (fields[field].name == value + "_tid") {
              fd_table =
                "field_data_" + data1["field_name"] + "." + fields[field].name;
              // resolve(fd_table);
            } else if (fields[field].name == value + "_status") {
              fd_table =
                "field_data_" + data1["field_name"] + "." + fields[field].name;
            } else if (fields[field].name == value + "_target_id") {
              fd_table =
                "field_data_" + data1["field_name"] + "." + fields[field].name;
            } else if (fields[field].name == value + "_url") {
              fd_table =
                "field_data_" + data1["field_name"] + "." + fields[field].name;
            } else {
            }
          }
          resolve(fd_table);
        } else {
          reject(error);
        }
      });
    });
  },
  putfield: function (field) {
    var self = this;
    return when.promise(function (resolve, reject) {
      var select = {};
      var countQuery = {};
      var countPage = {};

      var ct = Object.keys(_.keyBy(field, "content_types"));
      ct.map(function (data, index) {
        var allkey = _.filter(field, { content_types: data });

        var last = [];
        var queries = [];
        allkey.map(function (data1, index) {
          last.push("field_data_" + data1["field_name"]);
          queries.push(self.getQuery(data1));
        });
        when
          .all(queries)
          .then(function (result) {
            var where = [];
            for (var key in last) {
              where.push(
                "LEFT JOIN " +
                  last[key] +
                  " ON " +
                  last[key] +
                  ".entity_id = node.nid "
              );
            }
            where.push("LEFT JOIN users ON users.uid = node.uid");
            var left = "";
            for (i = where.length - 1; i >= 0; i--) {
              left = where[i] + left;
            }
            last.unshift("node");
            result.unshift(
              "SELECT node.nid as uid,node.title,node.language as locale"
            );
            var resultdetail = result.join(",");
            var type = "'" + data + "'";
            var querydata = resultdetail.concat(
              " FROM  node " +
                left +
                " WHERE node.type = " +
                type +
                " GROUP BY node.nid"
            );
            countPage =
              "SELECT count(node.nid) as countentry FROM  node " +
              left +
              " WHERE node.type = " +
              type;
            select[data] = querydata.toString();
            countQuery[data + "Count"] = countPage.toString();
            var main = {
              page: select,
              count: countQuery,
            };
            helper.writeFile(
              path.join(process.cwd(), "drupalMigrationData/query/index.json"),
              JSON.stringify(main, null, 4)
            );
          })
          .catch(function () {
            reject();
          });
      });
    });
  },
  start: function () {
    var self = this;
    return when.promise(function (resolve, reject) {
      self.connection.connect();
      var query = config["mysql-query"]["ct_mapped"];
      self.connection.query(query, function (error, rows, fields) {
        if (!error) {
          if (rows.length > 0) {
            self.putfield(rows);
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
};
module.exports = Extractfield;
