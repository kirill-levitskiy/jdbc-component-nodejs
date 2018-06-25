//'use strict';
const jdbc = require('jdbc');
const jinst = require('jdbc/lib/jinst');
const co = require('co');
const request = require('request-promise');
const messages = require('elasticio-node').messages;
//const db = require('node-any-jdbc');

exports.process = processAction;

/**
 * This function will be called during component intialization
 *
 * @param cfg
 * @returns {Promise}

function init(cfg) {

    console.log('Connecting to the database');
    var mssqlInit;
    if (!jinst.isJvmCreated()) {
        jinst.addOption('-Xrs');
        jinst.setupClasspath(['./drivers/sqljdbc4.jar',
            './drivers/ojdbc6.jar',
            './drivers/mysql.jar',
            './drivers/postgresql.jar']);
    }

    const conString = 'jdbc:sqlserver://elasticiotest.database.windows.net:1433;database=Test2;user=elasticiotest@elasticiotest;password=Init123$;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;';

    return co(function* gen() {

        var mssql = new JDBC({
            url: conString,
            drivername: "com.microsoft.sqlserver.jdbc.SQLServerDriver",
            minpoolsize: 5,
            maxpoolsize: 10
        });

        var mssqlConfig = {
            libpath: './drivers/ojdbc6.jar',
            drivername: "oracle.jdbc.driver.OracleDriver",
            //url:  conString,
            uri: 'jdbc:sqlserver://elasticiotest.database.windows.net:1433/Test2',
            user: 'elasticiotest',
            password: 'Init123$',
        };

        mssql.initialize(function(err) {
            if (err) {
                return callback(err);
            } else {
                mssqlInit = true;
                return callback(null, derby);
            }
        });

        var sql = 'select * from Test2.dbo.Tweets ORDER BY id OFFSET 1 ROWS FETCH NEXT 1 ROWS ONLY;';
        mssql.execute(mssqlConfig, sql, function(results){
            console.log(results);
        });

    }).bind(this);

}
*/
/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
function processAction(msg, cfg, snapshot = {}) {
    console.log('Started processAction')

    if (!jinst.isJvmCreated()) {
        jinst.addOption('-Xrs');
        jinst.setupClasspath(['./drivers/sqljdbc4.jar',
            './drivers/ojdbc6.jar',
            './drivers/mysql.jar',
            './drivers/postgresql.jar']);
    }

    console.log("Classpath was set");
    const originalSql = 'select * from Test2.dbo.Tweets ORDER BY id OFFSET 1 ROWS FETCH NEXT 1 ROWS ONLY;';
    /*
    var mssqlConfig = {
        libpath: "./drivers/ojdbc6.jar",
        drivername: "oracle.jdbc.driver.OracleDriver",
        //url:  conString,
        uri: "jdbc:sqlserver://elasticiotest.database.windows.net:1433/Test2",
        user: "elasticiotest",
        password: "Init123$",
    };
    */
    const conString = 'jdbc:sqlserver://elasticiotest.database.windows.net:1433;database=Test2;user=elasticiotest@elasticiotest;password=Init123$;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;';
    var mssql = new jdbc({
        url: conString,
        drivername: "com.microsoft.sqlserver.jdbc.SQLServerDriver",
        minpoolsize: 5,
        maxpoolsize: 10
    });
    const now = new Date().toISOString();
    // Last poll should come from Snapshot, if not it's beginning of time
    const lastPoll = snapshot.lastPoll || new Date(0).toISOString();
    console.log('Last polling timestamp=%s', lastPoll);
    const sql = originalSql.split(LAST_POLL_PLACEHOLDER).join(lastPoll);
    console.log('Original query=%s', originalSql);
    console.log('Transformed query=%s', sql);
    console.log("All preparing operations were finished");
/*
    mssql.execute(mssqlConfig, sql, function(results){
        console.log(results);
    });
    console.log("SQL query was executed");
*/
    return co(function* gen() {
/*
        mssql.on('recordset', (recordset) => {
            console.log('Have got recordset metadata=%j', recordset);
        });

        mssql.on('row', (row) => {
            this.emit('data', eioUtils.newMessageWithBody(row));
        });

        mssql.on('error', (err) => {
            this.emit('error', err);
        });

        mssql.on('done', (affected) => {
            console.log('Query execution completed, affected=%s', affected);
            this.emit('snapshot', {
                lastPoll: now
            });
            this.emit('end');
        });
*/
        // Run it
        /*
        yield mssql.execute(mssqlConfig, sql, function(results){
            console.log(results);
        });
        */
        // Select statement example.
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
    }.bind(this));
}

//module.exports.init = init;