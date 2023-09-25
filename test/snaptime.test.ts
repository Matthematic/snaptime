import snaptime from "../src/index";

const anchor = "1980-01-01T00:00:00.000-06:00";

describe("Snaptime", () => {
  test("no instruction", () => {
    expect(snaptime(anchor, "")).toBe(anchor);
  });

  test("+1y", () => {
    const result = snaptime(anchor, "+1y");
    expect(result).toEqual("1981-01-01T00:00:00.000-06:00");
  });

  test("-1y", () => {
    const result = snaptime(anchor, "-1y");
    expect(result).toEqual("1979-01-01T00:00:00.000-06:00");
  });

  test("+1y@s", () => {
    const result = snaptime(anchor, "+1y@s");
    expect(result).toEqual("1981-01-01T00:00:00.000-06:00");
  });

  test("-1y@s", () => {
    const result = snaptime(anchor, "-1y@s");
    expect(result).toEqual("1979-01-01T00:00:00.000-06:00");
  });

  test("+1y@s+1h", () => {
    const result = snaptime(anchor, "+1y@s+1h");
    expect(result).toEqual("1981-01-01T01:00:00.000-06:00");
  });

  test("-1y@s-1h", () => {
    const result = snaptime(anchor, "-1y@s-1h");
    expect(result).toEqual("1978-12-31T23:00:00.000-06:00");
  });

  test("+1mon", () => {
    const result = snaptime(anchor, "+1mon");
    expect(result).toEqual("1980-02-01T00:00:00.000-06:00");
  });

  test("-1mon", () => {
    const result = snaptime(anchor, "-1mon");
    expect(result).toEqual("1979-12-01T00:00:00.000-06:00");
  });

  test("+1mon@m", () => {
    const result = snaptime(anchor, "+1mon@m");
    expect(result).toEqual("1980-02-01T00:00:00.000-06:00");
  });

  test("-1mon@m", () => {
    const result = snaptime(anchor, "-1mon@m");
    expect(result).toEqual("1979-12-01T00:00:00.000-06:00");
  });

  test("+1mon@m+1mon", () => {
    const result = snaptime(anchor, "+1mon@m+1mon");
    expect(result).toEqual("1980-03-01T00:00:00.000-06:00");
  });

  test("-1mon@m-1mon", () => {
    const result = snaptime(anchor, "-1mon@m-1mon");
    expect(result).toEqual("1979-11-01T00:00:00.000-06:00");
  });

  test("+1w", () => {
    const result = snaptime(anchor, "+1w");
    expect(result).toEqual("1980-01-08T00:00:00.000-06:00");
  });

  test("-1w", () => {
    const result = snaptime(anchor, "-1w");
    expect(result).toEqual("1979-12-25T00:00:00.000-06:00");
  });

  test("+1w@h", () => {
    const result = snaptime(anchor, "+1w@h");
    expect(result).toEqual("1980-01-08T00:00:00.000-06:00");
  });

  test("-1w@h", () => {
    const result = snaptime(anchor, "-1w@h");
    expect(result).toEqual("1979-12-25T00:00:00.000-06:00");
  });

  test("+1w@h+1w", () => {
    const result = snaptime(anchor, "+1w@h+1w");
    expect(result).toEqual("1980-01-15T00:00:00.000-06:00");
  });

  test("-1w@h-1w", () => {
    const result = snaptime(anchor, "-1w@h-1w");
    expect(result).toEqual("1979-12-18T00:00:00.000-06:00");
  });

  test("+1d", () => {
    const result = snaptime(anchor, "+1d");
    expect(result).toEqual("1980-01-02T00:00:00.000-06:00");
  });

  test("-1d", () => {
    const result = snaptime(anchor, "-1d");
    expect(result).toEqual("1979-12-31T00:00:00.000-06:00");
  });

  test("+1d@d", () => {
    const result = snaptime(anchor, "+1d@d");
    expect(result).toEqual("1980-01-02T00:00:00.000-06:00");
  });

  test("-1d@d", () => {
    const result = snaptime(anchor, "-1d@d");
    expect(result).toEqual("1979-12-31T00:00:00.000-06:00");
  });

  test("+1d@d+30d", () => {
    const result = snaptime(anchor, "+1d@d+30d");
    expect(result).toEqual("1980-02-01T00:00:00.000-06:00");
  });

  test("-1d@d-30d", () => {
    const result = snaptime(anchor, "-1d@d-30d");
    expect(result).toEqual("1979-12-01T00:00:00.000-06:00");
  });

  describe("Boundary Conditions", () => {
    test("Transform end of month", () => {
      expect(snaptime("1980-01-31T00:00:00.000-06:00", "+1mon")).toBe(
        "1980-02-29T00:00:00.000-06:00"
      );
    });

    test("Transform leap year", () => {
      expect(snaptime("2020-02-28T00:00:00.000-06:00", "+1d")).toBe(
        "2020-02-29T00:00:00.000-06:00"
      );
    });

    test("Transform end of year", () => {
      expect(snaptime("1980-12-31T00:00:00.000-06:00", "+1d")).toBe(
        "1981-01-01T00:00:00.000-06:00"
      );
    });
  });

  describe("Weekdays", () => {
    test("Snap to Sunday from Saturday", () => {
      expect(snaptime("1980-01-05T00:00:00.000-06:00", "@w6")).toBe(
        "1980-01-06T00:00:00.000-06:00"
      );
    });

    test("Negative delta with weekday", () => {
      expect(snaptime("1980-01-07T00:00:00.000-06:00", "-1w@w5")).toBe(
        "1980-01-05T00:00:00.000-06:00"
      );
    });
  });

  describe("Multiple Deltas and Snaps", () => {
    test("Combine multiple transformations", () => {
      expect(snaptime("1980-01-15T00:00:00.000-06:00", "+2y-3mon+5d@h")).toBe(
        "1981-10-20T00:00:00.000-05:00"
      );
    });

    test("Edge cases with multiple instructions", () => {
      expect(snaptime("1980-01-31T00:00:00.000-06:00", "@m+1mon")).toBe(
        "1980-02-29T00:00:00.000-06:00"
      );
    });
  });

  describe("Zero and No Units", () => {
    test("No-op with +0y", () => {
      expect(snaptime("1980-01-15T00:00:00.000-06:00", "+0y")).toBe(
        "1980-01-15T00:00:00.000-06:00"
      );
    });

    test("No explicit unit", () => {
      expect(() => snaptime("1980-01-15T00:00:00.000-06:00", "@")).toThrow(
        "Cannot parse instruction '@'. There is an error at '@'"
      );
    });

    test("Blank instruction", () => {
      expect(snaptime("1980-01-15T00:00:00.000-06:00", "")).toBe(
        "1980-01-15T00:00:00.000-06:00"
      );
    });
  });

  describe("Invalid Instructions", () => {
    test("Unrecognized units", () => {
      // This could throw an error, so it might be wrapped in a try-catch or using .toThrow() jest method
      expect(() => snaptime("1980-01-15T00:00:00.000-06:00", "+5z")).toThrow(
        "Unknown unit string 'z'"
      );
    });

    test("Instructions that make no sense", () => {
      expect(() => snaptime("1980-01-15T00:00:00.000-06:00", "@y3")).toThrow(
        "Cannot parse instruction '@y3'. There is an error at '3'"
      );
    });

    test("Unparseable date format", () => {
      expect(() =>
        snaptime(
          "Wed Aug 23 2023 12:26:40 GMT-0500 (Central Daylight Time)",
          "+1d"
        )
      ).toThrow(
        "Invalid date supplied, unable to parse. Please use ISO 8601 format"
      );
    });

    test("Unparseable date object", () => {
      expect(() =>
        snaptime(
          // @ts-ignore
          new Date(),
          "+1d"
        )
      ).toThrow(
        "Invalid date supplied, unable to parse. Please use ISO 8601 format"
      );
    });
  });

  describe("Large Numbers", () => {
    test("Large years positive", () => {
      expect(snaptime("1980-01-15T00:00:00.000-06:00", "+1000y")).toBe(
        "2980-01-15T00:00:00.000-06:00"
      );
    });

    test("Large days negative", () => {
      expect(snaptime("1980-01-15T00:00:00.000-06:00", "-10000d")).toBe(
        "1952-08-29T00:00:00.000-05:00"
      );
    });
  });

  describe("Precision and Rounding", () => {
    test("Date-time with milliseconds", () => {
      expect(snaptime("1980-01-15T14:23:45.678-06:00", "@h")).toBe(
        "1980-01-15T14:00:00.000-06:00"
      );
    });
  });

  describe("Different formats", () => {
    test("non-utc input", () => {
      expect(snaptime("1980-01-15T14", "@h")).toBe(
        "1980-01-15T14:00:00.000-06:00"
      );
    });
  });
});
