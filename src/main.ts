import * as d3 from "d3";
import timeseries from "../timeseries.json";

interface Options {
  getXValues: (data: TimeSeriesDatum) => number; //,
  getYValues: (data: TimeSeriesDatum) => number; //,
  curve?: d3.CurveFactory; // = d3.curveLinear, // method of interpolation between points
  marginTop?: number; // = 20, // top margin, in pixels
  marginRight?: number; // = 30, // right margin, in pixels
  marginBottom?: number; // = 30, // bottom margin, in pixels
  marginLeft?: number; // = 40, // left margin, in pixels
  width?: number; // = 640, // outer width, in pixels
  height?: number; // = 400, // outer height, in pixels
  xType?: typeof d3.scaleUtc; // = d3.scaleUtc, // the x-scale type
  xRange?: [number, number]; // = [marginLeft, width - marginRight], // [left, right]
  yType?: typeof d3.scaleLinear; // = d3.scaleLinear, // the y-scale type
  yRange?: [number, number]; // = [height - marginBottom, marginTop], // [bottom, top]
  yLabel: string; //, // a label for the y-axis
  color?: string; // = "currentColor", // stroke color of line
  strokeLinecap?: string; // = "round", // stroke line cap of the line
  strokeLinejoin?: string; // = "round", // stroke line join of the line
  strokeWidth?: number; // = 1.5, // stroke width of line, in pixels
  strokeOpacity?: number; // = 1, // stroke opacity of line
}

type TimeSeriesDatum = { time: number; value: number };

function LineChart(
  data: TimeSeriesDatum[],
  {
    getXValues,
    getYValues,
    curve = d3.curveLinear, // method of interpolation between points
    marginTop = 20, // top margin, in pixels
    marginRight = 30, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 40, // left margin, in pixels
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    xType = d3.scaleUtc, // the x-scale type
    xRange = [marginLeft, width - marginRight], // [left, right]
    yType = d3.scaleLinear, // the y-scale type
    yRange = [height - marginBottom, marginTop], // [bottom, top]
    yLabel, // a label for the y-axis
    color = "currentColor", // stroke color of line
    strokeLinecap = "round", // stroke line cap of the line
    strokeLinejoin = "round", // stroke line join of the line
    strokeWidth = 1.5, // stroke width of line, in pixels
    strokeOpacity = 1, // stroke opacity of line
  }: Options
) {
  // Compute values.
  const xAxisValues: number[] = d3.map(data, getXValues);
  const yAxisValues: number[] = d3.map(data, getYValues);
  const sizeOfXAxis: [number, number][] = d3
    .range(xAxisValues.length)
    .map((position) => [0, position]);
  const valueExists = (d: TimeSeriesDatum, i: number): boolean =>
    Boolean(d.time) && !isNaN(d.value);
  const valuesExist: boolean[] = d3.map(data, valueExists);

  // Construct scales and axes.
  const xScale = xType(d3.extent(xAxisValues) as [number, number], xRange);
  const yScale = yType([0, d3.max(yAxisValues)!], yRange);
  const renderXAxis: d3.Axis<d3.NumberValue> = d3
    .axisBottom(xScale)
    .ticks(width / 80)
    .tickSizeOuter(0);
  const renderYAxis: d3.Axis<d3.NumberValue> = d3
    .axisLeft(yScale)
    .ticks(height / 40);

  // Construct a line generator.
  const line = d3
    .line()
    .defined((_d: [number, number], i: number) => valuesExist[i])
    .curve(curve)
    .x((_d: [number, number], i: number) => {
      return xScale(xAxisValues[i]);
    })
    .y((_d: [number, number], i: number) => yScale(yAxisValues[i]));

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height].join(","))
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(renderXAxis);

  svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(renderYAxis)
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1)
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", -marginLeft)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text(yLabel)
    );

  svg
    .append("path")
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", strokeWidth)
    .attr("stroke-linecap", strokeLinecap)
    .attr("stroke-linejoin", strokeLinejoin)
    .attr("stroke-opacity", strokeOpacity)
    .attr("d", line(sizeOfXAxis));

  return svg.node();
}

const chart = LineChart(
  timeseries.map((reading) => ({
    time: Date.parse(reading.valuedatetime),
    value: reading.datavalue,
  })),
  {
    getXValues: (d) => d.time,
    getYValues: (d) => d.value,
    yLabel: "temperature",
    width: document.querySelector("body")?.offsetWidth,
    height: 500,
    color: "steelblue",
  }
);

if (chart) {
  document.getElementById("root")?.append(chart);
}
