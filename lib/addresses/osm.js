/**
 * @file Exports a filtered and normalized OSM Address stream.
 */

'use strict';

var through = require( 'through2' );
var osmPbfParser = require( 'osm-pbf-parser' );
var Address = require( '../address' );

/**
 * Filter OSM records.
 *
 * Creates a `through` stream that expects a stream of OSM buffered records.
 * Filters out anything that's not a node or doesn't have the 'addr:street' tag
 * (a street name).
 */
var filter = through.obj( function write( buffer, end, next ){
  for( var obj = 0; obj < buffer.length; obj++ ){
    if( buffer[ obj ].type === 'node' &&
      buffer[ obj ].tags.hasOwnProperty( 'addr:street' ) ){
      this.push( buffer[ obj ] );
    }
  }
  next();
});

/**
 * Normalize OSM records.
 *
 * Creates a `through` stream that expects a stream of OSM records. Normalizes
 * the others into an Address object.
 */
var normalizer = through.obj( function write( node, end, next ){
  function getTag( prop ){
    return ( node.tags.hasOwnProperty( prop ) ) ? node.tags[ prop ] : null;
  }

  this.push( new Address(
    getTag( 'addr:housename' ),
    getTag( 'addr:housenumber' ),
    getTag( 'addr:street' ),
    getTag( 'addr:city' ),
    getTag( 'addr:district' ),
    getTag( 'addr:postcode' ),
    getTag( 'addr:country' ),
    node.lat,
    node.lon
  ));
  next();
});

/**
 * Filter and normalize an OSM record stream.
 *
 * @param {readable stream} input Raw OSM records, as read from an OSM PBF.
 * @return {readable stream} Filtered OSM records, now normalized into Address
 *      objects.
 */
function addressStream( input ){
  return input
    .pipe( osmPbfParser() )
    .pipe( filter )
    .pipe( normalizer );
}

module.exports = {
  filter: filter,
  normalizer: normalizer,
  addressStream: addressStream
};
