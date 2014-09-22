
var interpolator = require('../interpolator');

module.exports.tests = {};

module.exports.tests.interface = function(test, common) {
  test('interface', function(t) {
    t.equal(typeof interpolator, 'function', 'function exported');
    t.end();
  });
};

module.exports.tests.interpolator = function(test, common) {
  test('extracts a range inclusive of $to and $from', function(t) {
    var expected = [1,2,3,4,5];
    t.deepEqual(interpolator(1,5), expected, 'interpolate range');
    t.end();
  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('interpolator: ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};