'use strict';

var fs = require( 'fs' );
var path = require( 'path' );

var CombinedStream = require('combined-stream');
var minimist = require( 'minimist' );
var osm = require( './lib/addresses/osm' );
var tiger = require( './lib/addresses/tiger' );

function createFileAddressStreams( dirName, filenameRegex, action ){
  var files = fs.readdirSync( dirName );
  for( var file = 0; file < files.length; file++ ){
    var filePath = path.join( dirName, files[ file ] );
    if( ( fs.lstatSync( filePath ).isFile() &&
      filenameRegex.test( filePath ) ) ){
      action( filePath );
    }
  }
}

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
