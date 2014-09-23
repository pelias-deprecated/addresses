/**
 * @file An OSM record filter/normalizer.
 */

'use strict';

var through = require( 'through' );

/**
 * Filter out and normalize OSM records.
 *
 * Creates a `through` stream that expects a stream of OSM records. Filters out
 * records that aren't Points or don't have street names, and normalizes the
 * others into the following format:
 *
 *      {
 *          'house' : ...,
 *          'street' : ...,
 *          'city' : ...,
 *          'state' : ...,
 *          'zip' : ...
 *      }
 *
 * Only `street` is guaranteed to be non-null.
 */
module.exports = through( function write(record){
  if(record.geometry.type !== 'Point' ||
    record.properties[ 'addr:street' ] === null){
    return;
  }

  function emptyIfNull(string){
    return ( string === null ) ? '' : string;
  }

  this.push({
    'house' : emptyIfNull( record.properties[ 'addr:housename']  ) +
      emptyIfNull( record.properties[ 'addr:housenumber' ] ),
    'street' : record.properties[ 'addr:street' ],
    'city' : record.properties[ 'addr:city' ],
    'state' : record.properties[ 'addr:district' ],
    'zip' : record.properties[ 'addr:postcode' ]
  });
});
