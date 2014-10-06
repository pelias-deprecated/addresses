'use strict';

var util = require( 'util' );
var tape = require( 'tape' );
var common = {};

var testPaths = [
  'osm',
  'tiger'
];

testPaths.map( function( path ) {
  function runTest( name, testFunction ){
    return tape( util.format( '%s: %s', path, name ), testFunction );
  }

  var testModule = require( './' + path );

  for( var testCase in testModule.tests ){
    if( testModule.tests.hasOwnProperty( testCase ) ){
      testModule.tests[ testCase ]( runTest, common );
    }
  }
});
