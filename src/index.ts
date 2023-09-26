import { DateTime, Duration, DurationLikeObject } from "luxon";

class SnapParseError extends Error {}

class SnapUnitError extends Error {}

class SnapTransformError extends Error {}

// Defines the acceptable units and unit aliases
const UNIT_LISTS: Record<string, string[]> = {
  milliseconds: ["ms", "millisecond", "milliseconds"],
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
      case "milliseconds":
        result = result.plus({ milliseconds: this.mult * this.num });
        break;
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
export default function snap(
  dttm: string,
  instruction: string,
  opts?: { zone: string }
): string | null {
  const dateObj = DateTime.fromISO(dttm, { zone: opts?.zone });

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

/**
 * @private
 * Given a Luxon Duration object, return a modifier string that represents it
 */
function createModifierString(diff: Duration) {
  const units = [
    "years",
    "months",
    "weeks",
    "days",
    "hours",
    "minutes",
    "seconds",
    "milliseconds",
  ];
  const unitAbbreviations = {
    years: "y",
    months: "mon",
    weeks: "w",
    days: "d",
    hours: "h",
    minutes: "m",
    seconds: "s",
    milliseconds: "ms",
  };

  let modifierString = "";
  for (const unit of units) {
    // @ts-expect-error
    const value = diff[unit];
    if (value !== 0) {
      const sign = value > 0 ? "+" : "-";
      // @ts-expect-error
      modifierString += `${sign}${Math.abs(value)}${unitAbbreviations[unit]}`;
    }
  }

  return modifierString;
}

/**
 * @experimental
 * Performs the reverse of snap(), returning a modifier string that can be used to snap a date to another date.
 * Warning: This behavior is highly experimental, as the logic for deriving and simplifying the modifier string is difficult
 * and not fully developed.
 */
export function unsnap(target: string, anchor: string): string {
  const targetDate = DateTime.fromISO(target);
  const anchorDate = anchor ? DateTime.fromISO(anchor) : DateTime.now();

  if (!targetDate.isValid || !anchorDate.isValid) {
    throw new SnapParseError(
      "Invalid date supplied, unable to parse. Please use ISO 8601 format"
    );
  }

  const diff = targetDate
    .diff(
      anchorDate,
      [
        "years",
        "months",
        "weeks",
        "days",
        "hours",
        "minutes",
        "seconds",
        "milliseconds",
      ],
      { conversionAccuracy: "longterm" }
    )
    .shiftToAll()
    .normalize();
  const modifierString = createModifierString(diff);

  const simplifiedModifier = simplify(
    diff,
    modifierString,
    targetDate,
    anchorDate
  );

  return simplifiedModifier;
}

/**
 * @private
 * This method makes an attempt to simplify a modifer string with snap transformations
 */
function simplify(
  diff: DurationLikeObject,
  modifier: string,
  targetDate: DateTime,
  anchorDate: DateTime
): string {
  const diffKeys = Object.keys(UNIT_LISTS)
    // @ts-expect-error
    .filter((key) => diff[key] !== 0)
    .reverse();

  for (let i = 0; i < diffKeys.length; i++) {
    const newModifier = snapDescendants(modifier, diffKeys[i]);
    const newSnap = snap(anchorDate.toISO() as string, newModifier);
    if (
      newSnap === targetDate.toISO() &&
      newModifier.length <= modifier.length
    ) {
      return newModifier;
    }
  }

  return modifier;
}

/**
 * @private
 * Given a modifier string, this method tries to find the limit that a series of
 * delta transformations is approaching, and replacing that series with a snap transformation.
 *
 * For Example:
 * ```javascript
 * const result = snapDescendants("-1d-23h-59m-59s-999ms", "days");
 * expect(result).toBe("-1d@d");
 * ```
 *
 * This method is used internally by unsnap() to simplify the modifier string.
 */
export function snapDescendants(
  modifierString: string,
  unitType: keyof typeof UNIT_LISTS
) {
  const unitsHierarchy = [
    "years",
    "months",
    "weeks",
    "days",
    "hours",
    "minutes",
    "seconds",
    "milliseconds",
  ];

  let result = "";
  let negativeChain = "";
  let insideNegativeChain = false;

  for (const unit of unitsHierarchy) {
    if (UNIT_LISTS[unit]) {
      for (const abbreviation of UNIT_LISTS[unit]) {
        const regex = new RegExp(`([+-]?\\d+)${abbreviation}\\b`, "g");
        const match = regex.exec(modifierString);

        if (match) {
          if (match[0].startsWith("-")) {
            insideNegativeChain = true;
            negativeChain = match[0] + negativeChain;
          } else if (insideNegativeChain) {
            // Once we encounter a positive delta after starting the negative chain, we stop and snap the negative chain
            const snappedNegativeChain = snapNegativeChain(
              negativeChain,
              unitType
            );
            return result + snappedNegativeChain;
          } else {
            result = result + match[0];
          }
        }
      }
    }
  }

  // If the entire string is a negative chain, we snap it
  if (insideNegativeChain) {
    const snappedNegativeChain = snapNegativeChain(negativeChain, unitType);
    return result + snappedNegativeChain;
  }

  return modifierString; // Return the original string if there is no negative chain

  function snapNegativeChain(chain: any, unitType: any) {
    let isSnapping = false;
    let snappedChain = "";

    for (const unit of unitsHierarchy) {
      if (unit === unitType) isSnapping = true;

      if (UNIT_LISTS[unit]) {
        for (const abbreviation of UNIT_LISTS[unit]) {
          const regex = new RegExp(`([+-]?\\d+)${abbreviation}\\b`, "g");
          const match = regex.exec(chain);

          if (match) {
            if (isSnapping) {
              return snappedChain + match[0] + "@" + UNIT_LISTS[unit][0]; // Return immediately after snapping
            } else {
              snappedChain = snappedChain + match[0];
            }
          }
        }
      }
    }

    return snappedChain;
  }
}
