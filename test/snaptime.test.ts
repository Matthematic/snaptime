import snaptime from "../src/index";

const anchor = "1980-01-01T00:00:00.000Z";

describe("Snaptime", () => {
  test("+1y", () => {
    const result = snaptime(anchor, "+1y");
    expect(result).toEqual("1981-01-01T00:00:00.000Z");
  });

  test("-1y", () => {
    const result = snaptime(anchor, "-1y");
    expect(result).toEqual("1979-01-01T00:00:00.000Z");
  });

  test("+1y@s", () => {
    const result = snaptime(anchor, "+1y@s");
    expect(result).toEqual("1981-01-01T00:00:00.000Z");
  });

  test("-1y@s", () => {
    const result = snaptime(anchor, "-1y@s");
    expect(result).toEqual("1979-01-01T00:00:00.000Z");
  });

  test("+1y@s+1h", () => {
    const result = snaptime(anchor, "+1y@s+1h");
    expect(result).toEqual("1981-01-01T01:00:00.000Z");
  });

  test("-1y@s-1h", () => {
    const result = snaptime(anchor, "-1y@s-1h");
    expect(result).toEqual("1978-12-31T23:00:00.000Z");
  });

  test("+1mon", () => {
    const result = snaptime(anchor, "+1mon");
    expect(result).toEqual("1980-02-01T00:00:00.000Z");
  });

  test("-1mon", () => {
    const result = snaptime(anchor, "-1mon");
    expect(result).toEqual("1979-12-01T00:00:00.000Z");
  });

  test("+1mon@m", () => {
    const result = snaptime(anchor, "+1mon@m");
    expect(result).toEqual("1980-02-01T00:00:00.000Z");
  });

  test("-1mon@m", () => {
    const result = snaptime(anchor, "-1mon@m");
    expect(result).toEqual("1979-12-01T00:00:00.000Z");
  });

  test("+1mon@m+1mon", () => {
    const result = snaptime(anchor, "+1mon@m+1mon");
    expect(result).toEqual("1980-03-01T00:00:00.000Z");
  });

  test.only("-1mon@m-1mon", () => {
    const result = snaptime(anchor, "-1mon@m-1mon");
    expect(result).toEqual("1979-11-01T00:00:00.000Z");
  });

  test("+1w", () => {
    const result = snaptime(anchor, "+1w");
    expect(result).toEqual("1980-01-08T00:00:00.000Z");
  });

  test("-1w", () => {
    const result = snaptime(anchor, "-1w");
    expect(result).toEqual("1979-12-25T00:00:00.000Z");
  });

  test("+1w@h", () => {
    const result = snaptime(anchor, "+1w@h");
    expect(result).toEqual("1980-01-08T00:00:00.000Z");
  });

  test("-1w@h", () => {
    const result = snaptime(anchor, "-1w@h");
    expect(result).toEqual("1979-12-25T00:00:00.000Z");
  });

  test("+1w@h+1w", () => {
    const result = snaptime(anchor, "+1w@h+1w");
    expect(result).toEqual("1980-01-15T00:00:00.000Z");
  });

  test("-1w@h-1w", () => {
    const result = snaptime(anchor, "-1w@h-1w");
    expect(result).toEqual("1979-12-18T00:00:00.000Z");
  });

  test("+1d", () => {
    const result = snaptime(anchor, "+1d");
    expect(result).toEqual("1980-01-02T00:00:00.000Z");
  });

  test("-1d", () => {
    const result = snaptime(anchor, "-1d");
    expect(result).toEqual("1979-12-31T00:00:00.000Z");
  });

  test("+1d@d", () => {
    const result = snaptime(anchor, "+1d@d");
    expect(result).toEqual("1980-01-02T00:00:00.000Z");
  });

  test("-1d@d", () => {
    const result = snaptime(anchor, "-1d@d");
    expect(result).toEqual("1979-12-31T00:00:00.000Z");
  });

  test("+1d@d+30d", () => {
    const result = snaptime(anchor, "+1d@d+30d");
    expect(result).toEqual("1980-02-01T00:00:00.000Z");
  });

  test("-1d@d-30d", () => {
    const result = snaptime(anchor, "-1d@d-30d");
    expect(result).toEqual("1979-12-01T00:00:00.000Z");
  });
});
