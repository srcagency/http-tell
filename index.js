'use strict';

const messagesByCode = require('http').STATUS_CODES;
const pull = require('pull-stream');
const toPullSink = require('stream-to-pull-stream').sink;
const stringify = require('pull-json-stringify')();

module.exports = send;

function send( response, {
	// headers
	code = 200,
	message = messagesByCode[code],
	headers,

	// body
	json,
	raw,
}, cb){
	if (json !== undefined) {
		response.setHeader('Content-Type', 'application/json; charset=utf-8');
		response.writeHead(code, message, headers);

		if (typeof json === 'function')
			return pull(
				json,
				stringify,
				toPullSink(response, cb)
			);

		response.end(JSON.stringify(json));

		return cb();
	}

	response.writeHead(code, message, headers);

	if (raw !== undefined) {
		if (typeof raw === 'function')
			return pull(
				raw,
				toPullSink(response, cb)
			);

		response.end(raw);

		return cb();
	}

	response.end();

	return cb();
}
