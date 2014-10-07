/**
 * The main entry point for the Pelias adresses import. Designed to be run as a
 * command-line utility: `node index.js --help`.
 */

'use strict';

var fs = require( 'fs' );
var path = require( 'path' );

var CombinedStream = require( 'combined-stream' );
var minimist = require( 'minimist' );
var osm = require( './lib/addresses/osm' );
var tiger = require( './lib/addresses/tiger' );

/**
 * Execute an action on all files in a directory whose paths match a regular
 * expression.
 *
 * @param {string} dirPath The path of the directory to search.
 * @param {string} filenameRegex The regular expression to match file names
 *      inside `dirPath` against.
 * @param {function} action A function taking a single argument, a string
 *      filepath, that'll be called once for every matching path.
 */
function createFileAddressStreams( dirPath, filenameRegex, action ){
  var files = fs.readdirSync( dirPath );
  for( var file = 0; file < files.length; file++ ){
    var filePath = path.join( dirPath, files[ file ] );
    if( ( fs.lstatSync( filePath ).isFile() &&
      filenameRegex.test( filePath ) ) ){
      action( filePath );
    }
  }
}

/**
 * Respond to user command-line arguments.
 *
 * @param {array of string} rawArgs Just `process.argv.splice( 2 )` ( ie, all
 *      command-line arguments in an array).
 */
function handleUserArgs( rawArgs ){
  var helpMessage = [
    'A tool for importing, normalizing, and cross-interpolating addresses',
    'from numerous data sets. Use:',
    '\n\tnode index.js [ --help | --source SOURCE [ ... ] ]\n',
    '--help: print this message and exit.',
    '--source SOURCE: import all files belonging to a supported dataset',
    '\tfrom the argument directory (eg `--tiger tiger_shapefiles/`).'
  ].join( '\n' );

  if( rawArgs.length === 0 ){
    console.log( helpMessage );
    process.exit( 1 );
  }
  var args = minimist( rawArgs );
  if( args.hasOwnProperty( 'help' ) ){
    console.log( helpMessage );
    return;
  }
  else {
    var addressStream = CombinedStream.create();

    if( args.hasOwnProperty( 'osm' ) ){
      createFileAddressStreams(
        args.osm,
        /\.osm\.pbf$/,
        function ( filename ){
          var osmStream = osm.addressStream(
            fs.createReadStream( filename )
          );
          addressStream.append( osmStream );
        }
      );
    }

    if( args.hasOwnProperty( 'tiger' ) ){
      createFileAddressStreams(
        args.tiger,
        /\.shp$/,
        function ( filename ){
          addressStream.append( tiger.addressStream( filename ) );
        }
      );
    }

    var addressesPipeline = require( 'through' )( function write( obj ){
      console.log( JSON.stringify( obj.house, undefined, 2 ) );
    });
    addressStream.pipe( addressesPipeline );
  }
}

handleUserArgs( process.argv.slice( 2 ) );
