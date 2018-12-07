import * as d3 from 'd3'
import { interpolateRdYlGn } from 'd3-scale-chromatic'

import './svg.css'
import rawTableCoords from './data.json'

const tableCoords = Object.entries(rawTableCoords).map(([table, coordinates]) => ({
  table,
  x: coordinates[0],
  y: coordinates[1]
}))

const defaultMargin = 60

const margin = {
  top: defaultMargin,
  right: defaultMargin,
  bottom: defaultMargin,
  left: defaultMargin
}

function Table (g, tableCoords, data) {

  return function refresh (data) {
    const dimensions = [0.8 * window.innerWidth - margin.left - margin.right, window.innerHeight - margin.top - margin.bottom]
    const joinedData = tableCoords.map(d => Object.assign({ value: data[d.table] }, d))

    const circles = g
      .selectAll('circle')
      .data(joinedData)

    const text = g
      .selectAll('text')
      .data(joinedData)

    const xScale = d3.scaleLinear().range([0, dimensions[0]])
      .domain(d3.extent(tableCoords.map(d => d.x)))

    const yScale = d3.scaleLinear().range([0, dimensions[1]])
      .domain(d3.extent(tableCoords.map(d => d.y)))

    const colorScale = d3.scaleSequential(interpolateRdYlGn).domain([0, 1])

    circles.enter()
      .append('circle')
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .merge(circles)
      .attr('r', 28)
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .transition()
      .duration(1000)
      .attr('fill', d => d.value ? colorScale(d.value) : '#888')

    text.enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('dy', '.3em')
      .merge(text)
      .attr('x', d => xScale(d.x))
      .attr('y', d => yScale(d.y))
      .text(d => d.table)
      .transition()
      .duration(1000)
      .attr('fill', d => d.value ? (d.value > 0.3 && d.value < 0.7 ? 'black' : 'white') : 'black')
  }
}

function Legend (div) {
  const upper = div.append('div')
    .text('Pas d\'accord')
    .style('text-align', 'left')

  const canvas = div.append('canvas')
  const ctx = canvas.node().getContext('2d')

  const lower = div.append('div')
    .text('D\'accord')
    .style('text-align', 'right')

  const colorScale = d3.scaleSequential(interpolateRdYlGn).domain([0, 1])

  return function refresh () {
    const width = 0.2 * window.innerWidth - 40

    canvas.attr('height', 1)
      .attr('width', width)
      .style('height', '40px')
      .style('width', width + 'px')
      .style('border', '1px solid black')

    ctx.clearRect(0, 0, width, 1)

    const legendScale = d3.scaleLinear()
      .range([0, width])
      .domain(colorScale.domain())

    const image = ctx.createImageData(width, 1)

    d3.range(width).forEach(function (i) {
      var c = d3.rgb(colorScale(legendScale.invert(i)))
      image.data[4 * i] = c.r
      image.data[4 * i + 1] = c.g
      image.data[4 * i + 2] = c.b
      image.data[4 * i + 3] = 255
    })

    ctx.putImageData(image, 0, 0)
  }
}

function setUp (tableGroup, legendGroup) {
  const table = Table(tableGroup, tableCoords, data)
  const legend = Legend(legendGroup)
  let refresher

  window.addEventListener('resize', function () {
    if (refresher) {
      refresher()
    }
  })

  function refresh (data) {
    table(data)
    legend()
  }

  async function fetchData () {
    const res = await fetch('http://localhost:8000/json')
    const data = await res.json()

    refresh(data)
    refresher = () => refresh(data)
  }

  setInterval(fetchData, 5000)
  fetchData()
}

function main () {
  const svg = d3.select('body').append('svg').attr('class', 'main').attr('shape-rendering', 'geometricPrecision')
  const div = d3.select('body').append('div').attr('class', 'sidebar')
  const tables = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
  const legendGroup = div.append('div')
  setUp(tables, legendGroup, data)
}

main()
