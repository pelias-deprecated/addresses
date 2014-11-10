/**
 * @file Exports a stream that interfaces with the pipeline's address
 *    deduplicator.
 */

"use strict";

var logger = require( 'winston' );
var request = require( 'request' );
var through = require( 'through' );

function createDeduplicateStream(requestBatchSize){
  var addresses = [];
  var requestBatchSize = requestBatchSize || 50;
  var streamEnded = false;
  var liveRequests = 0;

  function sendBatch( downstream, batch ){
    var endpoint = "http://localhost:5000/addresses/dedupe?batch=1";
    var postData = {
      json: {
        addresses: batch
      }
    };
    function responseCallback( err, httpResponse, body ){
      liveRequests--;
      if(err){
        logger.error(err, httpResponse, body);
      }
      for(var ind = 0; ind < body.addresses.length; ind++){
        var addressResp = body.addresses[ ind ];
        if(!addressResp.dupe){
          batch[ ind ].guid = addressResp.guid;
          downstream.push( batch[ ind ] );
        }
      }

      if( liveRequests == 0 && streamEnded ){
        downstream.push( null );
      }
    };
    request.post( endpoint, postData, responseCallback );
    liveRequests++;
  }

  function bufferBatch( address ){
    addresses.push( address );
    if( addresses.length == requestBatchSize || streamEnded ){
      sendBatch( this,  addresses );
      addresses = [];
    }
  }

  function signalStreamEnd(  ){
    streamEnded = true;
  }

  return through(bufferBatch, signalStreamEnd);
};

module.exports = createDeduplicateStream;
