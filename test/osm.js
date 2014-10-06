/**
 * @file Unit-tests for the `osm` addresses module.
 */

'use strict';

module.exports.tests = {};

var stream = require( 'stream' );
var util = require( 'util' );
var through = require( 'through' );
var osm = require( '../lib/addresses/osm' );

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
        'zip' : '8'
      };
      var expectedCoords = [ 44, 55 ];

      for( var prop in expected ){
        if( expected.hasOwnProperty( prop ) ){
          t.true(
            obj.hasOwnProperty( prop ),
            util.format( 'Has property: "%s".', prop )
          );
          t.true(
            obj[ prop ] === expected[ prop ],
            util.format( '"%s" value matches.', prop )
          );
        }
      }

      t.true( obj.hasOwnProperty( 'coords' ), 'Has property "coords."' );
      for( var coord = 0; coord < 2; coord++ ){
        t.true(
          obj.coords[ coord ] === expectedCoords[ coord ],
          util.format( 'Coordinate %d matches.', coord )
        );
      }
      t.true( obj.street !== null, 'Street is not null.' );
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
