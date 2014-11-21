#! /usr/bin/env node

/**
 * Wraps the `schema-mapper` tool, piping the data it generates directly into
 * the Pelias address-import pipeline.
 */

var schemaMapperTool = require("../node_modules/schema-mapper/bin/cli_tool");
var datasetImport = require("../lib/dataset_import");

var args = process.argv.slice(2);
schemaMapperTool(args, datasetImport.createImportPipeline());
