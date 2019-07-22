var metadata = require('../lib/commons/jdbc_metadata/jdbcMetadata.js');

var libpath = "D:\\workspace\\jdbc-component-nodejs\\lib\\commons\\..\\..\\drivers\\sqljdbc4.jar";
var drivername = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
var url = "jdbc:sqlserver://elasticiotest.database.windows.net:1433;database=Test2";

var jdbcConfig = {
    libpath: libpath,
    drivername: drivername,
    url: url,
    user: "elasticiotest",
    password: "Init123$"
};

var jdbcMetadata = new metadata(jdbcConfig);

jdbcMetadata.metadata(function (err, metadata) {

    console.log('Getting tables...');
    var options = {schema: 'dbo', types: ['TABLE', 'VIEW']};

    jdbcMetadata.tables(options, function (err, tables) {
        console.log(tables);

        jdbcMetadata.close(function(err) {
            console.log('Connection closed');
        });
    });
});