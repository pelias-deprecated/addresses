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

var propStream = require( 'prop-stream' );
var peliasSchema = require(  'pelias-schema'  );
var peliasSuggester = require( 'pelias-suggester-pipeline' );
var schemaMapper = require( 'schema-mapper' );
var peliasDbclient = require( 'pelias-dbclient' )();

var addresses = requireDir( './addresses' );
var deduplicateStream = require( './deduplicate_stream' );
var intervalLogger = require("./interval_logger");

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

  unifiedAddressStream.on( 'end', function (  ){
    intervalLogger.stopIntervalLogging();
  });
  unifiedAddressStream.pipe(createImportPipeline());
}

/**
 * Create a pipeline to pipe Address objects into. Adds the deduplicator,
 * suggester, and other necessary components.
 *
 * @return {Writable stream} The entry point of the pipeline.
 */
function createImportPipeline(){
  var numAddresses = 0;
  var peliasSuggesterMapper = through.obj(function write(address, enc, next){
    numAddresses++;
    var record = {
      id: address.guid,
      // id: numAddresses++,
      _meta: {
        type: "geoname"
      },
      name: {
        default: [
          address.house_name || "", address.house_number, address.street
        ].join(" ").trim()
      },
      admin0: address.country,
      admin1: address.region,
      admin2: address.locality,
      alpha3: "GBR",
      center_point: {
        lat: address.latitude,
        lon: address.longitude
      }
    };
    this.push(record);
    next();
  });

  var peliasDbclientMapper = through.obj(function write(item, enc, next){
    var id = item.id;
    delete item.id;

    this.push({
      _index: "pelias",
      _type: "geoname",
      _id: id,
      data: item
    });

    next();
  });

  intervalLogger.startIntervalLogging( function logIntervalNumImported(){
    logger.info( 'Number of addresses imported: %d', numAddresses );
  }, 1e4  )

  var geonameProps = Object.keys(peliasSchema.mappings.geoname.properties);
  var allowedProperties = geonameProps.concat( [ 'id', 'type' ] );

  var entryPoint = deduplicateStream();
  entryPoint
    .pipe( peliasSuggesterMapper )
    .pipe( peliasSuggester.pipeline )
    .pipe( propStream.whitelist( allowedProperties ) )
    .pipe( peliasDbclientMapper )
    .pipe( peliasDbclient );
  return entryPoint;
}

module.exports = {
  importDatasets: importDatasets,
  createImportPipeline: createImportPipeline
};
