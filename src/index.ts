import { DateTime } from "luxon";

class SnapParseError extends Error {}

class SnapUnitError extends Error {}

class SnapTransformError extends Error {}

// Defines the acceptable units and unit aliases
const UNIT_LISTS: Record<string, string[]> = {
  seconds: ["s", "sec", "secs", "second", "seconds"],
  minutes: ["m", "min", "minute", "minutes"],
  hours: ["h", "hr", "hrs", "hour", "hours"],
  days: ["d", "day", "days"],
  weeks: ["w", "week", "weeks"],
  months: ["mon", "month", "months"],
  years: ["y", "yr", "yrs", "year", "years"],
};

// Given a string, return the unit included, if any.
// Returns the unit key, not the alias used. E.g. if the user passes -1d@d, the unit will be "days", not d
function getUnit(string: string): string {
  const unitKeys = Object.keys(UNIT_LISTS);

  for (const unitKey of unitKeys) {
    const variants = UNIT_LISTS[unitKey];
    if (variants.indexOf(string) !== -1) {
      return unitKey;
    }
  }
  throw new SnapUnitError(`Unknown unit string '${string}'`);
}

// Convert a string to a number, defaulting to 1 if there is none.
// The default of 1 is chosen because @w needs to default to monday
// as monday is the first day of the week in the ISO 8601 standard.
function getNum(string: string, defaultVal: number | null = 1): number {
  if ((!string || string === "") && defaultVal !== null) {
    return defaultVal;
  }
  return parseInt(string, 10);
}

// Given a weekday unit string, return the weekday index it represents, 0-6
function getWeekday(string: string): number | null {
  if (typeof string == "string" && string.length === 0) {
    return null;
  }
  const result = getNum(string, null);
  if (result !== null && !(result >= 0 && result <= 7)) {
    throw new SnapParseError(`Bad weekday '${result}'`);
  }
  return result + 1; // Luxon uses 1-7 for weekdays, but this library needs to support 0-6.
}

// Given a string representing the sign of a signed int, return the direction of the sign.
function getMult(string: string): number {
  return string === "-" ? -1 : 1;
}

// patterns for matching the delta e.g. +1d, -2h
const D_GENERAL = "[-+]?\\d+[a-zA-Z]+";
const D_PATTERN = new RegExp("([-+]?)(\\d+)([a-zA-Z]+)");

// patterns for matching the snap e.g. @d, @h
const S_GENERAL = "@[a-zA-Z]+\\d*";
const S_PATTERN = new RegExp("@([a-zA-Z]+)(\\d*)");

const HEAD_PATTERN = new RegExp(`^(${S_GENERAL}|${D_GENERAL})(.*)`);

/**
 * Class representing a Snap Transormation
 * A snap consists of a unit and an optional weekday number if the unit is a weekday
 */
class SnapTransformation {
  unit: string;
  weekday: number | null = null;

  constructor(group: string) {
    const match = S_PATTERN.exec(group);
    if (!match) throw new Error("No match");

    // Using positional indices instead of named groups
    this.unit = getUnit(match[1]);
    if (this.unit !== "weeks" && match[2] !== "") {
      throw new SnapParseError(
        `Cannot parse instruction '${group}'. There is an error at '${match[2]}'`
      );
    }
    this.weekday = getWeekday(match[2]);

    console.log("unit", this.unit, "weekday", this.weekday);
  }

  // Given a Date, modify it with the snapping logic
  applyTo(dttm: DateTime): DateTime {
    let result = dttm;

    if (this.unit === "weeks" && this.weekday !== null) {
      result = result.set({ weekday: this.weekday });
    } else {
      switch (this.unit) {
        case "seconds":
          result = result.startOf("second");
          break;
        case "minutes":
          result = result.startOf("minute");
          break;
        case "hours":
          result = result.startOf("hour");
          break;
        case "days":
        case "weeks":
          result = result.startOf("day");
          break;
        case "months":
          result = result.startOf("month");
          break;
        case "years":
          result = result.startOf("year");
          break;
      }
    }

    return result;
  }
}

/**
 * Class representing a Delta Transormation
 * A delta consists of a signed integer and a unit
 */
class DeltaTransformation {
  mult: number | null = null; // the sign
  num: number | null = null;
  unit: string | null = null;

  constructor(group: string) {
    const match = D_PATTERN.exec(group);
    if (!match) return; // if there's no match, the properties will remain null

    // Using positional indices instead of named groups
    this.mult = getMult(match[1]);
    this.num = getNum(match[2]);
    this.unit = getUnit(match[3]);
  }

  // Given a Date, modify it with the delta logic
  applyTo(dttm: DateTime): DateTime {
    if (this.unit === null || this.mult === null || this.num === null) {
      throw new SnapTransformError("No transformation to apply");
    }

    let result = dttm;

    switch (this.unit) {
      case "seconds":
        result = result.plus({ seconds: this.mult * this.num });
        break;
      case "minutes":
        result = result.plus({ minutes: this.mult * this.num });
        break;
      case "hours":
        result = result.plus({ hours: this.mult * this.num });
        break;
      case "days":
        result = result.plus({ days: this.mult * this.num });
        break;
      case "weeks":
        result = result.plus({ weeks: this.mult * this.num });
        break;
      case "months":
        result = result.plus({ months: this.mult * this.num });
        break;
      case "years":
        result = result.plus({ years: this.mult * this.num });
        break;
    }

    return result;
  }
}

/**
 * Parses a string instruction and returns the necessary transformations
 */
function parse(
  instruction: string
): (SnapTransformation | DeltaTransformation)[] {
  let instr = instruction;
  const result: (SnapTransformation | DeltaTransformation)[] = [];

  while (instr) {
    const match = HEAD_PATTERN.exec(instr); // get the first parseable chunk of the instruction
    if (!match) {
      throw new SnapParseError(
        `Cannot parse instruction '${instruction}'. There is an error at '${instr}'`
      );
    }
    const group = match[1];

    if (S_PATTERN.test(group)) {
      // if it is a snap, use a snap transformation
      const transformation = new SnapTransformation(group);
      result.push(transformation);
    } else {
      // else it must be a delta, use a delta transformation
      const transformation = new DeltaTransformation(group);
      result.push(transformation);
    }

    instr = match[2]; // loop over the rest of the string
  }

  return result;
}

/**
 * Performs an instruction on an ISO 8601 string and returns an ISO 8601 string
 * Example usage:
 * const result = snap(new Date().toISOString(), "@mon");
 */
export default function snap(dttm: string, instruction: string): string | null {
  const dateObj = DateTime.fromISO(dttm);

  // if the dateObj is not valid, then the string supplied was not parseable by luxon
  if (!dateObj.isValid) {
    throw new SnapParseError(
      "Invalid date supplied, unable to parse. Please use ISO 8601 format"
    );
  }

  if (!instruction) {
    return dttm;
  }

  const transformations = parse(instruction);
  const result = transformations.reduce(
    (dt, transformation) => transformation.applyTo(dt),
    dateObj
  );

  if (!result.isValid) {
    throw new SnapTransformError("Unable to apply transformations");
  }

  return result.toISO();
}
