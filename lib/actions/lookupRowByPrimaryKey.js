'use strict';
const jdbc = require('jdbc');
const jinst = require('jdbc/lib/jinst');
const co = require('co');
const request = require('request-promise');
const messages = require('elasticio-node').messages;
const db = require('node-any-jdbc');

/**
 * This function will be called during component intialization
 *
 * @param cfg
 * @returns {Promise}
 */
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
            url:  conString,
            // uri: 'jdbc:oracle:thin://abc-test.corp.int:1527/stage1',
            // user: 'QA',
            // password: 'password123',
        };
/*
        mssql.initialize(function(err) {
            if (err) {
                return callback(err);
            } else {
                mssqlInit = true;
                return callback(null, derby);
            }
        });
*/
        var sql = 'select * from Test2.dbo.Tweets ORDER BY id OFFSET 1 ROWS FETCH NEXT 1 ROWS ONLY;';
        mssql.execute(mssqlConfig, sql, function(results){
            console.log(results);
        });

    }).bind(this);

}
