/**
 * @file Exports a stream that deduplicates addresses, discarding duplicates
 *    and pushing non-duplicates further downstream.
 */

"use strict";

var logger = require( 'winston' );
var request = require( 'request' );
var through = require( 'through2' );

/**
 * Return an address deduplication filter.
 *
 * @param {int} [requestBatchSize=50] The number of addresses to buffer into a
 *    batch before sending it to the duplicator. The higher the number, the
 *    less time and energy collectively spent in making requests, but the
 *    bigger the memory consumption buildup.
 * @param {int} [maxLiveRequests=100] Since the deduper is implemented as a
 *    standalone server and processes data more slowly than the importer feeds
 *    it, the stream needs to rate-limit itself. `maxLiveRequests` indicates
 *    the maximum number of unresolved concurrent requests at any time; when
 *    that number is hit, the stream will pause reading until the number of
 *    concurrent requests falls below it.
 * @return {transform Stream} Removes duplicate addresses from a stream of
 *    Address objects (the first such address, though, is let through).
 */
function createDeduplicateStream( requestBatchSize, maxLiveRequests ){
  var addresses = [];
  var requestBatchSize = requestBatchSize || 50;

  // Used to close this stream after the input stream dries up and the last
  // live `sendBatch()` request returns.
  var streamEnded = false;
  var liveRequests = 0;

  // Used to rate-limit the requests the stream sends to the deduper.
  var streamPaused = false;
  var maxLiveRequests = maxLiveRequests || 100;

  /**
   * @param {array of Address} batch The batch to send to the deduplicator,
   *    which indicates which objects are duplicates.
   * @param {transform Stream} downstream The pipeline to push non-duplicates
   *    into.
   */
  function sendBatch( batch, downstream ){
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

      if( liveRequests < maxLiveRequests && streamPaused ){
        streamPaused = false;
        downstream.emit( 'resumeStream' );
      }
    };
    request.post( endpoint, postData, responseCallback );
    liveRequests++;

    if( liveRequests >= maxLiveRequests ){
      streamPaused = true;
    }
  }

  /**
   * Store up to `requestBatchSize` incoming addresses in the `addresses`
   * array, then send them to the de-duplicator via `sendBatch()`.
   *
   * @param {Address} address An address coming down the pipeline.
   */
  function bufferBatch( address, enc, next ){
    addresses.push( address );
    if( addresses.length == requestBatchSize || streamEnded ){
      console.error( liveRequests );
      sendBatch( addresses, this );
      addresses = [];
    }

    if( streamPaused ){
      this.once( 'resumeStream', function (  ){
        next();
      });
    }
    else {
      next();
    }
  }

  /**
   * Indicates that the last `Address` object has passed through the pipeline,
   * so that `bufferBatch()` can close it after the last `sendBatch()` request
   * has returned.
   */
  function signalStreamEnd(  ){
    streamEnded = true;
  }

  return through.obj(bufferBatch, signalStreamEnd);
};

module.exports = createDeduplicateStream;
