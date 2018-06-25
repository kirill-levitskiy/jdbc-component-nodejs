'use strict';
const expect = require('chai').expect;
const lookup = require('../lib/actions/lookupRowByPrimaryKey');
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

    describe('for SELECT', () => {
        let cfg = '';

        it('should select data', (done) => {
            const emitter = new TestEmitter(() => {
                expect(emitter.error.length).to.equal(0);
                expect(emitter.data.length).to.equal(10);
                expect(emitter.end).to.equal(1);
                done();
            });
            const msg = messages.newMessageWithBody({
                query: 'select * from Test2.dbo.Tweets ORDER BY id OFFSET 10 ROWS FETCH NEXT 10 ROWS ONLY;'
            });
            lookup.process.call(emitter, msg, cfg).catch(err => done(err));
        });
    });

});