/**
 * The main entry point for the Pelias adresses import. Designed to be run as a
 * command-line utility: `node index.js --help`.
 */

'use strict';

var fs = require( 'fs' );
var path = require( 'path' );

var CombinedStream = require( 'combined-stream' );
var shapefileStream = require( 'shapefile-stream' );
var minimist = require( 'minimist' );
var requireDir = require( 'require-dir' );
var addresses = requireDir( 'lib/addresses' );

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
 * Import datasets into the addresses pipeline.
 *
 * @param {object} datasets An object mapping the name of each dataset to
 *      import to the directory containins its files. See the `--source`
 *      command-line argument in `node index.js --help`.
 */
function importDatasets( datasets ){
  var addressStreams = {};

  if( datasets.hasOwnProperty( 'osm' ) ){
    addressStreams.osm = CombinedStream.create();
    createFileAddressStreams(
      datasets.osm,
      /\.osm\.pbf$/,
      function ( filename ){
        var fileStream = fs.createReadStream( filename );
        addressStreams.osm.append( fileStream );
      }
    );
  }

  if( datasets.hasOwnProperty( 'tiger' ) ){
    addressStreams.tiger = CombinedStream.create();
    createFileAddressStreams(
      datasets.tiger,
      /\.shp$/,
      function ( filename ){
        addressStreams.tiger.append( function ( next ){
          var fileStream = shapefileStream.createReadStream(
            filename
          );
          next( fileStream );
        });
      }
    );
  }

  if( datasets.hasOwnProperty( 'openaddresses' ) ){
    addressStreams.openaddresses = CombinedStream.create();
    createFileAddressStreams(
      datasets.openaddresses,
      /\.csv$/,
      function ( filename ){
        var fileStream = fs.createReadStream( filename );
        addressStreams.openaddresses.append( fileStream );
      }
    );
  }

  var unifiedAddressStream = CombinedStream.create();
  var datasetOrder = ['openaddresses', 'osm', 'tiger'];
  for( var ind = 0; ind < datasetOrder.length; ind++ ){
    var dataset = datasetOrder[ ind ];
    if( addressStreams.hasOwnProperty( dataset ) ){
      var addressStream = addresses[ dataset ].addressStream(
        addressStreams[ dataset ]
      );
      unifiedAddressStream.append( addressStream );
    }
  }

  var addressesPipeline = require( 'through' )( function write( obj ){
    console.log( JSON.stringify( obj, undefined, 0 ) );
  }); // for testing
  unifiedAddressStream.pipe( addressesPipeline );
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
    importDatasets( args );
  }
}

handleUserArgs( process.argv.slice( 2 ) );
