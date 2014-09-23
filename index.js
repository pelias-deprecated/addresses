'use strict';

var fs = require( 'fs' );
var JSONStream = require( 'JSONStream');
var through = require( 'through' );

var addressNormalizer = require( './address-normalizer' );


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

createOSMStream( process.argv[ 2 ] )
  .pipe( addressNormalizer )
  .pipe( JSONStream.stringify() )
  .pipe( process.stdout );
