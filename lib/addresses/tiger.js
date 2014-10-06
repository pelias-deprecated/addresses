/**
 * @file Exports a filtered and normalized TIGER Address stream.
 */

'use strict';

var shapefileStream = require( 'shapefile-stream' );
var through = require( 'through' );
var interpolateLinePoints = require( 'line-interpolate-points' );
var Address = require( '../address' );

/**
 * Filter TIGER records.
 *
 * Discards anything that doesn't have a left or right address range, street
 * name, or is not a LineString.
 */
var filter = through( function write( obj ){
  function notNull( propName ){
    return obj.properties[ propName ] !== null;
  }

  if( ( notNull( 'LFROMADD' ) && notNull( 'LTOADD' ) ) ||
    ( notNull( 'RFROMADD' ) && notNull( 'RTOADD' ) ) &&
    notNull( 'FULLNAME' ) && obj.geometry.type === 'LineString' ){
    this.push( obj );
  }
});

/**
 * Interpolate and normalize TIGER records.
 *
 * Interpolates the addresses encoded in a TIGER line and offsets them from
 * that centerline depending on their 'left'/'right' designation, and then
 * normalizes them into an Address object.
 */
var normalizer = through( function write( obj ){
  var stream = this;

  /**
   * Interpolates addresses along one address range of the current TIGER
   * line. The address coordinates are offset a small distance (direction
   * depending on `streetSide`), and the line's attributes are normalized
   * into an Address object. Each one is pushed downstream.
   *
   * @param {number} start The starting address number.
   * @param {number} start The ending address number.
   * @param {string} streetSide Either 'left' or 'right'; the actual
   *      geographic location that the points lie on with respect to the
   *      street is dependent on the orientation of the line string
   *      (left/right are evaluated as if one were walking along the line,
   *      from start to end).
   */
  function interpolateAddressRange( start, end, streetSide ){
    if( start === null || end === null ){
      return;
    }
    if( start > end ){
      var temp = start;
      start = end;
      end = temp;
    }

    var numAddresses = Math.ceil( ( end - start + 1 ) / 2 );
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
    parseInt( obj.properties.LFROMADD ), parseInt( obj.properties.LTOADD ),
    'left'
  );
  interpolateAddressRange(
    parseInt( obj.properties.RFROMADD ), parseInt( obj.properties.RTOADD ),
    'right'
  );
});

/**
 * A stream for filtering an normalizing a TIGER record stream.
 *
 * @param {string} inputPath The path of the input TIGER shapefile.
 * @param {readable stream} Filtered and interpolated TIGER records, normalized
 *      into Address objects.
 */
function addressStream( inputPath ){
  return shapefileStream.createReadStream( inputPath )
    .pipe( filter )
    .pipe( normalizer )
}

module.exports = {
  filter: filter,
  normalizer: normalizer,
  addressStream: addressStream
};
