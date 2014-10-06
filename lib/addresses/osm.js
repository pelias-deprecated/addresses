/**
 * @file Exports a filtered and normalized OSM Address stream.
 */

'use strict';

var through = require( 'through' );
var osmPbfParser = require( 'osm-pbf-parser' );
var Address = require( '../address' );

/**
 * Filter OSM records.
 *
 * Creates a `through` stream that expects a stream of OSM buffered records.
 * Filters out anything that's not a node or doesn't have the 'addr:street' tag
 * (a street name).
 */
var filter = through( function write( buffer ){
  for( var obj = 0; obj < buffer.length; obj++ ){
    if( buffer[ obj ].type === 'node' &&
      buffer[ obj ].tags.hasOwnProperty( 'addr:street' ) ){
      this.push( buffer[ obj ] );
    }
  }
});

/**
 * Normalize OSM records.
 *
 * Creates a `through` stream that expects a stream of OSM records. Normalizes
 * the others into an Address object.
 */
var normalizer = through( function write( node ){
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
    [ node.lat, node.lon ]
  ));
});

/**
 * Filter and normalize an OSM record stream.
 *
 * @param {readable stream} input Raw OSM records, as read from an OSM PBF.
 * @param {readable stream} Filtered OSM records, now normalized into Address
 *      objects.
 */
function addressStream( input ){
  return input
    .pipe( osmPbfParser() )
    .pipe( filter )
    .pipe( normalizer );
}

module.exports = addressStream;
