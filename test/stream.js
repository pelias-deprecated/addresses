
var stream = require('../index'),
    through = require('through2');

module.exports.tests = {};

module.exports.tests.interface = function(test, common) {
  test('stream interface', function(t) {
    var s = stream();
    t.equal(typeof s, 'object', 'valid stream');
    t.equal(typeof s._read, 'function', 'valid readable');
    t.equal(typeof s._write, 'function', 'valid writeable');
    t.end();
  });
};

module.exports.tests.functional_example = function(test, common) {
  test('functional example', function(t) {

    t.plan(30); // t.end will be called automatically after x asserts

    // assert stream should receive 10 chunks
    var assertStream = through.obj( function( chunk, enc, next ){
      t.true( chunk.hasOwnProperty('housenumber'), 'housenumber set' );
      t.true( chunk.housenumber <= 22, 'less than or equal max' );
      t.true( chunk.housenumber >= 12, 'greater than or equal min' );
      next();
    });

    var s = stream();
    s.pipe(assertStream);
    s.write({ from: 12, to: 21 });

  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('stream: ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};