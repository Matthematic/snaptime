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
  return result;
}

// Given a string representing the sign of a signed int, return the direction of the sign.
function getMult(string: string): number {
  return string === "-" ? -1 : 1;
}

// Performs the actual snapping logic for each unit key
function truncate(dateTime: Date, unit: string): Date {
  switch (unit) {
    case "seconds":
      dateTime.setMilliseconds(0);
      break;
    case "minutes":
      dateTime.setSeconds(0, 0);
      break;
    case "hours":
      dateTime.setMinutes(0, 0, 0);
      break;
    case "days":
      dateTime.setHours(0, 0, 0, 0);
      break;
    case "months":
      dateTime.setHours(0, 0, 0, 0);
      dateTime.setDate(1);
      break;
    case "years":
      dateTime.setMonth(0, 1);
      dateTime.setHours(0, 0, 0, 0);
      break;
  }
  return dateTime;
}

// patterns for matching the delta e.g. +1d, -2h
const D_GENERAL = "[-+]?\\d+[a-zA-Z]+";
const D_DETAILS = "(?<sign>[-+]?)(?<num>\\d+)(?<unit_string>[a-zA-Z]+)"; // D_GENERAL but with named capture groups
const D_PATTERN = new RegExp("([-+]?)(\\d+)([a-zA-Z]+)");

// patterns for matching the snap e.g. @d, @h
const S_GENERAL = "@[a-zA-Z]+\\d*";
const S_DETAILS = "@(?<unit_string>[a-zA-Z]+)(?<weekday>\\d*)"; // S_GENERAL but with named capture groups
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

    console.log(match);
    // Using positional indices instead of named groups
    this.unit = getUnit(match[1]);
    this.weekday = getWeekday(match[2]);
  }

  // Given a Date, modify it with the snapping logic
  applyTo(dttm: Date): Date {
    let result = new Date(dttm);

    if (this.unit === "weeks" && this.weekday !== null) {
      // handles particular weekdays e.g. -2w@w3
      result.setDate(
        result.getDate() - ((result.getDay() - this.weekday + 7) % 7)
      );
      result = truncate(result, "days");
    } else if (this.unit === "weeks") {
      result.setDate(result.getDate() - ((result.getDay() - 0 + 7) % 7));
      result = truncate(result, "days");
    } else {
      result = truncate(result, this.unit);
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
  applyTo(dttm: Date): Date {
    if (this.unit === null || this.mult === null || this.num === null) {
      throw new SnapTransformError("No transformation to apply");
    }

    const delta = { [this.unit]: this.mult * this.num };
    const result = new Date(dttm);
    switch (this.unit) {
      case "seconds":
        result.setSeconds(result.getSeconds() + delta.seconds);
        break;
      case "minutes":
        result.setMinutes(result.getMinutes() + delta.minutes);
        break;
      case "hours":
        result.setHours(result.getHours() + delta.hours);
        break;
      case "days":
        result.setDate(result.getDate() + delta.days);
        break;
      case "weeks":
        result.setDate(result.getDate() + delta.weeks * 7);
        break;
      case "months":
        // This is a bit tricky because months have different numbers of days
        // and they will overflow into the next month if the original date is greater than the last day of the next month
        const originalDate = result.getDate();
        result.setMonth(result.getMonth() + delta.months);
        if (result.getDate() !== originalDate) {
          result.setDate(0); // This will set the date to the last day of the previous month
        }
        break;
      case "years":
        result.setFullYear(result.getFullYear() + delta.years);
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
 * const currentDate = new Date().toISOString(); // Use the current date and time
 * const result = snap(currentDate, "@mon");
 * console.log(result);
 */
export default function snap(dttm: string, instruction: string): string {
  const dateObj = new Date(dttm);
  const transformations = parse(instruction);
  const result = transformations.reduce(
    (dt, transformation) => transformation.applyTo(dt),
    dateObj
  );
  if (result instanceof Date === false) {
    throw new Error("Unable to apply transformations");
  }
  return result.toISOString();
}
