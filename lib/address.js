/**
 * @file Exports a normalized Address object constructor.
 *
 * Used by `lib/addresses/` modules.
 */

'use strict';

/**
 * Create a normalized address object.
 *
 * @param {string} house_name The name of the house/building.
 * @param {string} house_number The number of the house/building.
 * @param {string} street The street name.
 * @param {string} locality The city name.
 * @param {string} region The region/district/state name.
 * @param {string} postal_code The zip, or postal, code.
 * @param {string} country The country.
 * @param {double} latitude The latitude coordinate.
 * @param {double} longitude The longitude coordinate.
 */

function Address(
  house_name, house_number, street, locality, region, postal_code, country,
  latitude, longitude
){
  this.house_name = house_name;
  this.house_number = house_number;
  this.street = street;
  this.locality = locality;
  this.region = region;
  this.postal_code = postal_code;
  this.country = country;
  this.latitude = latitude;
  this.longitude = longitude;
}

Address.prototype.toString = function toString(){
  return JSON.stringify( this, undefined, 2 );
};

/**
 * @return {string} A CSV representation of this Address.
 */
Address.prototype.toCSV = function toCSV(){
  return [
    this.house_name, this.house_number, this.street, this.locality,
    this.region, this.postal_code, this.country, this.latitude, this.longitude
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
      coordinates: [this.longitude, this.latitude]
    },
    properties: {
      house: this.house_name,
      number: this.house_number,
      street: this.street,
      city: this.locality,
      state: this.region,
      country: this.country,
      zip: this.postal_code
    }
  };
};

module.exports = Address;
