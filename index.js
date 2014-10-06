'use strict';

var fs = require( 'fs' );
var osm = require( './lib/addresses/osm' );
var tiger = require( './lib/addresses/tiger' );
var util = require( 'util' );

function testImports(){
  var testDir = 'test_sources/';
  var osmPath = testDir + 'test.osm.pbf';
  var tigerPath = testDir + 'test.shp';

  function checkIfFileExists( path ){
    if( ! fs.existsSync( path ) ){
      console.error( util.format( '"%s" not found.', path ) );
      process.exit( 1 );
    }
  }

  checkIfFileExists( osmPath );
  checkIfFileExists( tigerPath );

  var addressesPipeline = require( 'through' )( function write( obj ){
    console.log( JSON.stringify( obj, undefined, 2 ) );
  });
  // osm.addressStream( fs.createReadStream( osmPath ) )
    // .pipe( addressesPipeline );

  tiger.addressStream( tigerPath )
    .pipe( addressesPipeline );
}

testImports();
