/**
 * @file Unit-tests for the `osm` addresses module.
 */

'use strict';

var stream = require( 'stream' );
var through = require( 'through2' );
var osm = require( '../lib/addresses/osm' );
var Address = require( '../lib/address' );

var tests = {};

tests.filter = function ( test ){
  // Check whether manually inserted records are being filtered
  // correctly.
  var rawRecords = new stream.Readable( { objectMode: true } );
  var assertFilter = through.obj( function write( obj, enc, next ){
    test.true( obj.type === 'node', 'Records are nodes' );
    test.true(
      obj.tags[ 'addr:street' ] !== null,
      'Street name is not null.'
    );
    next();
  });

  var testRecords = [
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
  ];
  test.plan( 2 );

  rawRecords.push( testRecords );
  rawRecords.push( null );
  rawRecords.pipe( osm.filter ).pipe( assertFilter );
};

tests.normalizer = function ( test ){
  // Check whether manually inserted records are getting normalized
  // correctly.
  var rawRecords = new stream.Readable( { objectMode: true } );
  var assertFilter = through.obj( function write( obj, enc, next ){
    var expected = new Address( 'a', '1', 'b', 'c', 'd', '8', null, 44, 55 );

    test.deepEqual( expected, obj, 'Objects match.' );
    next();
  });

  test.plan( 1 );
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
};

module.exports = tests;
