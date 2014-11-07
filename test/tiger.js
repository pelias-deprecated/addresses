/**
 * @file Unit-tests for the 'tiger' addresses module.
 */

'use strict';

var stream = require( 'stream' );
var util = require( 'util' );
var tiger = require( '../lib/addresses/tiger' );
var through = require( 'through' );

module.exports.tests = {};

module.exports.tests.filter = function ( test, common ){
  test( 'filter(): Filters addresses.', function ( t ){
    // Check whether manually inserted records are being filtered
    // correctly.
    var rawRecords = new stream.Readable( { objectMode: true } );
    var assertFilter = through( function write( obj ){
      t.true(
        obj.geometry.type === 'LineString', 'Records are LineStrings'
      );

      function notNull( propName ){
        return obj.properties[ propName ] !== null;
      }

      t.true(
        ( notNull( 'LFROMADD' ) && notNull( 'LTOADD' ) ) ||
        ( notNull( 'RFROMADD' ) && notNull( 'RTOADD' ) ),
        'Valid street range is present.'
      );
    }, function end(){
      t.end();
    });

    var testRecords = [
      {
        geometry: {
          type: 'Not a LineString'
        },
        properties: {
          LFROMADD: null,
          LTOADD: null,
          RFROMADD: 5,
          RTOADD: 10
        }
      },
      {
        geometry: {
          type: 'LineString'
        },
        properties: {
          LFROMADD: null,
          LTOADD: null,
          RFROMADD: null,
          RTOADD: 10
        }
      },
      {
        geometry: {
          type: 'LineString'
        },
        properties: {
          LFROMADD: null,
          LTOADD: null,
          RFROMADD: 5,
          RTOADD: 10,
          FULLNAME: 'street'
        }
      }
    ];
    for( var rec = 0; rec < testRecords.length; rec++ ){
      rawRecords.push( testRecords[ rec ] );
    }
    rawRecords.push( null );
    rawRecords.pipe( tiger.filter ).pipe( assertFilter );
  });
};

module.exports.tests.normalizer = function ( test, common ){
  test( 'normalizer(): Interpolates and normalizes addresses.',
    // Check whether manually inserted records are getting interpolated and
    // normalized correctly.
    function ( t ){
      var rawRecords = new stream.Readable( { objectMode: true } );
      rawRecords.push({
        geometry: {
          coordinates: [ [ 0, 10 ], [ 4, 6 ], [ 7, 9 ], [ 3, 12 ] ]
        },
        properties: {
          LFROMADD: 19,
          LTOADD: 21,
          RFROMADD: 20,
          RTOADD: 22,
          FULLNAME: 'street',
          ZIPL: null,
          ZIPR: 10001
        }
      });
      rawRecords.push( null );

      var expected = [
        {
          house: null,
          number: 19,
          street: 'street',
          city: null,
          state: null,
          zip: 10001,
          lon: 0.00010606601717798211,
          lat: 10.000106066017178
        },
        {
          house: null,
          number: 21,
          street: 'street',
          city: null,
          state: null,
          zip: 10001,
          lon: 2.99991,
          lat: 11.99988
        },
        {
          house: null,
          number: 20,
          street: 'street',
          city: null,
          state: null,
          zip: 10001,
          lon: -0.00010606601717798211,
          lat: 9.999893933982822
        },
        {
          house: null,
          number: 22,
          street: 'street',
          city: null,
          state: null,
          zip: 10001,
          lon: 3.00009,
          lat: 12.00012
        }
      ];
      var currCompareRecord = 0;
      var assertFilter = through( function ( obj ){
        t.deepEqual(
          obj, expected[ currCompareRecord++ ],
          util.format( 'Record #%d matches.', currCompareRecord )
        );
      }, function end(){
        t.end();
      });
      rawRecords.pipe( tiger.normalizer ).pipe( assertFilter );
    }
  );
};
