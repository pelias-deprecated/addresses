# deprecated
As per the discussion in [this issue](https://github.com/pelias/addresses/issues/3), this repo has been partitioned
into:

  * [address-deduplicator-stream](https://github.com/pelias/address-deduplicator-stream)
  * [tiger](https://github.com/pelias/tiger)
  * [openaddresses](https://github.com/pelias/openaddresses)

# mapzen addresses pipeline

A pipeline for collating, normalizing, de-duplicating, and interpolating address data from a number of different
sources, like TIGER and OpenStreetMap.

## Install Dependencies

```bash
$ npm install
```

## Contributing

Please fork and pull request against upstream master on a feature branch. Pretty please: provide unit tests and script
fixtures in the `test` directory.

### Running Unit Tests

```bash
$ npm test
```

### Continuous Integration

Travis tests every release against node version `0.10`

[![Build Status](https://travis-ci.org/pelias/addresses.png?branch=master)](https://travis-ci.org/pelias/addresses)
