/**
 * The main entry point for the Pelias adresses import. Designed to be run as a
 * command-line utility: `node index.js --help`.
 */

'use strict';

var minimist = require( 'minimist' );
var datasetImport = require( './lib/dataset_import' );

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
    console.error( helpMessage );
    process.exit( 1 );
  }
  var args = minimist( rawArgs );
  if( args.hasOwnProperty( 'help' ) ){
    console.log( helpMessage );
    return;
  }
  else {
    datasetImport( args );
  }
}

handleUserArgs( process.argv.slice( 2 ) );
