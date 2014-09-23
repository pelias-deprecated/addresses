/**
 * @file An OSM record filter/normalizer.
 */

'use strict';

var through = require( 'through' );

/**
 * Create a normalized address object.
 *
 * @param {string} house The unique identifier of the house/building.
 * @param {string} street The street name.
 * @param {string} city The city name.
 * @param {string} state The region/district/state name.
 * @param {string} zip The zip-code.
 */
function Address(house, street, city, state, zip){
  this.house = house;
  this.street = street;
  this.city = city;
  this.state = state;
  this.zip = zip;
}

/**
 * Filter out and normalize OSM records.
 *
 * Creates a `through` stream that expects a stream of OSM records. Filters out
 * records that aren't Points or don't have street names, and normalizes the
 * others into an Address object.
 */
module.exports = through( function write(record){
  if(record.geometry.type !== 'Point' ||
    record.properties[ 'addr:street' ] === null){
    return;
  }

  function emptyIfNull(string){
    return ( string === null ) ? '' : string;
  }

  this.push(new Address(
    emptyIfNull( record.properties[ 'addr:housename']  ) +
      emptyIfNull( record.properties[ 'addr:housenumber' ] ),
    record.properties[ 'addr:street' ],
    record.properties[ 'addr:city' ],
    record.properties[ 'addr:district' ],
    record.properties[ 'addr:postcode' ]
  ));
});
