# http-tell

A simple layer on top of `response.writeHead/write` that supports passing data
from buffers, strings or pull-streams, encoding it as
[ndjson](http://ndjson.org) or as is.

```js
tell(response, {
	// headers
	code,		// defaults to 200
	message,
	headers,	// { 'Content-Type': 'image/jpeg' }

	// body
	json,		// pull-stream or string
	raw,		// pull-stream or whatever
}, cb)
```

## Examples

```js
var tell = require('http-tell');

http.createServer(function( request, response ){
	tell(response, {
		201,

		json: { its: 'okay' },
	}, err => err
		? console.error(err)
		: console.log('Completed a request'));
})
	.listen(8000);
```

Streaming JSON:

```js
var pull = require('pull-stream');
var tell = require('http-tell');

http.createServer(function( request, response ){
	tell(response, {
		json: pull(
			pull.values([ 'a', 'b', 'c' ]),
			pull.map(i => i.toUpperCase())
		),
	}, err => err
		? console.error(err)
		: console.log('School\'s over'));
})
	.listen(8000);
```

Streaming a file:

```js
var pull = require('pull-stream');
var file = require('pull-file');
var tell = require('http-tell');

http.createServer(function( request, response ){
	tell(response, {
		headers: {
			'Content-Type': 'image/jpeg',
		},
		raw: file(__dirname+'/kitten.jpg'),
	}, err => err
		? console.error(err)
		: console.log('Sent a kitten'));
})
	.listen(8000);
```
