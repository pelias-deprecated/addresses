'use strict';

var fs = require( 'fs' );
var osmPbfParser = require( 'osm-pbf-parser' );
var addressNormalizer = require( './address-normalizer' );

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

  if(argv.length !== 3){
    console.error(useMessage);
    process.exit( 1 );
  }

  else {
    var pbfStream;

    switch( argv[ 2 ] ){
      case '--help':
        console.log(useMessage);
        return;
      case '--stdin':
        pbfStream = process.stdin;
        break;
      default:
        pbfStream = fs.createReadStream(argv[ 2 ]);
        break;
    }

    var through = require( 'through' ); // temporary: for debugging
    pbfStream
      .pipe( osmPbfParser() )
      .pipe( addressNormalizer.filter )
      // .pipe( addressNormalizer.normalizer )
      .pipe( through( function write(obj){
        console.log(JSON.stringify(obj));
      }));
    }
}

handleUserInput( process.argv );
