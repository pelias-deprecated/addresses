/**
 * @file Unit-tests for the 'openaddresses' addresses module.
 */

'use strict';

var stream = require( 'stream' );
var util = require( 'util' );
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

      var expected = {
        house: null,
        number: 5,
        street: 'mapzen',
        city: null,
        state: null,
        zip: null,
        lat: 15,
        lon: 10
      };
      var assertFilter = through( function ( obj ){
        t.deepEqual(
          obj, expected,
          util.format( 'Normalized record matches expected.' )
        );
      });
      rawRecords.pipe( openaddresses.normalizer ).pipe( assertFilter );
      t.end();
    }
  );
};
