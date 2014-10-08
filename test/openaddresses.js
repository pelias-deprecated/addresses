/**
 * @file Unit-tests for the 'openaddresses' addresses module.
 */

'use strict';

var stream = require( 'stream' );
var openaddresses = require( '../lib/addresses/openaddresses' );
var through = require( 'through' );

module.exports.tests = {};

module.exports.tests.filter = function ( test, common ){
  test( 'filter(): Filters addresses.', function ( t ){
    // Check whether manually inserted records are being filtered
    // correctly.
    var rawRecords = new stream.Readable( { objectMode: true } );
    var assertFilter = through( function write( obj ){
      t.true(
        obj.lon !== '' &&
        obj.lat !== '' &&
        obj.number !== '' &&
        obj.street !== '',
        'All necessary fields are non-empty.'
      );
    }, function end(){
      t.end();
    });

    rawRecords.push( { lon: '', lat: '-', number: '-', street: '-' } );
    rawRecords.push( { lon: '-', lat: '', number: '-', street: '-' } );
    rawRecords.push( { lon: '-', lat: '-', number: '', street: '-' } );
    rawRecords.push( { lon: '-', lat: '-', number: '-', street: '' } );
    rawRecords.push( { lon: '-', lat: '-', number: '-', street: '-' } );

    rawRecords.push( null );
    rawRecords.pipe( openaddresses.filter ).pipe( assertFilter );
  });
};
