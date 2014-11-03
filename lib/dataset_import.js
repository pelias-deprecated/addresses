/**
 * @file Functions that import raw address datasets, and hook them into the
 *      addresses pipeline.
 */

'use strict';

var CombinedStream = require( 'combined-stream' );
var fs = require( 'fs' );
var path = require( 'path' );
var logger = require( 'winston' );
var requireDir = require( 'require-dir' );
var shapefileStream = require( 'shapefile-stream' );
var through = require( 'through2' );

var Backend = require('geopipes-elasticsearch-backend');
var esclient = require('pelias-esclient')({ throttle: 10, maxThrottle: 50 });
var elasticsearch = new Backend( esclient, 'pelias', 'addresses' );
var propStream = require('prop-stream');
var schema = require( 'pelias-schema' );
var suggester = require('pelias-suggester-pipeline');

var addresses = requireDir( './addresses' );

/**
 * Execute an action on all files in a directory whose paths match a regular
 * expression.
 *
 * @param {string} dirPath The path of the directory to search.
 * @param {string} filenameRegex The regular expression to match file names
 *      inside `dirPath` against.
 * @param {function} action A function taking a single argument, a string
 *      filepath, that'll be called once for every matching path.
 */
function createFileAddressStreams( dirPath, filenameRegex, action ){
  var files = fs.readdirSync( dirPath );
  for( var file = 0; file < files.length; file++ ){
    var filePath = path.join( dirPath, files[ file ] );
    if( ( fs.lstatSync( filePath ).isFile() &&
      filenameRegex.test( filePath ) ) ){
      action( filePath );
    }
  }
}

/**
 * Create raw data streams for different datasets' files.
 *
 * @param {object} datasets See `importDatasets()->datasets`.
 */
function createAddressStreams( datasets ){
  var addressStreams = {};

  if( datasets.hasOwnProperty( 'osm' ) ){
    addressStreams.osm = CombinedStream.create();
    createFileAddressStreams(
      datasets.osm,
      /\.osm\.pbf$/,
      function ( filename ){
        var fileStream = fs.createReadStream( filename );
        fileStream.on( 'end', function (){
          logger.info( 'Finished loading: ' + filename );
        });
        addressStreams.osm.append( fileStream );
      }
    );
  }

  if( datasets.hasOwnProperty( 'tiger' ) ){
    addressStreams.tiger = CombinedStream.create();
    createFileAddressStreams(
      datasets.tiger,
      /\.shp$/,
      function ( filename ){
        addressStreams.tiger.append( function ( next ){
          var fileStream = shapefileStream.createReadStream(
            filename
          );
          fileStream.on( 'end', function (){
            logger.info( 'Finished loading: ' + filename );
          });
          next( fileStream );
        });
      }
    );
  }

  if( datasets.hasOwnProperty( 'openaddresses' ) ){
    addressStreams.openaddresses = CombinedStream.create();
    createFileAddressStreams(
      datasets.openaddresses,
      /\.csv$/,
      function ( filename ){
        var fileStream = fs.createReadStream(
          filename,
          {start: 25} // skip the first line
        );
        fileStream.on( 'end', function (){
          logger.info( 'Finished loading: ' + filename );
        });
        addressStreams.openaddresses.append( fileStream );
      }
    );
  }

  return addressStreams;
}

/**
 * Import datasets into the addresses pipeline.
 *
 * @param {object} datasets An object mapping the name of each dataset to
 *      import to the directory containins its files. See the `--source`
 *      command-line argument in `node index.js --help`.
 */
function importDatasets( datasets ){
  var addressStreams = createAddressStreams( datasets );
  var unifiedAddressStream = CombinedStream.create();
  var datasetOrder = ['openaddresses', 'osm', 'tiger'];
  for( var ind = 0; ind < datasetOrder.length; ind++ ){
    var dataset = datasetOrder[ ind ];
    if( addressStreams.hasOwnProperty( dataset ) ){
      var addressStream = addresses[ dataset ].addressStream(
        addressStreams[ dataset ]
      );
      addressStream.on(
        'end',
        logger.info.bind( null, 'Finished importing: ' + dataset )
      );
      unifiedAddressStream.append( addressStream );
    }
  }

  var count = 0;
  var intervalLogId = setInterval( function (){
    logger.info( 'Number of addresses imported: %d', count );
  }, 1000 * 10 );

  var allowedProperties = Object.keys( schema.mappings.geoname )
    .concat( [ 'id', 'type' ] );

  esclient.livestats();
  unifiedAddressStream
    .pipe( through.obj( mapper ) )
    // .pipe( suggester.pipeline )
    .pipe( propStream.whitelist( allowedProperties ) )
    .pipe( elasticsearch.createPullStream() );
}

var addressId = 0;
function mapper( address, enc, next ){
  var record = {
    id: ++addressId,
    _meta: {
        type: 'geoname'
    },
    name: {
      default: [
        address.house || '', address.number, address.street
      ].join( ' ' )
    },
    admin0: 'US',
    admin1: 'New York',
    admin2: 'New York',
    alpha3: 'USA',
    center_point: {
      lat: address.coords[ 0 ],
      lon: address.coords[ 1 ]
    }
  };
  this.push( record );
  next();
}

module.exports = importDatasets;
