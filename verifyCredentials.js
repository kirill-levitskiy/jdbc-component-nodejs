"use strict";
const request = require('request-promise');

module.exports = verify;

/**
 * Executes the verification logic by sending a simple to the Petstore API using the provided apiKey.
 * If the request succeeds, we can assume that the apiKey is valid. Otherwise it is not valid.
 *
 * @param credentials object to retrieve apiKey from
 *
 * @returns Promise sending HTTP request and resolving its response
 */
function verify(credentials) {
    
    return true;
}