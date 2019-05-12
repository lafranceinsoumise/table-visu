import * as d3 from "d3";
import { interpolateRdYlGn } from "d3-scale-chromatic";
import { transition } from "d3-transition";

import "./style.css";

const agreementColors = ["#f26026", "#64b736"];

const numberScale = d3.scaleSequential(interpolateRdYlGn).domain([0, 1]);
const agreementScale = d3.scaleOrdinal(agreementColors).domain([0, 1]);
const grey = "#888";

const MAX_SIZE = 400;
const GROUP_MARGIN = 10;

function legendNumber(div) {
  div.attr("class", "legendNumber");
  const left = div.append("div").attr("class", "left");
  const right = div
    .append("div")
    .attr("class", "right")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("justify-content", "space-between");

  const upper = right.append("div").text("D'accord");

  const lower = right.append("div").text("Pas d'accord");

  const canvas = left.append("canvas");
  const ctx = canvas.node().getContext("2d");

  const height = 160;

  canvas
    .attr("height", height)
    .attr("width", 1)
    .style("height", height + "px")
    .style("width", "30px")
    .style("border", "1px solid black");

  ctx.clearRect(0, 0, 1, height);

  const legendScale = d3
    .scaleLinear()
    .range([0, height])
    .domain(numberScale.domain());

  const image = ctx.createImageData(1, height);

  d3.range(height).forEach(function(i) {
    const c = d3.rgb(numberScale(legendScale.invert(height - i)));
    image.data[4 * i] = c.r;
    image.data[4 * i + 1] = c.g;
    image.data[4 * i + 2] = c.b;
    image.data[4 * i + 3] = 255;
  });

  ctx.putImageData(image, 0, 0);
}

function legendBoolean(div) {
  const consensus = div.append("div");
  const desaccord = div.append("div");

  desaccord
    .append("div")
    .attr("class", "case")
    .style("background-color", agreementColors[0]);
  consensus
    .append("div")
    .attr("class", "case")
    .style("background-color", agreementColors[1]);

  desaccord.append("span").text("Pas de consensus");
  consensus.append("span").text("Consensus atteint");
}

function Legend(div) {
  let current = null;

  return function refresh(data) {
    if (data.type !== current) {
      current = data.type;

      if (div.node().firstChild) {
        div.node().firstChild.remove();
      }

      if (current === "number") {
        legendNumber(div.append("div"));
      } else {
        legendBoolean(div.append("div"));
      }
    }
  };
}

function Groups(div) {
  const knownGroups = [];

  return function refresh(data) {
    const colorScale = data.type === "number" ? numberScale : agreementScale;

    const groupKeys = Object.keys(data.groups);

    for (let g of groupKeys) {
      if (!knownGroups.includes(g)) {
        knownGroups.push(g);
      }
    }

    const size = div.node().getBoundingClientRect();
    const numbers = groupKeys.length;

    let side = Math.min(
      Math.floor(
        Math.sqrt(
          ((size.width - GROUP_MARGIN) * (size.height - GROUP_MARGIN)) / numbers
        )
      ),
      MAX_SIZE
    );

    while (
      Math.floor((size.width - GROUP_MARGIN) / side) *
        Math.floor((size.height - GROUP_MARGIN) / side) <
      numbers
    ) {
      side -= 1;
    }

    side -= GROUP_MARGIN;

    const groups = div
      .selectAll(".group")
      .data(knownGroups.map(k => ({ group: k, value: data.groups[k] })));

    const t = transition().duration(750);

    groups
      .enter()
      .append("div")
      .text(d => d.group)
      .attr("class", "group")
      .merge(groups)
      .style("width", `${side}px`)
      .style("height", `${side}px`)
      .style("line-height", `${side}px`)
      .transition(t)
      .style("background-color", d =>
        d.value !== undefined ? numberScale(d.value) : grey
      )
      .style("color", d =>
        d.value !== undefined
          ? d.value > 0.3 && d.value < 0.7
            ? "black"
            : "white"
          : "black"
      );

    groups.exit().remove();
  };
}

function setUp(groupsDiv, legendDiv) {
  const groups = Groups(groupsDiv);
  const legend = Legend(legendDiv);
  let refresher;

  window.addEventListener("resize", function() {
    if (refresher) {
      refresher();
    }
  });

  function refresh(data) {
    groups(data);
    legend(data);
  }

  async function fetchData() {
    const res = await fetch(
      process.env.NODE_ENV === "production"
        ? "/json"
        : "http://localhost:8000/json"
    );
    const data = await res.json();

    refresh(data);
    refresher = () => refresh(data);
  }

  setInterval(fetchData, 5000);
  fetchData();
}

function main() {
  const content = d3
    .select("body")
    .append("div")
    .attr("class", "content");

  const groupsDiv = content.append("div").attr("class", "groups");
  const legendDiv = content.append("div").attr("class", "legend");
  setUp(groupsDiv, legendDiv);

  const link = d3
    .select("body")
    .append("div")
    .attr("class", "link")
    .text("la-fi.fr/convention2018");
}

main();
