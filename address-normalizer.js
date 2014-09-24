/**
 * @file Exports filters for filtering/normalizing an OSM record stream.
 */

'use strict';

var through = require( 'through' );
var proj4 = require( 'proj4' );

/**
 * Create a normalized address object.
 *
 * @param {string} house The name of the house/building.
 * @param {string} number The number of the house/building.
 * @param {string} street The street name.
 * @param {string} city The city name.
 * @param {string} state The region/district/state name.
 * @param {string} zip The zip-code.
 * @param {array of double} coords The [lat, lon].
 */
function Address( house, number, street, city, state, zip, coords ){
  this.house = house;
  this.number = number;
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

module.exports = {
  'filter' : filter,
  'normalizer' : normalizer
};
