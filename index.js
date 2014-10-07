// 'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var util = require( 'util' );

var CombinedStream = require('combined-stream');
var minimist = require( 'minimist' );
var osm = require( './lib/addresses/osm' );
var tiger = require( './lib/addresses/tiger' );

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
  }
}

handleUserArgs( process.argv.slice( 2 ) );
