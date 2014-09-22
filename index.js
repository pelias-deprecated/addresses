'use strict';

var fs = require( 'fs' );
var JSONStream = require( 'JSONStream');
var through = require( 'through' );

function createOSMStream( path ) {
  var file = path;
  return fs.createReadStream( path )
    .pipe( JSONStream.parse( 'features.*' ) );
}

var normalizer = through( function write(record){
  if(record[ 'geometry' ][ 'type' ] === 'Point' ||
    record[ 'properties' ][ 'addr:street' ] === null){
    return;
  }

  function emptyIfNull(string){
    return ( string === null ) ? '' : string;
  }

  this.push({
    "house" : emptyIfNull( record[ 'properties' ][ 'addr:housename' ] ) +
      emptyIfNull( record[ 'properties' ][ 'addr:housenumber' ] ),
    "street" : record[ 'properties' ][ 'addr:street' ],
    "city" : record[ 'properties' ][ 'addr:city' ],
    "state" : record[ 'properties' ][ 'addr:district' ],
    "zip" : record[ 'properties' ][ 'addr:postcode' ]
  });
});

createOSMStream( 'tmp.json' )
  .pipe( normalizer )
  .pipe( JSONStream.stringify() )
  .pipe( process.stdout );
