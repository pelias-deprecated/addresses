/**
 * @file Exports a stream that interfaces with the pipeline's address
 *    deduplicator.
 */

"use strict";

var request = require("request");
var through = require("through");

function createDeduplicateStream(requestBatchSize){
  var addresses = [];
  var requestBatchSize = requestBatchSize || 50;
  var streamEnded = false;
  var liveRequests = 0;

  return through(
    function write( address ){
      var downstream = this;

      addresses.push( address );
      if( addresses.length == requestBatchSize || streamEnded ){
        var batch = addresses;
        request.post(
          "http://localhost:5000/addresses/dedupe?batch=1",
          {
            json: {
              addresses: addresses
            }
          },
          function(err, httpResponse, body){
            liveRequests--;
            if(err){
              logger.error(err, httpResponse, body);
            }
            for(var ind = 0; ind < requestBatchSize; ind++){
              var addressResp = body.addresses[ ind ];
              if(!addressResp.dupe){
                batch[ ind ].guid = addressResp.guid;
                downstream.push( batch[ ind ] );
              }
            }

            if( liveRequests == 0 && streamEnded ){
              downstream.push( null );
            }
          }
        );
        liveRequests++;
        addresses = [];
      }
    },
    function end(){
      streamEnded = true;
    }
  );
};

module.exports = createDeduplicateStream;
