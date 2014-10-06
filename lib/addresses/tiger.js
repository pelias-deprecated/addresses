/**
 * @file Exports a filtered and normalized TIGER Address stream.
 */

'use strict';

var shapefileStream = require( 'shapefile-stream' );
var through = require( 'through' );
var interpolateLinePoints = require( 'line-interpolate-points' );
var Address = require( '../address' );

var filter = through( function write( obj ){
  function notNull( propName ){
    return obj.properties[ propName ] !== null;
  }

  if( ( notNull( 'LFROMADD' ) && notNull( 'LTOADD' ) ) ||
    ( notNull( 'RFROMADD' ) && notNull( 'RTOADD' ) ) &&
    notNull( 'fullname' ) && obj.geometry.type === 'LineString' ){
    this.push( obj );
  }
});

var normalizer = through( function write( obj ){
  var stream = this;

  function interpolateAddressRange( start, end, streetSide ){
    if( start === null || end === null ){
      return;
    }
    if( start > end ){
      var temp = start;
      start = end;
      end = temp;
    }

    var numAddresses = Math.ceil((end - start + 1) / 2);
    var offset = 0.00015; // a few meters
    var interpolatedPoints = interpolateLinePoints(
      obj.geometry.coordinates, numAddresses,
      ( ( streetSide === 'left' ) ? 1 : -1 ) * offset
    );
    for( var addr = 0; addr < numAddresses; addr++ ){
      var address = new Address(
        null,
        start + addr * 2,
        obj.properties.FULLNAME,
        null,
        null,
        obj.properties.ZIPL || obj.properties.ZIPR,
        interpolatedPoints[ addr ]
      );
      stream.push( address );
    }
  }

  interpolateAddressRange(
    parseInt(obj.properties.LFROMADD), parseInt(obj.properties.LTOADD),
    'left'
  );
  interpolateAddressRange(
    parseInt(obj.properties.RFROMADD), parseInt(obj.properties.RTOADD),
    'right'
  );
});

function addressStream( inputPath ){
  return shapefileStream.createReadStream( inputPath )
    .pipe( filter )
    .pipe( normalizer )
}

module.exports = addressStream;
