import * as d3 from "d3";
import { interpolateRdYlGn } from "d3-scale-chromatic";
import { transition } from "d3-transition";

import "./style.css";

const agreementColors = ["#f26026", "#64b736"];

const numberScale = d3.scaleSequential(interpolateRdYlGn).domain([0, 1]);
const agreementScale = d3.scaleOrdinal(agreementColors).domain([0, 1]);
const ratioScale = d3
  .scaleLinear()
  .domain([1, 30])
  .range([0.05, 0.35])
  .clamp(true);

const grey = "#888";

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

function Groups(svg) {
  const g = svg.append("g");
  let oldNumber = 0;
  let oldRadius = 0;

  const force = d3
    .forceSimulation()
    .force("center-x", d3.forceX(0).strength(0.05))
    .force("center-y", d3.forceY(0).strength(0.08))
    .alphaDecay(0.1)
    .alphaTarget(0.1);

  const nodes = [];
  const knownGroups = new Set();

  force.on("tick", function() {
    console.log("tick");
    g.selectAll("circle")
      .data(this.nodes())
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  });

  return function refresh(data) {
    const colorScale = data.type === "number" ? numberScale : agreementScale;

    const groupKeys = Object.keys(data.groups);

    const size = svg.node().getBoundingClientRect();
    const number = groupKeys.length;

    // new data
    for (let key of groupKeys) {
      if (!knownGroups.has(key)) {
        knownGroups.add(key);

        const angle = Math.random() * 2 * Math.PI;
        nodes.push({
          group: key,
          x: 1.5 * Math.max(size.width, size.height) * Math.cos(angle),
          y: 1.5 * Math.min(size.width, size.height) * Math.sin(angle)
        });
      }
    }

    g.attr("transform", `translate(${size.width / 2},${size.height / 2})`);

    const radius = Math.sqrt(
      (size.width * size.height * ratioScale(number)) / number / Math.PI
    );

    const groups = g
      .selectAll("circle")
      .data(groupKeys.map(k => ({ group: k, value: data.groups[k] })));

    const t = transition().duration(750);

    groups
      .enter()
      .append("circle")
      .attr("fill-opacity", 0)
      .attr("fill", d => (d.value !== undefined ? colorScale(d.value) : grey))
      .attr("r", 1)
      .merge(groups)
      .transition(t)
      .attr("r", radius)
      .attr("fill", d => (d.value !== undefined ? colorScale(d.value) : grey))
      .attr("fill-opacity", 1);

    groups.exit().remove();

    if (radius !== oldRadius || number !== oldNumber) {
      force.nodes(nodes);
      force.force("charge", d3.forceCollide(radius * 1.1));
    }
    oldRadius = radius;
    oldNumber = number;
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

  const groupsElem = content.append("svg").attr("class", "groups");
  const legendDiv = content.append("div").attr("class", "legend");
  setUp(groupsElem, legendDiv);
}

main();
