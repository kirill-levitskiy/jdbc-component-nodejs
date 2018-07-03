//'use strict';

const jsonSchemaGenerator = require('json-schema-generator');
const {messages} = require('elasticio-node');
const metadata = require('./jdbc_metadata/jdbcMetadata.js');

module.exports = class JdbcClient {
    constructor(emitter, cfg, jdbcObject) {
        this.emitter = emitter;
        this.cfg = cfg;
        this.jdbcObject = jdbcObject;
    }
/*
    async initConnection (jdbcObject) {
        // Initialize jdbc object
        console.log("121121");
        jdbcObject.initialize(function (err) {
            if (err) {
                console.log("Error - MSSQL Initialize:", err);
            }
        });
        return jdbcObject
    }
*/
    async listObjects (cfg) {
        var connString;
        var libpath;
        var drivername;

        switch (cfg.driverType) {
            case 'SQLServerDriver':
                connString = 'jdbc:sqlserver://'
                    + cfg.server
                    + ((cfg.instance) ? '\\' + cfg.instance : '')
                    + ((cfg.port) ? ':' + cfg.port : '')
                    + ((cfg.database) ? ';database=' + cfg.database : '');
                libpath = __dirname + "\\..\\..\\drivers\\sqljdbc4.jar";
                drivername = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
                break;
            case 'MySQLDriver':
                //authenticatedRestClient = new BasicAuthRestClient(emitter, cfg, cfg.auth.basic.username, cfg.auth.basic.password);
                break;
            case 'OracleDriver':
                //authenticatedRestClient = new ApiKeyRestClient(emitter, cfg, cfg.auth.apiKey.headerName, cfg.auth.apiKey.headerValue);
                break;
            case 'PostgreSQLDriver':
                //authenticatedRestClient = new ApiKeyRestClient(emitter, cfg, cfg.auth.apiKey.headerName, cfg.auth.apiKey.headerValue);
                break;
            default:
                throw new Error(`Driver Type ${cfg.driverType} not yet implemented.`);
        }

        var jdbcConfig = {
            libpath: libpath,
            drivername: drivername,
            url: connString,
            user: cfg.username,
            password: cfg.password
        };

        var jdbcMetadata = new metadata(jdbcConfig);

        jdbcMetadata.metadata(function (err, metadata) {

            console.log('Getting tables...');

            jdbcMetadata.tables(null, function (err, tables) {
                console.log(tables);

                jdbcMetadata.close(function(err) {
                    console.log('Connection closed');
                });
            });
        });

        return jdbcMetadata;
    }

    async buildMetadataForEntityType (entityType) {
        const sampleDocument = await this.restClient.makeRequest({
            url: `${entityType}?$top=1`,
            method: 'GET'
        });
        const jsonSchemaDescription = jsonSchemaGenerator(sampleDocument.value[0]);
        delete jsonSchemaDescription['$schema'];
        delete jsonSchemaDescription.properties['@odata.etag'];
        const guessedKeyName = `${entityType.replace(/s$/, '')}id`;
        Object.keys(jsonSchemaDescription.properties).forEach(prop => {
            if (prop.charAt(0) === '_' || prop === guessedKeyName) { // Assume these are hidden
                delete jsonSchemaDescription.properties[prop];
            } else {
                const obj = jsonSchemaDescription.properties[prop];
                delete obj.minLength;
                if (!obj.type) {
                    obj.type = 'string';
                }
            }
        });
        jsonSchemaDescription.properties.id = {
            type: 'string'
        };
        return {
            in: jsonSchemaDescription,
            out: jsonSchemaDescription
        };
    }

    async lookupObjectByPrimaryKey(msg, cfg) {
        const fieldValue = msg.body[this.cfg.fieldName];

        /*
        for testing purpose
         */

        this.listObjects(cfg);

        if (fieldValue === '') {
            if (this.cfg.allowEmptyCriteria) {
                this.emitter.emit(messages.newMessageWithBody({}));
                return;
            }

            throw new Error('Field Value is not provided for lookup where empty criteria are not allowed.');
        }

        const castFieldValue = this.cfg.castToString ? `'${fieldValue}'` : fieldValue;

        const results = {value:'a'};

        if (results.value.length !== 1) {
            throw new Error(`Failed to find a single ${this.cfg.objectType} corresponding to ${this.cfg.fieldName} === ${castFieldValue}.  Instead found ${results.value.length}.'`);
        }

        this.emitter.emit('data', messages.newMessageWithBody(results.value[0]));
    }

    async getFieldsForObject(entityType) {
        const objectStructure = await this.buildMetadataForEntityType(entityType);
        return Object.keys(objectStructure.out.properties).reduce((soFar, prop) => {
            soFar[prop] = prop;
            return soFar;
        }, {});
    }

    static _getListOfObjectsFactory(JdbcClientClass) {
        return async function (cfg) {
            const client = JdbcClientClass.create(this, cfg).initConnection();
            return client.listObjects();
        };
    }

    static _getFieldsForObjectFactory(JdbcClientClass) {
        return async function (cfg) {
            const client = JdbcClientClass.create(this, cfg);
            return client.getFieldsForObject(cfg.objectType);
        };
    }

    getMetaModelForLookupObjectByPrimaryKey() {
        const metadata = {
            in: {
                type: 'object',
                properties: {
                    [this.cfg.fieldName]: {
                        type: 'string',
                        required: true,
                        title: this.cfg.fieldName
                    }
                }
            },
            out: {}
        };
    }

    static _getMetaModelForLookupObjectByPrimaryKeyFactory(JdbcClientClass) {
        return function (cfg) {
            const client = JdbcClientClass.create(this, cfg);
            return client.getMetaModelForLookupObjectByPrimaryKey();
        };
    }

    static lookupObjectByPrimaryKeyFactory(JdbcClientClass) {
        return {
            // eslint-disable-next-line no-unused-vars
            process: async function (msg, cfg, snapshot = {}) {
                const client = JdbcClientClass.create(this, cfg);
                await client.lookupObjectByPrimaryKey(msg, cfg);
            },
            getObjects: this._getListOfObjectsFactory(JdbcClientClass),
            getFieldsForObject: this._getFieldsForObjectFactory(JdbcClientClass),
            getMetaModel: this._getMetaModelForLookupObjectByPrimaryKeyFactory(JdbcClientClass)
        };
    }

};