var tape = require('tape');
var common = {};

var tests = [
  require( './address-normalizer' )
];

tests.map(function(t) {
  t.all(tape, common);
});
