'use strict';

var fs = require( 'fs' );
var JSONStream = require( 'JSONStream');
var through = require( 'through' );

/**
 * Creates a readable stream of OSM records.
 *
 * Currently ingests a GeoJson file, but will eventually read records from a
 * full-planet OSM PBF.
 */
function createOSMStream( path ) {
  var file = path;
  return fs.createReadStream( path, { encoding : 'utf8' })
    .pipe( JSONStream.parse( 'features.*' ) );
}

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
var addressNormalizer = through( function write(record){
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

createOSMStream( process.argv[ 2 ] )
  .pipe( addressNormalizer )
  .pipe( JSONStream.stringify() )
  .pipe( process.stdout );
