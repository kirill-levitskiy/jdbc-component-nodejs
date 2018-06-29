const jdbc = require("jdbc");
const jinst = require("jdbc/lib/jinst");
const co = require("co");
const request = require("request-promise");
const messages = require("elasticio-node").messages;
const asyncjs = require("async");

//module.exports = require('../commons/JdbcClient').lookupObjectByPrimaryKeyFactory((require('../genericODataClient'));

var conn;
var originalSql;
var conString;
var mssql;

exports.process = processAction;

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
function processAction(msg, cfg, snapshot = {}) {
    var self = this;
    console.log("Start - processAction");

    if (!jinst.isJvmCreated()) {
        jinst.addOption("-Xrs");
        jinst.setupClasspath([  "./drivers/sqljdbc4.jar",
                                "./drivers/ojdbc6.jar",
                                "./drivers/mysql.jar",
                                "./drivers/postgresql.jar"]);
    }

    originalSql = "select * from Test2.dbo.Tweets ORDER BY id OFFSET 10 ROWS FETCH NEXT 10 ROWS ONLY;";

    conString = "jdbc:sqlserver://elasticiotest.database.windows.net:1433;database=Test2";
    mssql = new jdbc({
        url: conString,
        drivername: "com.microsoft.sqlserver.jdbc.SQLServerDriver",
        minpoolsize: 5,
        maxpoolsize: 10,
        properties: {
            user: "elasticiotest",
            password: "Init123$"
            //encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;
        }
    });
    console.log("Original query=%s", originalSql);
    console.log(process.memoryUsage());
    // Select statement
    // Initialize jdbc object
    mssql.initialize(function (err) {
        if (err) {
            console.log("Error - MSSQL Initialize:", err);
        }
    });

    mssql.reserve(function (err, connObj) {
        // The connection returned from the pool is an object with two fields
        // {uuid: <uuid>, conn: <Connection>}
        if (connObj) {
            console.log("Using connection: " + connObj.uuid);
            // Grab the Connection for use.
            conn = connObj.conn;

            // Adjust some connection options. See connection.js for a full set of
            // supported methods.
            asyncjs.series([
                function (callback) {
                    conn.setAutoCommit(false, function (err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
                    conn.setSchema("dbo", function (err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null);
                        }
                    });
                }
            ], function (err, results) {
                // Check for errors if need be.
                // results is an array.
            });

            // Query the database.
            asyncjs.series([
                function (callback) {
                    // Select statement example.
                    conn.createStatement(function (err, statement) {
                        if (err) {
                            callback(err);
                        } else {
                            // Adjust some statement options before use. See statement.js for
                            // a full listing of supported options.
                            statement.setFetchSize(100, function (err) {
                                if (err) {
                                    callback(err);
                                } else {
                                    statement.executeQuery(originalSql,
                                        function (err, resultset) {
                                            if (err) {
                                                callback(err);
                                            } else {
                                                resultset.toObjArray(function (err, results) {
                                                    if (results.length > 0) {
                                                        results.forEach(function (item) {
                                                            console.log("ID:", item.id);
                                                        });
                                                        self.emit('data', messages.newMessageWithBody({responseData: results}));
                                                    }
                                                    callback(null, resultset);
                                                });
                                            }
                                        });
                                }
                            });
                        }
                    });
                }
            ], function (err, results) {
                // Results can also be processed here.
                // Release the connection back to the pool.
                mssql.release(connObj, function (err) {
                    if (err) {
                        console.log(err.message);
                    }
                });
                self.emit('end');
            });
        }
    });
}