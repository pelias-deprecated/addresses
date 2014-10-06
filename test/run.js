'use strict';

var tape = require( 'tape' );
var common = {};

var tests = [
  require( './osm' ),
  require( './tiger' )
];

tests.map( function( t ) {
  function test( name, testFunction ){
    return tape( name, testFunction );
  }

  for( var testCase in t.tests ){
    if( t.tests.hasOwnProperty( testCase ) ){
      t.tests[ testCase ]( test, common );
    }
  }
});
