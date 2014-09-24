/**
 * @file Exports filters for filtering/normalizing an OSM record stream.
 */

'use strict';

var through = require( 'through' );
var proj4 = require( 'proj4' );

/**
 * Create a normalized address object.
 *
 * @param {string} house The unique identifier of the house/building.
 * @param {string} street The street name.
 * @param {string} city The city name.
 * @param {string} state The region/district/state name.
 * @param {string} zip The zip-code.
 * @param {array of double} coords The [ lon, lat ].
 */
function Address( house, street, city, state, zip, coords ){
  this.house = house;
  this.street = street;
  this.city = city;
  this.state = state;
  this.zip = zip;
  this.coords = coords;
}

/**
 * Filter OSM records.
 *
 * Creates a `through` stream that expects a stream of OSM records. Filters out
 * anything that's not a Point or doesn't have a a street name.
 */
var filter = through( function write( record ){
  if(record.geometry.type === 'Point' &&
    record.properties[ 'addr:street' ] !== null){
    this.push( record );
  }
});

/**
 * Normalize OSM records.
 *
 * Creates a `through` stream that expects a stream of OSM records. Normalizes
 * the others into an Address object.
 */
var normalizer = through( function write( record ){
  function emptyIfNull( string ){
    return ( string === null ) ? '' : string;
  }

  /**
   * Reprojects OSM to WGS84.
   *
   * @param coordinates {array of 2 doubles} A coordinate pair.
   * @return {array of 2 doubles} `coordinates`, but reprojected from OSM's
   *      EPSG:3857 (Web Mercator)to EPSG:4326 (WGS84).
   */
  function reproject( coordinates ){
    return proj4(
      '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs', // WGS84 Web Mercator
      '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs', // WGS84
      coordinates
    );
  }

  this.push( new Address(
    emptyIfNull( record.properties[ 'addr:housename']  ) +
      emptyIfNull( record.properties[ 'addr:housenumber' ] ),
    record.properties[ 'addr:street' ],
    record.properties[ 'addr:city' ],
    record.properties[ 'addr:district' ],
    record.properties[ 'addr:postcode' ],
    reproject( record.geometry.coordinates )
  ));
});

module.exports = {
  'filter' : filter,
  'normalizer' : normalizer
};
