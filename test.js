'use strict';

const http = require('http');
const Promise = require('bluebird');
const request = require('request');
const test = require('tape');
const pull = require('pull-stream');
const tell = require('./');

test('Defaults', function( t ){
	t.plan(6);

	issue({}, function({ err, response, body, returned }){
		t.notOk(err);
		t.notOk(body);
		t.ok(returned instanceof Promise);
		t.ok(returned.isFulfilled());

		t.equal(response.statusCode, 200);

		t.deepEqual(response.headers, {
			connection: 'close',
			date: response.headers.date,
			'transfer-encoding': 'chunked',
		});
	});
});

test('Code only', function( t ){
	t.plan(6);

	issue({
		code: 200,
	}, function({ err, response, body, returned }){
		t.notOk(err);
		t.notOk(body);
		t.ok(returned instanceof Promise);
		t.ok(returned.isFulfilled());

		t.equal(response.statusCode, 200);

		t.deepEqual(response.headers, {
			connection: 'close',
			date: response.headers.date,
			'transfer-encoding': 'chunked',
		});
	});
});

test('Code and headers', function( t ){
	t.plan(6);

	issue({
		code: 201,
		headers: {
			'x-test': 'abc',
		},
	}, function({ err, response, body, returned }){
		t.notOk(err);
		t.notOk(body);
		t.ok(returned instanceof Promise);
		t.ok(returned.isFulfilled());

		t.equal(response.statusCode, 201);

		t.deepEqual(response.headers, {
			connection: 'close',
			date: response.headers.date,
			'transfer-encoding': 'chunked',
			'x-test': 'abc',
		});
	});
});

test('Code and a message', function( t ){
	t.plan(7);

	issue({
		code: 201,
		message: 'Test',
	}, function({ err, response, body, returned }){
		t.notOk(err);
		t.notOk(body);
		t.ok(returned instanceof Promise);
		t.ok(returned.isFulfilled());

		t.equal(response.statusCode, 201);
		t.equal(response.statusMessage, 'Test');

		t.deepEqual(response.headers, {
			connection: 'close',
			date: response.headers.date,
			'transfer-encoding': 'chunked',
		});
	});
});

test('Code, message and headers', function( t ){
	t.plan(7);

	issue({
		code: 201,
		message: 'Test',
		headers: {
			'x-test': 'abc',
		},
	}, function({ err, response, body, returned }){
		t.notOk(err);
		t.notOk(body);
		t.ok(returned instanceof Promise);
		t.ok(returned.isFulfilled());

		t.equal(response.statusCode, 201);
		t.equal(response.statusMessage, 'Test');

		t.deepEqual(response.headers, {
			connection: 'close',
			date: response.headers.date,
			'transfer-encoding': 'chunked',
			'x-test': 'abc',
		});
	});
});

test('Primitive JSON', function( t ){
	t.plan(5);

	issue({
		code: 200,
		json: 123,
	}, function({ err, response, body, returned }){
		t.notOk(err);
		t.ok(returned instanceof Promise);
		t.ok(returned.isFulfilled());

		t.equal(body, '123');

		t.deepEqual(response.headers, {
			connection: 'close',
			date: response.headers.date,
			'transfer-encoding': 'chunked',
			'content-type': 'application/json; charset=utf-8',
		});
	});
});

test('Complex JSON', function( t ){
	t.plan(5);

	const sample = { a: 1, b: { c: 2 } };

	issue({
		code: 200,
		json: sample,
	}, function({ err, response, body, returned }){
		t.notOk(err);
		t.ok(returned instanceof Promise);
		t.ok(returned.isFulfilled());

		t.deepEqual(JSON.parse(body), sample);

		t.deepEqual(response.headers, {
			connection: 'close',
			date: response.headers.date,
			'transfer-encoding': 'chunked',
			'content-type': 'application/json; charset=utf-8',
		});
	});
});

test('Overwriting the "Content-Type" header', function( t ){
	t.plan(5);

	issue({
		code: 200,
		json: 123,
		headers: {
			'Content-Type': 'text/json',
		},
	}, function({ err, response, body, returned }){
		t.notOk(err);
		t.ok(returned instanceof Promise);
		t.ok(returned.isFulfilled());

		t.equal(body, '123');

		t.deepEqual(response.headers, {
			connection: 'close',
			date: response.headers.date,
			'transfer-encoding': 'chunked',
			'content-type': 'text/json',
		});
	});
});

test('Streaming JSON', function( t ){
	t.plan(5);

	const sample = [ 'a', 'b', 'c' ];

	issue({
		code: 200,
		json: pull.values(sample),
	}, function({ err, response, body, returned }){
		t.notOk(err);
		t.ok(returned instanceof Promise);
		t.ok(returned.isFulfilled());

		t.equal(body, '"a"\n"b"\n"c"\n');

		t.deepEqual(response.headers, {
			connection: 'close',
			date: response.headers.date,
			'transfer-encoding': 'chunked',
			'content-type': 'application/json; charset=utf-8',
		});
	});
});

test('Simple raw data', function( t ){
	t.plan(5);

	var sample = Buffer.from('aaff54', 'hex');

	issue({
		code: 200,
		raw: sample,
	}, function({ err, response, body, returned }){
		t.notOk(err);
		t.ok(returned instanceof Promise);
		t.ok(returned.isFulfilled());

		t.ok(sample.equals(body));

		t.deepEqual(response.headers, {
			connection: 'close',
			date: response.headers.date,
			'transfer-encoding': 'chunked',
		});
	}, true);
});

test('Streaming raw data', function( t ){
	t.plan(5);

	const sample = [
		Buffer.from('Bob', 'utf8'),
		Buffer.from(' is ', 'utf8'),
		Buffer.from('nice', 'utf8'),
	];

	issue({
		code: 200,
		raw: pull.values(sample),
	}, function({ err, response, body, returned }){
		t.notOk(err);
		t.ok(returned instanceof Promise);
		t.ok(returned.isFulfilled());

		t.equal(body, 'Bob is nice');

		t.deepEqual(response.headers, {
			connection: 'close',
			date: response.headers.date,
			'transfer-encoding': 'chunked',
		});
	});
});

function issue( description, cb, binary ){
	let returned;

	const server = http.createServer(function( req, res ){
		returned = tell(res, description);
	})
		.listen(0, () => request.get({
			url: 'http://localhost:'+server.address().port,
			encoding: binary ? null : undefined,
		}, function( err, response, body ){
			cb({ err, response, body, returned });

			server.close();
		}));
}
