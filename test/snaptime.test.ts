import snap, { snapDescendants, unsnap } from "../src/index";

const anchor = "1980-01-01T00:00:00.000-06:00";

describe("snap", () => {
  test("no instruction", () => {
    expect(snap(anchor, "")).toBe(anchor);
  });

  test("+1ms", () => {
    const result = snap(anchor, "+1ms");
    expect(result).toEqual("1980-01-01T00:00:00.001-06:00");
  });

  test("+1ms@ms", () => {
    const result = snap(anchor, "+1ms@ms");
    expect(result).toEqual("1980-01-01T00:00:00.001-06:00");
  });

  test("-1ms", () => {
    const result = snap(anchor, "-1ms");
    expect(result).toEqual("1979-12-31T23:59:59.999-06:00");
  });

  test("-1ms@ms", () => {
    const result = snap(anchor, "-1ms@ms");
    expect(result).toEqual("1979-12-31T23:59:59.999-06:00");
  });

  test("+1y", () => {
    const result = snap(anchor, "+1y");
    expect(result).toEqual("1981-01-01T00:00:00.000-06:00");
  });

  test("-1y", () => {
    const result = snap(anchor, "-1y");
    expect(result).toEqual("1979-01-01T00:00:00.000-06:00");
  });

  test("+1y@s", () => {
    const result = snap(anchor, "+1y@s");
    expect(result).toEqual("1981-01-01T00:00:00.000-06:00");
  });

  test("-1y@s", () => {
    const result = snap(anchor, "-1y@s");
    expect(result).toEqual("1979-01-01T00:00:00.000-06:00");
  });

  test("+1y@s+1h", () => {
    const result = snap(anchor, "+1y@s+1h");
    expect(result).toEqual("1981-01-01T01:00:00.000-06:00");
  });

  test("-1y@s-1h", () => {
    const result = snap(anchor, "-1y@s-1h");
    expect(result).toEqual("1978-12-31T23:00:00.000-06:00");
  });

  test("+1mon", () => {
    const result = snap(anchor, "+1mon");
    expect(result).toEqual("1980-02-01T00:00:00.000-06:00");
  });

  test("-1mon", () => {
    const result = snap(anchor, "-1mon");
    expect(result).toEqual("1979-12-01T00:00:00.000-06:00");
  });

  test("+1mon@m", () => {
    const result = snap(anchor, "+1mon@m");
    expect(result).toEqual("1980-02-01T00:00:00.000-06:00");
  });

  test("-1mon@m", () => {
    const result = snap(anchor, "-1mon@m");
    expect(result).toEqual("1979-12-01T00:00:00.000-06:00");
  });

  test("+1mon@m+1mon", () => {
    const result = snap(anchor, "+1mon@m+1mon");
    expect(result).toEqual("1980-03-01T00:00:00.000-06:00");
  });

  test("-1mon@m-1mon", () => {
    const result = snap(anchor, "-1mon@m-1mon");
    expect(result).toEqual("1979-11-01T00:00:00.000-06:00");
  });

  test("+1w", () => {
    const result = snap(anchor, "+1w");
    expect(result).toEqual("1980-01-08T00:00:00.000-06:00");
  });

  test("-1w", () => {
    const result = snap(anchor, "-1w");
    expect(result).toEqual("1979-12-25T00:00:00.000-06:00");
  });

  test("+1w@h", () => {
    const result = snap(anchor, "+1w@h");
    expect(result).toEqual("1980-01-08T00:00:00.000-06:00");
  });

  test("-1w@h", () => {
    const result = snap(anchor, "-1w@h");
    expect(result).toEqual("1979-12-25T00:00:00.000-06:00");
  });

  test("+1w@h+1w", () => {
    const result = snap(anchor, "+1w@h+1w");
    expect(result).toEqual("1980-01-15T00:00:00.000-06:00");
  });

  test("-1w@h-1w", () => {
    const result = snap(anchor, "-1w@h-1w");
    expect(result).toEqual("1979-12-18T00:00:00.000-06:00");
  });

  test("+1d", () => {
    const result = snap(anchor, "+1d");
    expect(result).toEqual("1980-01-02T00:00:00.000-06:00");
  });

  test("-1d", () => {
    const result = snap(anchor, "-1d");
    expect(result).toEqual("1979-12-31T00:00:00.000-06:00");
  });

  test("+1d@d", () => {
    const result = snap(anchor, "+1d@d");
    expect(result).toEqual("1980-01-02T00:00:00.000-06:00");
  });

  test("-1d@d", () => {
    const result = snap(anchor, "-1d@d");
    expect(result).toEqual("1979-12-31T00:00:00.000-06:00");
  });

  test("+1d@d+30d", () => {
    const result = snap(anchor, "+1d@d+30d");
    expect(result).toEqual("1980-02-01T00:00:00.000-06:00");
  });

  test("-1d@d-30d", () => {
    const result = snap(anchor, "-1d@d-30d");
    expect(result).toEqual("1979-12-01T00:00:00.000-06:00");
  });

  describe("Boundary Conditions", () => {
    test("Transform end of month", () => {
      expect(snap("1980-01-31T00:00:00.000-06:00", "+1mon")).toBe(
        "1980-02-29T00:00:00.000-06:00"
      );
    });

    test("Transform leap year", () => {
      expect(snap("2020-02-28T00:00:00.000-06:00", "+1d")).toBe(
        "2020-02-29T00:00:00.000-06:00"
      );
    });

    test("Transform end of year", () => {
      expect(snap("1980-12-31T00:00:00.000-06:00", "+1d")).toBe(
        "1981-01-01T00:00:00.000-06:00"
      );
    });
  });

  describe("Weekdays", () => {
    test("Snap to Sunday from Saturday", () => {
      expect(snap("1980-01-05T00:00:00.000-06:00", "@w6")).toBe(
        "1980-01-06T00:00:00.000-06:00"
      );
    });

    test("Negative delta with weekday", () => {
      expect(snap("1980-01-07T00:00:00.000-06:00", "-1w@w5")).toBe(
        "1980-01-05T00:00:00.000-06:00"
      );
    });
  });

  describe("Multiple Deltas and Snaps", () => {
    test("Combine multiple transformations", () => {
      expect(snap("1980-01-15T00:00:00.000-06:00", "+2y-3mon+5d@h")).toBe(
        "1981-10-20T00:00:00.000-05:00"
      );
    });

    test("Edge cases with multiple instructions", () => {
      expect(snap("1980-01-31T00:00:00.000-06:00", "@m+1mon")).toBe(
        "1980-02-29T00:00:00.000-06:00"
      );
    });
  });

  describe("Zero and No Units", () => {
    test("No-op with +0y", () => {
      expect(snap("1980-01-15T00:00:00.000-06:00", "+0y")).toBe(
        "1980-01-15T00:00:00.000-06:00"
      );
    });

    test("No explicit unit", () => {
      expect(() => snap("1980-01-15T00:00:00.000-06:00", "@")).toThrow(
        "Cannot parse instruction '@'. There is an error at '@'"
      );
    });

    test("Blank instruction", () => {
      expect(snap("1980-01-15T00:00:00.000-06:00", "")).toBe(
        "1980-01-15T00:00:00.000-06:00"
      );
    });
  });

  describe("Invalid Instructions", () => {
    test("Unrecognized units", () => {
      // This could throw an error, so it might be wrapped in a try-catch or using .toThrow() jest method
      expect(() => snap("1980-01-15T00:00:00.000-06:00", "+5z")).toThrow(
        "Unknown unit string 'z'"
      );
    });

    test("Instructions that make no sense", () => {
      expect(() => snap("1980-01-15T00:00:00.000-06:00", "@y3")).toThrow(
        "Cannot parse instruction '@y3'. There is an error at '3'"
      );
    });

    test("Unparseable date format", () => {
      expect(() =>
        snap("Wed Aug 23 2023 12:26:40 GMT-0500 (Central Daylight Time)", "+1d")
      ).toThrow(
        "Invalid date supplied, unable to parse. Please use ISO 8601 format"
      );
    });

    test("Unparseable date object", () => {
      expect(() =>
        snap(
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
      expect(snap("1980-01-15T00:00:00.000-06:00", "+1000y")).toBe(
        "2980-01-15T00:00:00.000-06:00"
      );
    });

    test("Large days negative", () => {
      expect(snap("1980-01-15T00:00:00.000-06:00", "-10000d")).toBe(
        "1952-08-29T00:00:00.000-05:00"
      );
    });
  });

  describe("Precision and Rounding", () => {
    test("Date-time with milliseconds", () => {
      expect(snap("1980-01-15T14:23:45.678-06:00", "@h")).toBe(
        "1980-01-15T14:00:00.000-06:00"
      );
    });
  });

  describe("Different formats", () => {
    test("non-utc input", () => {
      expect(snap("1980-01-15T14", "@h")).toBe("1980-01-15T14:00:00.000-06:00");
    });
  });

  describe("Timezones", () => {
    it("Persists Timezone using option", () => {
      expect(
        snap("2023-09-26T12:35:31.337-07:00", "@d", {
          zone: "America/Los_Angeles",
        })
      ).toBe("2023-09-26T00:00:00.000-07:00");
    });

    it("Converts Timezone to local", () => {
      expect(snap("2023-09-26T12:35:31.337-07:00", "@d")).toBe(
        "2023-09-26T00:00:00.000-05:00"
      );
    });
  });
});

describe("unsnap", () => {
  it("should unsnap to start of day", () => {
    expect(
      unsnap("2023-09-24T00:00:00-05:00", "2023-09-25T23:59:59-05:00")
    ).toBe("-1d@d");
  });

  it("should unsnap to start of month", () => {
    const timestamp = "2023-08-01T00:00:00.000-05:00";
    const anchor = "2023-09-24T00:00:00.000-05:00";
    const instruction = unsnap(timestamp, anchor);
    expect(snap(anchor, instruction)).toBe(timestamp);
  });

  it("should unsnap to 7 days in the future at the start of the month", () => {
    expect(
      unsnap("2023-10-01T00:00:00-05:00", "2023-09-24T00:00:00-05:00")
    ).toBe("+1w");
  });

  it("should unsnap to 12 hours in the future", () => {
    expect(
      unsnap("2023-09-24T12:00:00-05:00", "2023-09-24T00:00:00-05:00")
    ).toBe("+12h");
  });

  it("should unsnap to 1 day in the past at the start of the day", () => {
    expect(
      unsnap("2023-09-23T00:00:00-05:00", "2023-09-24T00:00:00-05:00")
    ).toBe("-1d");
  });

  it("should unsnap to 11 months and 30 days in the future at the start of the month", () => {
    expect(
      unsnap("2023-12-31T00:00:00-05:00", "2023-01-01T00:00:00-05:00")
    ).toBe("+11mon+4w+2d");
  });

  it("should unsnap to 1 year in the future at the start of the month", () => {
    expect(
      unsnap("2024-01-01T00:00:00-05:00", "2023-01-01T00:00:00-05:00")
    ).toBe("+1y");
  });

  it("should unsnap to 30 minutes in the future", () => {
    expect(
      unsnap("2023-09-24T00:30:00-05:00", "2023-09-24T00:00:00-05:00")
    ).toBe("+30m");
  });

  it("should unsnap to 30 seconds in the future", () => {
    expect(
      unsnap("2023-09-24T00:00:30-05:00", "2023-09-24T00:00:00-05:00")
    ).toBe("+30s");
  });

  it("should unsnap to the same time", () => {
    expect(
      unsnap("2023-09-24T00:00:00-05:00", "2023-09-24T00:00:00-05:00")
    ).toBe("");
  });
});

describe("snapDescendants", () => {
  describe("negative delta", () => {
    it("works", () => {
      const result = snapDescendants("-1d-23h-59m-59s-999ms", "days");
      expect(result).toBe("-1d@d");
    });

    it("should snap to months", () => {
      const result = snapDescendants(
        "-1y-11mon-3w-6d-23h-59m-59s-999ms",
        "months"
      );
      expect(result).toBe("-1y-11mon@mon");
    });

    it("should snap to weeks", () => {
      const result = snapDescendants("+2y+10mon-2w-5d-20h-40m-30s", "weeks");
      expect(result).toBe("+2y+10mon-2w@w");
    });

    it("should snap to days", () => {
      const result = snapDescendants("-1y-2mon-3w-4d-5h-6m-7s", "days");
      expect(result).toBe("-1y-2mon-3w-4d@d");
    });

    it("should snap to hours", () => {
      const result = snapDescendants("+1y+2mon+3w+4d-5h-6m-7s", "hours");
      expect(result).toBe("+1y+2mon+3w+4d-5h@h");
    });

    it("should snap to minutes", () => {
      const result = snapDescendants("-1y-2mon-3w-4d-5h-6m-7s", "minutes");
      expect(result).toBe("-1y-2mon-3w-4d-5h-6m@m");
    });

    it("should snap to seconds", () => {
      const result = snapDescendants("+1y+2mon+3w+4d+5h+6m-7s", "seconds");
      expect(result).toBe("+1y+2mon+3w+4d+5h+6m-7s@s");
    });
  });

  describe("positive delta", () => {
    it("should not work for positive chains", () => {
      const result = snapDescendants("+1y+11mon+3w+6d+23h+59m+59s", "months");
      expect(result).toBe("+1y+11mon+3w+6d+23h+59m+59s");
    });
  });
});
