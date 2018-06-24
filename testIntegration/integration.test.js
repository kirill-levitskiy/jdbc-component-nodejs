'use strict';
const expect = require('chai').expect;
const insert = require('../lib/actions/lookupRowByPrimaryKey.js');
const { messages } = require('elasticio-node');
const EventEmitter = require('events');

class TestEmitter extends EventEmitter {
    constructor(done) {
        super();
        this.data = [];
        this.end = 0;
        this.error = [];

        this.on('data', (value) => this.data.push(value));
        this.on('error', (value) => {
            this.error.push(value);
            console.error(value.stack || value);
        });
        this.on('end', () => {
            this.end++;
            done();
        });
    }
}

describe('Integration test', () => {
    before(() => {
        if (!process.env.MSSQL_URL) { throw new Error('Please set MSSQL_URL env variable to proceed'); }
    });

    describe('for INSERT', () => {
        const cfg = {
            uri: process.env.MSSQL_URL,
            query: 'INSERT INTO Test2.dbo.Tweets (Lang, Retweeted, Favorited, "Text", id, '
            + 'CreatedAt, Username, ScreenName) '
            + 'VALUES (@lang, @retweeted:boolean, @favorited:boolean, @text:string, @id:bigint, '
            + '@created_at:date, @username, @screenname:string)'
        };

        before(() => insert.init(cfg));

        it('should insert data', () => {
            const emitter = new TestEmitter();
            const msg = {
                body: {
                    lang: 'en',
                    retweeted: false,
                    favorited: false,
                    text: 'Hello integration testing',
                    id: 12345678910,
                    created_at: new Date().toISOString(),
                    username: 'Renat Zubairov',
                    screenname: 'zubairov'
                }
            };
            return insert.process.call(emitter, msg).then((result) => {
                expect(result).deep.equal(msg);
                expect(emitter.data.length).to.equal(0);
                // promises, no need to emit end
                expect(emitter.end).to.equal(0);
                // No error
                expect(emitter.error.length).to.equal(0);
            });
        });
    });

    describe('for SELECT', () => {
        const cfg = {
            uri: process.env.MSSQL_URL
        };

        before(() => select.init(cfg));

        it('should select data', (done) => {
            const emitter = new TestEmitter(() => {
                expect(emitter.error.length).to.equal(0);
                expect(emitter.data.length).to.equal(10);
                expect(emitter.end).to.equal(1);
                done();
            });
            const msg = messages.newMessageWithBody({
                query: 'select * from Tweets ORDER BY id OFFSET 10 ROWS FETCH NEXT 10 ROWS ONLY;'
            });
            select.process.call(emitter, msg, cfg).catch(err => done(err));
        });
    });

    describe('for legacy SELECT configuration', () => {
        const cfg = {
            uri: process.env.MSSQL_URL,
            query: 'select * from Tweets ORDER BY id OFFSET 10 ROWS FETCH NEXT 10 ROWS ONLY;'
        };

        before(() => select.init(cfg));

        it('should select data', (done) => {
            const emitter = new TestEmitter(() => {
                expect(emitter.error.length).to.equal(0);
                expect(emitter.data.length).to.equal(10);
                expect(emitter.end).to.equal(1);
                done();
            });
            const msg = messages.newMessageWithBody({});
            select.process.call(emitter, msg, cfg).catch(err => done(err));
        });
    });

    describe('for polling SELECT', () => {
        const cfg = {
            uri: process.env.MSSQL_URL
        };

        before(() => select.init(cfg));

        it('should insert data', (done) => {
            const emitter = new TestEmitter(() => {
                expect(emitter.error.length).to.equal(0);
                expect(emitter.end).to.equal(1);
                done();
            });
            const msg = {
                body: {
                    query: 'select * from Leads where Created >= \'%%EIO_LAST_POLL%%\''
                }
            };
            select.process.call(emitter, msg, cfg, {}).catch(err => done(err));
        });
    });
});
