'use strict';

const http = require('http');
const Promise = require('bluebird');
const pull = require('pull-stream');
const toPullSink = require('stream-to-pull-stream').sink;
const stringify = require('pull-json-stringify')();

module.exports = send;

function send( response, {
	// headers
	code = 200,
	message,
	headers,

	// body
	json,
	raw,
}){
	if (message === undefined)
		message = http.STATUS_CODES[code];

	if (json !== undefined) {
		response.setHeader('Content-Type', 'application/json; charset=utf-8');
		response.writeHead(code, message, headers);

		if (typeof json === 'function')
			return Promise.fromCallback(cb => pull(
				json,
				stringify,
				toPullSink(response, cb)
			));

		response.end(JSON.stringify(json));

		return Promise.resolve();
	}

	response.writeHead(code, message, headers);

	if (raw !== undefined) {
		if (typeof raw === 'function')
			return Promise.fromCallback(cb => pull(
				raw,
				toPullSink(response, cb)
			));

		response.end(raw);

		return Promise.resolve();
	}

	response.end();

	return Promise.resolve();
}
