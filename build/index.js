"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SnapParseError extends Error {
}
class SnapUnitError extends Error {
}
class SnapTransformError extends Error {
}
// Defines the acceptable units and unit aliases
const UNIT_LISTS = {
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
function getUnit(string) {
    for (const [unit, variants] of Object.entries(UNIT_LISTS)) {
        if (variants.includes(string)) {
            return unit;
        }
    }
    throw new SnapUnitError(`Unknown unit string '${string}'`);
}
// Convert a string to a number, defaulting to 1 if there is none.
// The default of 1 is chosen because @w needs to default to monday
// as monday is the first day of the week in the ISO 8601 standard.
function getNum(string, defaultVal = 1) {
    if ((!string || string === "") && defaultVal !== null) {
        return defaultVal;
    }
    return parseInt(string, 10);
}
// Given a weekday unit string, return the weekday index it represents, 0-6
function getWeekday(string) {
    const result = getNum(string, null);
    if (result !== null && !(result >= 0 && result <= 7)) {
        throw new SnapParseError(`Bad weekday '${result}'`);
    }
    return result;
}
// Given a string representing the sign of a signed int, return the direction of the sign.
function getMult(string) {
    return string === "-" ? -1 : 1;
}
// Performs the actual snapping logic for each unit key
function truncate(dateTime, unit) {
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
            dateTime.setDate(1);
            dateTime.setHours(0, 0, 0, 0);
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
const D_PATTERN = new RegExp(D_DETAILS);
// patterns for matching the snap e.g. @d, @h
const S_GENERAL = "@[a-zA-Z]+\\d*";
const S_DETAILS = "@(?<unit_string>[a-zA-Z]+)(?<weekday>\\d*)"; // S_GENERAL but with named capture groups
const S_PATTERN = new RegExp(S_DETAILS);
const HEAD_PATTERN = new RegExp(`^(${S_GENERAL}|${D_GENERAL})(.*)`);
/**
 * Class representing a Snap Transormation
 * A snap consists of a unit and an optional weekday number if the unit is a weekday
 */
class SnapTransformation {
    constructor(group) {
        var _a;
        // Check that the string is actually a snap
        const matchDict = (_a = S_PATTERN.exec(group)) === null || _a === void 0 ? void 0 : _a.groups;
        if (!matchDict)
            throw new Error("No match");
        this.unit = getUnit(matchDict.unit_string);
        this.weekday = getWeekday(matchDict.weekday);
    }
    // Given a Date, modify it with the snapping logic
    applyTo(dttm) {
        let result = new Date(dttm);
        if (this.unit === "weeks" && this.weekday !== null) {
            // handles particular weekdays e.g. -2w@w3
            result.setDate(result.getDate() - ((result.getDay() - this.weekday + 7) % 7));
            result = truncate(result, "days");
        }
        else if (this.unit === "weeks") {
            result.setDate(result.getDate() - ((result.getDay() - 0 + 7) % 7));
            result = truncate(result, "days");
        }
        else {
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
    constructor(group) {
        var _a;
        this.mult = null; // the sign
        this.num = null;
        this.unit = null;
        const matchDict = (_a = D_PATTERN.exec(group)) === null || _a === void 0 ? void 0 : _a.groups;
        if (matchDict) {
            this.mult = getMult(matchDict.sign);
            this.num = getNum(matchDict.num);
            this.unit = getUnit(matchDict.unit_string);
        }
    }
    // Given a Date, modify it with the delta logic
    applyTo(dttm) {
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
                result.setMonth(result.getMonth() + delta.months);
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
function parse(instruction) {
    let instr = instruction;
    const result = [];
    while (instr) {
        const match = HEAD_PATTERN.exec(instr); // get the first parseable chunk of the instruction
        if (!match) {
            throw new SnapParseError(`Cannot parse instruction '${instruction}'. There is an error at '${instr}'`);
        }
        const group = match[1];
        if (S_PATTERN.test(group)) {
            // if it is a snap, use a snap transformation
            const transformation = new SnapTransformation(group);
            result.push(transformation);
        }
        else {
            // else it must be a delta, use a delta transformation
            const transformation = new DeltaTransformation(group);
            result.push(transformation);
        }
        instr = match[2]; // loop over the rest of the string
    }
    return result;
}
// Performs an instruction on an ISO 8601 string and returns an ISO 8601 string
function snap(dttm, instruction) {
    const dateObj = new Date(dttm);
    const transformations = parse(instruction);
    const result = transformations.reduce((dt, transformation) => transformation.applyTo(dt), dateObj);
    if (result instanceof Date === false) {
        throw new Error("Unable to apply transformations");
    }
    return result.toISOString();
}
exports.default = snap;
// Example usage
// const currentDate = new Date().toISOString(); // Use the current date and time
// const result = snap(currentDate, "@mon");
// console.log(result);
