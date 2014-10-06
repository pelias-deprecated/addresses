/**
 * @file Unit-tests for the 'tiger' addresses module.
 */

'use strict';

var stream = require( 'stream' );
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
          fullname: 'street'
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

module.exports.all = function all( tape, common ){
  function test( name, testFunction ){
    return tape( name, testFunction );
  }

  for( var testCase in module.exports.tests ){
    if( module.exports.tests.hasOwnProperty( testCase ) ){
      module.exports.tests[ testCase ]( test, common );
    }
  }
};
