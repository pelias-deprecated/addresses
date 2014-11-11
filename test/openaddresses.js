/**
 * @file Unit-tests for the 'openaddresses' addresses module.
 */

'use strict';

var stream = require( 'stream' );
var util = require( 'util' );
var through = require( 'through2' );

var openaddresses = require( '../lib/addresses/openaddresses' );
var Address = require( '../lib/address' );

module.exports.tests = {};

module.exports.tests.filter = function ( test, common ){
  test( 'filter(): Filters addresses.', function ( t ){
    // Check whether manually inserted records are being filtered
    // correctly.
    var rawRecords = new stream.Readable( { objectMode: true } );
    var assertFilter = through.obj( function write( obj, enc, next ){
      t.true(
        obj.lon !== '' &&
        obj.lat !== '' &&
        obj.number !== '' &&
        obj.street !== '',
        'All necessary fields are non-empty.'
      );
      next();
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

module.exports.tests.normalizer = function ( test, common ){
  test( 'normalizer(): normalizes addresses.',
    // Check whether manually inserted records are getting interpolated and
    // normalized correctly.
    function ( t ){
      var rawRecords = new stream.Readable( { objectMode: true } );
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
        t.deepEqual(
          obj, expected,
          util.format( 'Normalized record matches expected.' )
        );
        next();
      });
      rawRecords.pipe( openaddresses.normalizer ).pipe( assertFilter );
      t.end();
    }
  );
};
