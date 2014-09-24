/**
 * @file Unit-tests for the address-normalizer module.
 */

'use strict';

module.exports.tests = {};

var Stream = require( 'stream' );
var util = require( 'util' );
var through = require( 'through' );
var addressNormalizer = require( '../address-normalizer' );

module.exports.tests.normalizer = function (test, common){
  test( 'Address normalizer', function (t){
    var stream = new Stream.Readable( { objectMode: true } );
    var assertFilter = through( function write(obj){
      var expected = {
        'house' : 'a1',
        'street' : 'b',
        'city' : 'c',
        'state' : 'd',
        'zip' : '8',
      };
      var expectedCoords = [ 17.355799925350922, 51.629529988171655 ];

      for(var prop in expected){
        if( expected.hasOwnProperty( prop ) ){
          t.true(
            obj.hasOwnProperty( prop ),
            util.format('Has property: "%s".', prop)
          );
          t.true(
            obj[ prop ] == expected[ prop ],
            util.format('"%s" value matches.', prop)
          );
        }
      }

      t.true( obj.hasOwnProperty( 'coords' ), 'Has property "coords."');
      for(var coord = 0; coord < 2; coord++){
        var diff = obj.coords[ coord ] -
          expectedCoords[ coord ];
        t.true(
          Math.abs( diff ) < 1e-4,
          util.format( 'Coordinate %d matches.', coord )
        );
      }
      t.true( obj.street !== null, 'Street is not null.' );
    });

    // Push objects to test filters/output.
    stream.push({
      'geometry' : {
        'type' : 'Point'
      },
      'properties' : {
        'addr:street' : null
      }
    });
    stream.push({
      'geometry' : {
        'type' : 'Line'
      },
      'properties' : {
        'addr:street' : 'street'
      }
    });
    stream.push({
      'geometry' : {
        'type' : 'Point',
        'coordinates' : [ 1932038.81, 6733414.93 ]
      },
      'properties' : {
        'addr:housenumber' : 1,
        'addr:housename' : 'a',
        'addr:street' : 'b',
        'addr:city' : 'c',
        'addr:district' : 'd',
        'addr:postcode' : '8'
      }
    });

    stream.push( null );
    stream.pipe( addressNormalizer ).pipe( assertFilter );
    t.end();
  });
};

module.exports.all = function all( tape, common ){
  function test( name, testFunction ){
    return tape( 'stream: ' + name, testFunction );
  }

  for( var testCase in module.exports.tests ){
    if( module.exports.tests.hasOwnProperty( testCase ) ){
      module.exports.tests[ testCase ]( test, common );
    }
  }
};
