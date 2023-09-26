# Snaptime

A powerful and precise datetime snapper and transformer written in Typescript, converted from the Python [zartstrom/snaptime](https://github.com/zartstrom/snaptime) library and extended.

## Introduction

Snaptime allows for the manipulation and transformation of date and time values with precision. Whether you want to truncate, snap to the closest value, or transform based on custom rules, Snaptime has got you covered.

## Features

- Snap to the closest date or time value.
- Truncate date or time values.
- Transform dates based on custom rules.
- Works with ISO string formats.
- Compare two dates and receive a modifier string that can be used to transform one into the other (essentially a snaptime-syntax string representation of a diff).

## Installation

### npm

```bash
npm i -S snaptime
```

### pnpm

```bash
pnpm i -S snaptime
```

### yarn

```bash
yarn add snaptime
```

## Usage

```javascript
import snap, { unsnap } from "snaptime";

const result = snap("1980-01-15T00:00:00.000Z", "-1mon@m-1mon");
console.log(result); // "1979-11-01T00:00:00.000Z"

const instruction = unsnap(
  "2023-09-24T00:00:00-05:00",
  "2023-09-25T23:59:59-05:00"
);
console.log(instruction); // "-1d@d"
```

Supported snap and delta units can be found on the [zartstrom/snaptime](https://github.com/zartstrom/snaptime) documentation.

## Credits

This library is a JavaScript port and extension of the Python [zartstrom/snaptime](https://github.com/zartstrom/snaptime) library. Kudos to them for the original idea and implementation.

## License

[MIT](LICENSE)
