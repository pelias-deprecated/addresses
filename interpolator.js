
/** example interpolator **/

function interpolator( from, to ){

  var housenumbers = [];

  for( var x=from; x<=to; x++ ){
    housenumbers.push( x );
  }

  return housenumbers;

}

module.exports = interpolator;