'use strict';

var fs = require( 'fs' );
var osmAddresses = require( './lib/addresses/osm' );
var tigerAddresses = require( './lib/addresses/tiger' );
var util = require( 'util' );

/**
 * Handle user arguments.
 *
 * @param {array of strings} Command line arguments (`process.argv`).
 */
function handleUserInput( argv ){
  var useMessage = [
    'Insufficient number of arguments.',
    'use: node index.js [ --help | --stdin | FILENAME ]',
    '\n\t--help : print this message and exit.',
    '\t--stdin : read a PBF from stdin.',
    '\tFILENAME : the name of a PBF file to read.'
  ].join( '\n' );

  if( argv.length !== 3 ){
    console.error( useMessage );
    process.exit( 1 );
  }

  else {
    var pbfStream;

    switch( argv[ 2 ] ){
      case '--help':
        console.log( useMessage );
        return;
      case '--stdin':
        pbfStream = process.stdin;
        break;
      default:
        pbfStream = fs.createReadStream( argv[ 2 ] );
        break;
    }

    var pipeline = require( 'through' )( function write( obj ){
      console.log( JSON.stringify( obj, undefined, 2 ) );
    }); // temporary: for debugging
    osmAddresses( pbfStream ).pipe( pipeline );
  }
}

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
  // osmAddresses( fs.createReadStream( osmPath ) ).pipe( addressesPipeline );
  tigerAddresses( tigerPath ).pipe( addressesPipeline );
}

testImports();
