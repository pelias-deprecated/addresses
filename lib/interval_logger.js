/**
 * @file Exports functions to facilitate logging at intervals, and then
 *    stopping those logs simultaneously. Useful because it's desirable to
 *    write data to the log at regular intervals, and having to remember to
 *    call `clearInterval()` on your `setInterval()` in all the right places is
 *    tedious.
 */

"use strict";

// Stores the IDs of all `setInterval()` calls created by `startIntervalLog`.
var intervalIds = [];

/**
 * Start calling a function at an interval, and store its id in `intervalIds`.
 */
function startIntervalLogging( logFunc, interval ){
  intervalIds.push( setInterval( logFunc, interval ) );
}

/**
 * Stop all intervals activated by `startIntervalLog()` by purging
 * `intervalIds`.
 */
function stopIntervalLogging(){
  intervalIds.forEach( clearInterval );
}

module.exports = {
  startIntervalLogging: startIntervalLogging,
  stopIntervalLogging: stopIntervalLogging
}
