var tape = require('tape');
var common = {};

var tests = [
  require( './index' ),
  require( './address-normalizer' )
];

tests.map(function(t) {
  t.all(tape, common);
});
