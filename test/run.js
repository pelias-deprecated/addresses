/**
 * @file The main entry point for the address pipeline's unit tests.
 *      Imports and runs all of the sibling files ( assumed to be modules that
 *      export objects containing `tape` test functions ) in this file's
 *      directory.
 */

'use strict';

var fs = require( 'fs' );
var util = require( 'util' );
var tape = require( 'tape' );

/**
 * Execute all functions in the object exported by a module.
 *
 * @param {string} testFilePath The path to the module. Will be imported, and
 *      each of its exported functions will be executed by `tape()`.
 */
function runTestFile( testFilePath ){
  var testModule = require( testFilePath );
  for( var test in testModule ){
    if( testModule.hasOwnProperty( test ) ){
      var testName = util.format(
        'File: %s, function: %s.', testFilePath, test
       );
      tape( testName, testModule[ test ] );
    }
  }
}

/**
 * Run all modules in this module's directory with `runTestFile()`.
 */
!function runTestFiles(){
  fs.readdir( __dirname, function readFilesCallback( err, files ){
    if( err ){
      console.err( err );
      process.exit( 1 );
    }

    files.splice( files.indexOf( __filename ) );
    for( var ind = 0; ind < files.length; ind++ ){
      runTestFile( './' + files[ ind ] );
    }
  } )
}();
