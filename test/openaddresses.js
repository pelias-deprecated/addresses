/**
 * @file Unit-tests for the 'openaddresses' addresses module.
 */

'use strict';

var stream = require( 'stream' );
var util = require( 'util' );
var through = require( 'through2' );

var openaddresses = require( '../lib/addresses/openaddresses' );
var Address = require( '../lib/address' );

var tests = {};

tests.filter = function ( test ){
  // Check whether manually inserted records are being filtered
  // correctly.
  var rawRecords = new stream.Readable( { objectMode: true } );
  var assertFilter = through.obj( function write( obj, enc, next ){
    test.true(
      obj.lon !== '' &&
      obj.lat !== '' &&
      obj.number !== '' &&
      obj.street !== '',
      'All necessary fields are non-empty.'
    );
    next();
  });

  test.plan( 1 );
  rawRecords.push( { lon: '', lat: '-', number: '-', street: '-' } );
  rawRecords.push( { lon: '-', lat: '', number: '-', street: '-' } );
  rawRecords.push( { lon: '-', lat: '-', number: '', street: '-' } );
  rawRecords.push( { lon: '-', lat: '-', number: '-', street: '' } );
  rawRecords.push( { lon: '-', lat: '-', number: '-', street: '-' } );

  rawRecords.push( null );
  rawRecords.pipe( openaddresses.filter ).pipe( assertFilter );
};

tests.normalizer = function ( test ){
  // Check whether manually inserted records are getting interpolated and
  // normalized correctly.
  var rawRecords = new stream.Readable( { objectMode: true } );

  test.plan( 1 );
  rawRecords.push({
    lon: 10,
    lat: 15,
    number: 5,
    street: 'mapzen'
  });
  rawRecords.push( null );

  var expected = new Address(
    null, 5, 'mapzen', null, null, null, null, 15, 10
  );
  var assertFilter = through.obj( function ( obj, enc, next ){
    test.deepEqual(
      obj, expected,
      util.format( 'Normalized record matches expected.' )
    );
    next();
  });
  rawRecords.pipe( openaddresses.normalizer ).pipe( assertFilter );
};

module.exports = tests;
