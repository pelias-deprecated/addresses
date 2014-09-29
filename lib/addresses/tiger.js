/**
 * @file Exports a filtered and normalized TIGER Address stream.
 */

'use strict';

var shapefileStream = require( 'shapefile-stream' );
var through = require( 'through' );

var count = 0; // tmp

var filter = through( function write( obj ){
  function notNull( propName ){
    return obj.properties[ propName ] !== null;
  }

  if( notNull( 'LFROMADD' ) && notNull( 'LTOADD' ) &&
    notNull( 'RFROMADD' ) && notNull( 'RTOADD' ) &&
    obj.geometry.type === 'LineString' ){
    this.push( obj );
  }
});

var normalizer = through( function write( obj ){
  this.push({
    'fullname': obj.properties.FULLNAME,
    'lfromadd': obj.properties.LFROMADD,
    'ltoadd': obj.properties.LTOADD,
    'rfromadd': obj.properties.RFROMADD,
    'rtoadd': obj.properties.RTOADD,
    'coords': obj.geometry.coordinates
  });
});

function addressStream( inputPath ){
  return shapefileStream.createReadStream( inputPath )
    .pipe( filter )
    .pipe( normalizer );
}

module.exports = addressStream;
