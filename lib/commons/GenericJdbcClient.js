"use strict";
const JDBC = require("jdbc");
const jinst = require("jdbc/lib/jinst");
const BaseJdbcClient = require("./JdbcClient");
//var conn;
//var originalSql;
var connString;
var jdbcObject;

module.exports = class GenericJdbcClient extends BaseJdbcClient {
    constructor(emitter, cfg) {

        switch (cfg.driverType) {
            case "SQLServerDriver":
                connString = "jdbc:sqlserver://"
                    + cfg.server
                    + ((cfg.instance) ? "\\" + cfg.instance : "")
                    + ((cfg.port) ? ":" + cfg.port : "")
                    + ((cfg.database) ? ";database=" + cfg.database : "");

                jdbcObject = new JDBC({
                    url: connString,
                    drivername: "com.microsoft.sqlserver.jdbc.SQLServerDriver",
                    minpoolsize: 5,
                    maxpoolsize: 10,
                    properties: {
                        user: cfg.username,
                        password: cfg.password
                    }
                });
                break;
            case "MySQLDriver":

                break;
            case "OracleDriver":

                break;
            case "PostgreSQLDriver":

                break;
            default:
                throw new Error(`Driver Type ${cfg.driverType} not yet implemented.`);
        }

        super(emitter, cfg, jdbcObject);
    }

    static init() {

        if (!jinst.isJvmCreated()) {
            jinst.addOption("-Xrs");
            jinst.setupClasspath(["./drivers/sqljdbc4.jar",
                "./drivers/ojdbc6.jar",
                "./drivers/mysql.jar",
                "./drivers/postgresql.jar"]);
        }

        // Initialize jdbc object
        /*
        jdbcObject.initialize(function (err) {
            if (err) {
                console.log("Error - MSSQL Initialize:", err);
            }
        });*/

        return jdbcObject;
    }

    static create(emitter, cfg) {
        return new GenericJdbcClient(emitter, cfg);
    }
};
