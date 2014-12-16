/**
 * @file An aggregate pipeline for importing Address objects into Pelias.
 * Bundles together all of the moving parts: optional address deduplication,
 * suggester payload addition, remapping to the dbclient schema, etc.
 */

"use strict";

/**
 * Create a pipeline to pipe Address objects into. Adds the deduplicator,
 * suggester, and other necessary components.
 *
 * @param {object} options An object containing the following keys:
 *    name {string}: The name to assign to the dataset.
 *    [deduplicate=false] {bool}: Whether or not to deduplicate addresses.
 *      Requires that the address-deduplicator server be up and running.
 *
 * @return {Writable stream} The entry point of the pipeline.
 */
function createImportPipeline(options){
  var numAddresses = 0;
  var peliasSuggesterMapper = through.obj(function write(address, enc, next){
    numAddresses++;
    var addressName = [
      address.house_name || "", address.house_number, address.street
    ].join(" ").trim();
    var addressDocument = new peliasModel.Document( 'geoname', address.guid );
    addressDocument.setName( 'default', addressName );

    if( address.locality !== null ){
      addressDocument.setAdmin( 'locality', address.locality )
    }

    if( address.region !== null ){
      addressDocument.setAdmin( 'admin1', address.region )
    }

    if( address.country !== null ){
      addressDocument.setAdmin( 'admin0', address.country )
    }

    addressDocument.setCentroid({
      lat: address.latitude,
      lon: address.longitude
    });

    this.push( addressDocument );
    next();
  });

  var peliasDbclientMapper = through.obj(function write(item, enc, next){
    var id = item.id;
    delete item.id;

    this.push({
      _index: 'pelias',
      _type: 'geoname',
      _id: id,
      data: item
    });

    next();
  });

  intervalLogger.startIntervalLogging( function logIntervalNumImported(){
    logger.info( 'Number of addresses imported: %d', numAddresses );
  }, 1e4  )

  var geonameProps = Object.keys( peliasSchema.mappings.geoname.properties );
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
