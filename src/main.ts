import * as d3 from "d3";
import { AxisScale } from "d3";
import totalEmissions from "../tot_emiss_kg.json";
import { CSS_COLOR_NAMES } from "./colors";

interface Options {
  getXValues: (data: TimeSeriesDatum) => number; //,
  getYValues: (data: TimeSeriesDatum) => number; //,
  getZValues: (data: TimeSeriesDatum) => string;
  curve?: d3.CurveFactory; // = d3.curveLinear, // method of interpolation between points
  marginTop?: number; // = 20, // top margin, in pixels
  marginRight?: number; // = 30, // right margin, in pixels
  marginBottom?: number; // = 30, // bottom margin, in pixels
  marginLeft?: number; // = 40, // left margin, in pixels
  width?: number; // = 640, // outer width, in pixels
  height?: number; // = 400, // outer height, in pixels
  xType?: typeof d3.scaleUtc; // = d3.scaleUtc, // the x-scale type
  xRange?: [number, number]; // = [marginLeft, width - marginRight], // [left, right]
  yType?: typeof d3.scaleLinear; //
  yRange?: [number, number]; // = [height - marginBottom, marginTop], // [bottom, top]
  yLabel: string; //, // a label for the y-axis
  color?: string; // = "currentColor", // stroke color of line
  strokeLinecap?: string; // = "round", // stroke line cap of the line
  strokeLinejoin?: string; // = "round", // stroke line join of the line
  strokeWidth?: number; // = 1.5, // stroke width of line, in pixels
  strokeOpacity?: number; // = 1, // stroke opacity of line
}

type TimeSeriesDatum = {
  year: string;
  value: number;
  food: string;
};

function LineChart(
  data: TimeSeriesDatum[],
  {
    getXValues,
    getYValues,
    getZValues,
    curve = d3.curveLinear, // method of interpolation between points
    marginTop = 20, // top margin, in pixels
    marginRight = 60, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 60, // left margin, in pixels
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
  const zAxisValues: string[] = d3.map(data, getZValues);
  const sizeOfXAxis: [number, number][] = d3
    .range(xAxisValues.length)
    .map((position) => [0, position]);
  const valueExists = (d: TimeSeriesDatum, i: number): boolean =>
    Boolean(d.year) && !isNaN(d.value);
  const valuesExist: boolean[] = d3.map(data, valueExists);

  // Construct scales and axes.
  const xScale = xType(d3.extent(xAxisValues) as [number, number], xRange);
  const yScale = yType([0, d3.max(yAxisValues)!], yRange);
  console.log("yScale", d3.max(yAxisValues));
  const logYScale = yType()
    .domain([0, d3.max(yAxisValues)!])
    .range(yRange);
  const renderXAxis: d3.Axis<d3.NumberValue> = d3
    .axisBottom(xScale)
    .ticks(width / 80)
    .tickSizeOuter(0);
  const renderYAxis: d3.Axis<d3.NumberValue> = d3
    .axisLeft(yScale)
    .ticks(height / 40);

  const series = Array.from(new Set(zAxisValues));
  const range = (length: number) => new Array(length).fill([]);

  const seriesYAxes: number[][] = series.map((foodType) => {
    let result: number[] = [];
    yAxisValues.map((value, valueIndex) => {
      if (zAxisValues[valueIndex] == foodType) {
        result.push(value);
      }
    });
    return result;
  });
  console.log(seriesYAxes);

  // Construct a line generator.
  const lines: d3.Line<[number, number]>[] = series.map((_foodType, index) => {
    return d3
      .line()
      .defined((_d: [number, number], i: number) => valuesExist[i])
      .curve(curve)
      .x((_d: [number, number], i: number) => {
        return xScale(xAxisValues[i]);
      })
      .y((_d: [number, number], i: number) => yScale(seriesYAxes[index][i]));
  });

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

  lines.map((line, index) => {
    svg
      .append("path")
      .attr("fill", "none")
      .attr("stroke", CSS_COLOR_NAMES[index])
      .attr("stroke-width", strokeWidth)
      .attr("stroke-linecap", strokeLinecap)
      .attr("stroke-linejoin", strokeLinejoin)
      .attr("stroke-opacity", strokeOpacity)
      .attr("d", line(sizeOfXAxis));
  });
  console.log(
    seriesYAxes,
    seriesYAxes.map((series) => series[series.length - 1])
  );
  svg
    .selectAll("text.label")
    .data(seriesYAxes.map((series) => series[series.length - 1]))
    .join("text")
    .attr("class", "label")
    .attr("x", width - marginRight + 5)
    .attr("y", (d) => yScale(d))
    .attr("dy", "0.35em")
    .style("fill", (d) => "black")
    .style("font-family", "sans-serif")
    .style("font-size", 12)
    .text((d, i) => series[i]);

  return svg.node();
}

let data: TimeSeriesDatum[] = [];
function keysOf<T>(object: T) {
  return Object.keys(object) as (keyof T)[];
}

keysOf(totalEmissions).map((foodType) => {
  keysOf(totalEmissions[foodType]).map((year) => {
    data.push({
      year: year,
      value: Math.round(Number(totalEmissions[foodType][year]) / 1000000000000),
      food: foodType,
    });
  });
});

console.log(data);

const chart = LineChart(data, {
  getXValues: (d) => Number(d.year),
  getYValues: (d) => d.value,
  getZValues: (d) => d.food,
  yLabel: "Btonnes CO2",
  width: document.querySelector("body")?.offsetWidth,
  height: 500,
  color: "steelblue",
});

if (chart) {
  document.getElementById("root")?.append(chart);
}
