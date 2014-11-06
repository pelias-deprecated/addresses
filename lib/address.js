/**
 * @file Exports a normalized Address object constructor.
 *
 * Used by `lib/addresses/` modules.
 */

'use strict';

/**
 * Create a normalized address object.
 *
 * @param {string} house The name of the house/building.
 * @param {string} number The number of the house/building.
 * @param {string} street The street name.
 * @param {string} city The city name.
 * @param {string} state The region/district/state name.
 * @param {string} zip The zip-code.
 * @param {double} lat The latitude coordinate.
 * @param {double} lat The longitude coordinate.
 */
function Address( house, number, street, city, state, zip, lat, lon ){
  this.house = house;
  this.number = number;
  this.street = street;
  this.city = city;
  this.state = state;
  this.zip = zip;
  this.lat = lat;
  this.lon = lon;
}

Address.prototype.toString = function toString(){
  return JSON.stringify( this, undefined, 2 );
};

/**
 * @return {string} A CSV representation of this Address.
 */
Address.prototype.toCSV = function toCSV(){
  return [
    this.house, this.number, this.street, this.city, this.state, this.zip,
    this.coords
  ].join( ',' );
};

/**
 * @return {string} A GeoJSON Point representation of this Address.
 */
Address.prototype.toGeoJSON = function toGeoJSON(){
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      // points must be in `lon, lat` format
      coordinates: [this.lon, this.lat]
    },
    properties: {
      house: this.house,
      number: this.number,
      street: this.street,
      city: this.city,
      state: this.state,
      zip: this.zip
    }
  };
};

module.exports = Address;
