/**
 * @file Unit-tests for the `osm` addresses module.
 */

'use strict';

var stream = require( 'stream' );
var util = require( 'util' );
var through = require( 'through' );
var osm = require( '../lib/addresses/osm' );

module.exports.tests = {};

module.exports.tests.filter = function ( test, common ){
  test( 'filter(): Filters addresses', function ( t ){
    // Check whether manually inserted records are being filtered
    // correctly.
    var rawRecords = new stream.Readable( { objectMode: true } );
    var assertFilter = through( function write( obj ){
      t.true( obj.type === 'node', 'Records are nodes' );
      t.true(
        obj.tags[ 'addr:street' ] !== null,
        'Street name is not null.'
      );
    }, function end(){
      t.end();
    });

    rawRecords.push([
      {
        'type' : 'Not a node',
        'addr:street' : 'street'
      },
      {
        'type' : 'node',
        'tags' : {}
      },
      {
        'type' : 'node',
        'tags' : {
          'addr:street' : 'street'
        }
      }
    ]);
    rawRecords.push( null );
    rawRecords.pipe( osm.filter ).pipe( assertFilter );
  });
};

module.exports.tests.normalizer = function ( test, common ){
  test( 'normalizer(): Normalizes addresses.', function ( t ){
    // Check whether manually inserted records are getting normalized
    // correctly.
    var rawRecords = new stream.Readable( { objectMode: true } );
    var assertFilter = through( function write( obj ){
      var expected = {
        'house' : 'a',
        'number' : '1',
        'street' : 'b',
        'city' : 'c',
        'state' : 'd',
        'zip' : '8',
        'coords': [ 44, 55 ]
      };
      var expectedCoords = [ 44, 55 ];

      t.deepEqual( expected, obj, 'Objects match.' );
    }, function end(){
      t.end();
    });

    rawRecords.push({
      'type' : 'Point',
      'lat' : 44,
      'lon' : 55,
      'tags' : {
        'addr:housenumber' : '1',
        'addr:housename' : 'a',
        'addr:street' : 'b',
        'addr:city' : 'c',
        'addr:district' : 'd',
        'addr:postcode' : '8'
      }
    });

    rawRecords.push( null );
    rawRecords.pipe( osm.normalizer ).pipe( assertFilter );
  });
};
