import { describe, expect, it } from "vitest";
import { buildNoaaWaterTemperatureUrl } from "@/src/lib/providers/noaa";
import { buildWqpResultUrl } from "@/src/lib/providers/wqp";

describe("provider URL boundaries", () => {
  it("builds bounded NOAA requests", () => {
    expect(buildNoaaWaterTemperatureUrl("9414290")).toContain("station=9414290");
    expect(() => buildNoaaWaterTemperatureUrl("not-a-station")).toThrow(/seven digits/);
  });

  it("validates WQP bounding boxes", () => {
    expect(buildWqpResultUrl("-122.6,37.3,-121.7,38.3")).toContain("bBox=-122.6%2C37.3%2C-121.7%2C38.3");
    expect(() => buildWqpResultUrl("38,-122,37,-121")).toThrow(/bounding box/);
  });
});
