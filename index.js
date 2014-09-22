
var through = require('through2'),
    interpolator = require('./interpolator');

/**
   example range looks like this:

   {
      from: 1,
      to: 50
   }

   ..and the stream retuns one or more

   {
      housenumber: 22
   }

**/

function streamFactory(){

  /** example stream **/

  var stream = through.obj( function( item, enc, next ){

    // range
    if( item.from && item.to ){
      
      var numbers = interpolator( item.from, item.to );
      
      numbers.forEach( function( num ){

        this.push({ housenumber: num });
      
      }, this);
    
    }

    next();

  });

  return stream;

}

module.exports = streamFactory;