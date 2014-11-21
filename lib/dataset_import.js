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

var addresses = requireDir( './addresses' );
var deduplicateStream = require( './deduplicate_stream' );

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

  unifiedAddressStream.pipe(createImportPipeline());
}

/**
 * Create a pipeline to pipe Address objects into. Adds the deduplicator,
 * suggester, and other necessary components.
 *
 * @return {Writable stream} The entry point of the pipeline.
 */
function createImportPipeline(){
  var count = 0;
  var intervalLogId = setInterval( function (){
    logger.info( 'Number of addresses imported: %d', count );
  }, 1000 * 10 );

  // temporary testing pipeline
  // console.log( '{"type":"FeatureCollection","features":[' );
  var addressesPipeline = through.obj(
    function write( obj, enc, next ){
      count++;
      process.stdout.write('\r' + count);
    }
  );
  addressesPipeline.on( 'end', function(){
    clearInterval( intervalLogId );
  });

  // var entryPoint = deduplicateStream();
  // entryPoint
    // .pipe( addressesPipeline );
  var entryPoint = addressesPipeline;
  return entryPoint;
}

module.exports = {
  importDatasets: importDatasets,
  createImportPipeline: createImportPipeline
};
