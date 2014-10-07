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

Address.prototype.toString = function (){
  return JSON.stringify( this, undefined, 2 );
};

/**
 * @return {string} A compact, machine readable string representation of an
 *      Address.
 */
Address.prototype.serialize = function (){
  return [
    this.house, this.number, this.street, this.city, this.state, this.zip,
    this.coords
  ].join( ',' );
};

module.exports = Address;
