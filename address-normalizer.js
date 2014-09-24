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
 * @param {array of double} coords The [lat, lon].
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
 * Creates a `through` stream that expects a stream of OSM buffered records.
 * Filters out anything that's not a node or doesn't have the 'addr:street' tag
 * (a street name).
 */
var filter = through( function write( buffer ){
  for(var obj = 0; obj < buffer.length; obj++){
    if(buffer[ obj ].type === 'node' &&
      buffer[ obj ].tags.hasOwnProperty( 'addr:street' )){
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

  /**
   * @return {string or null} The unique name of this `node`'s building, as
   *      compounded from its `addr:housename` and `addr:housenumber`. `null`
   *      if neither key exists in the node's tags.
   */
  function getHouseID(){
    var name = node.tags.hasOwnProperty( 'addr:housename' ) ?
      node.tags[ 'addr:housename' ] : null;
    var number = node.tags.hasOwnProperty( 'addr:housenumber' ) ?
      node.tags[ 'addr:housenumber' ] : null;

    if( name ){
      return ( number ) ? name + ' ' + number : name;
    }
    else if( number )
      return number;
    else
      return null;
  }

  this.push( new Address(
    getHouseID(),
    getTag( 'addr:street' ),
    getTag( 'addr:city' ),
    getTag( 'addr:district' ),
    getTag( 'addr:postcode' ),
    [ node.lat, node.lon ]
  ));
});

module.exports = {
  'filter' : filter,
  'normalizer' : normalizer
};
