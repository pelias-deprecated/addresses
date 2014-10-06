var tape = require('tape');
var common = {};

var tests = [
  require( './osm' )
];

tests.map(function(t) {
  t.all(tape, common);
});
