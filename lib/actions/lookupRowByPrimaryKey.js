const jdbc = require('jdbc');
const jinst = require('jdbc/lib/jinst');
const co = require('co');
const request = require('request-promise');
const messages = require('elasticio-node').messages;
const asyncjs = require('async');

exports.process = processAction;

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
function processAction(msg, cfg, snapshot = {}) {
    console.log('Start - processAction')

    if (!jinst.isJvmCreated()) {
        jinst.addOption('-Xrs');
        jinst.setupClasspath(["./drivers/sqljdbc4.jar",
            "./drivers/ojdbc6.jar",
            "./drivers/mysql.jar",
            "./drivers/postgresql.jar"]);
    }

    console.log("Classpath was set");
    const originalSql = "select * from Test2.dbo.Tweets ORDER BY id OFFSET 1 ROWS FETCH NEXT 1 ROWS ONLY;";

    const conString = "jdbc:sqlserver://elasticiotest.database.windows.net:1433;database=Test2;user=elasticiotest@elasticiotest;password=Init123$;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;";
    var mssql = new jdbc({
        url: conString,
        drivername: "com.microsoft.sqlserver.jdbc.SQLServerDriver",
        minpoolsize: 5,
        maxpoolsize: 10
    });
    console.log('Original query=%s', originalSql);


    return co(function* gen() {
        var testpool = null;
        var testconn = null;

        mssql.initialize(function(err) {
            if (err) {
                console.log(err);
            }
        });

        mssql.createStatement(function(err, statement) {
            if (err) {
                callback(err);
            } else {
                statement.executeQuery(originalSql, function(err, resultset) {
                    if (err) {
                        callback(err)
                    } else {
                        // Convert the result set to an object array.
                        resultset.toObjArray(function(err, results) {
                            if (results.length > 0) {
                                console.log("ID: " + results[0].ID);
                            }
                            callback(null, resultset);
                        });
                    }
                });
            }
        });
        yield mssql;
    }.bind(this));


    /*
    return co(function* gen() {
        // Select statement

        yield mssql.createStatement(function(err, statement) {
            if (err) {
                callback(err);
            } else {
                statement.executeQuery(originalSql, function(err, resultset) {
                    if (err) {
                        callback(err)
                    } else {
                        // Convert the result set to an object array.
                        resultset.toObjArray(function(err, results) {
                            if (results.length > 0) {
                                console.log("ID: " + results[0].ID);
                            }
                            callback(null, resultset);
                        });
                    }
                });
            }
        });


    }.bind(this));*/
}