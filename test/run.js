'use strict';

var tape = require( 'tape' );
var common = {};

var tests = [
  require( './osm' ),
  require( './tiger' )
];

tests.map( function( t ) {
  t.all( tape, common );
});
