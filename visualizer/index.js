import * as d3 from 'd3'
import { interpolateRdYlGn, schemeRdBu } from 'd3-scale-chromatic'

import './svg.css'
import rawTableCoords from './data.json'

const tableCoords = Object.entries(rawTableCoords).map(([table, coordinates]) => ({
  table,
  x: Math.round(coordinates[0]),
  y: Math.round(coordinates[1])
}))

const rectW = 127
const otherRectH = 50
const rect1C = [772, 805]
const rect2C = [1367, 805]

const rects = [
  [...rect1C, rect1C[0] + rectW, rect1C[1] + rectW],
  [...rect2C, rect2C[0] + rectW, rect2C[1] + rectW],
  [rect1C[0] + rectW, rect1C[1] + rectW / 2 - otherRectH / 2, rect2C[0], rect1C[1] + rectW / 2 + otherRectH / 2]
]

const defaultMargin = 60

const margin = {
  top: defaultMargin,
  right: defaultMargin,
  bottom: defaultMargin,
  left: defaultMargin
}

const agreementColors = ['#f26026', '#64b736']

const numberScale = d3.scaleSequential(interpolateRdYlGn).domain([0, 1])
const agreementScale = d3.scaleOrdinal(agreementColors).domain([0, 1])
const grey = '#888'

function Table (g, tableCoords, data) {

  const circleGroup = g.append('g')
  const textGroup = g.append('g')
  const sceneGroup = g.append('g')

  return function refresh (data) {
    const dimensions = [0.8 * window.innerWidth - margin.left - margin.right, window.innerHeight - margin.top - margin.bottom]
    const joinedData = tableCoords.map(d => Object.assign({ value: data[d.table] }, d))

    const circles = circleGroup
      .selectAll('circle')
      .data(joinedData)

    const text = textGroup
      .selectAll('text')
      .data(joinedData)

    const scene = sceneGroup
      .selectAll('rect')
      .data(rects)

    const xScale = d3.scaleLinear().range([0, dimensions[0]])
      .domain(d3.extent(tableCoords.map(d => d.x)))

    const yScale = d3.scaleLinear().range([0, dimensions[1]])
      .domain(d3.extent(tableCoords.map(d => d.y)))

    const colorScale = data.type === 'number' ? numberScale : agreementScale

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
      .attr('fill', d => d.value !== undefined ? colorScale(d.value) : grey)

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

    scene.enter()
      .append('rect')
      .attr('fill', 'none')
      .attr('stroke', 'blue')
      .attr('stroke-width', 5)
      .merge(scene)
      .attr('x', d => xScale(d[0]))
      .attr('y', d => yScale(d[1]))
      .attr('width', d => xScale(d[2]) - xScale(d[0]))
      .attr('height', d => yScale(d[3]) - yScale(d[1]))
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
      .domain(numberScale.domain())

    const image = ctx.createImageData(width, 1)

    d3.range(width).forEach(function (i) {
      var c = d3.rgb(numberScale(legendScale.invert(i)))
      image.data[4 * i] = c.r
      image.data[4 * i + 1] = c.g
      image.data[4 * i + 2] = c.b
      image.data[4 * i + 3] = 255
    })

    ctx.putImageData(image, 0, 0)
  }
}

function Groups (div) {
  const knownGroups = []

  div.append('h3').text('Les groupes à distance')
  const container = div.append('div').attr('class', 'groups')

  return function refresh (data) {
    const colorScale = data.type === 'number' ? numberScale : agreementScale

    const groupKeys = Object.keys(data).filter(k => k[0] === 'G')

    for (let g of groupKeys) {
      if (!knownGroups.includes(g)) {
        knownGroups.push(g)
      }
    }

    const groups = container.selectAll('.group')
      .data(knownGroups.map(k => ({ group: k, value: data[k] })))

    groups.enter()
      .append('div')
      .attr('class', 'group')
      .merge(groups)
      .style('background-color', d => d.value ? numberScale(d.value) : grey)
      .style('color', d => d.value ? (d.value > 0.3 && d.value < 0.7 ? 'black' : 'white') : 'black')
  }
}

function setUp (tableGroup, legendGroup, groupGroup) {
  const table = Table(tableGroup, tableCoords)
  const legend = Legend(legendGroup)
  //const group = Groups(groupGroup)
  let refresher

  window.addEventListener('resize', function () {
    if (refresher) {
      refresher()
    }
  })

  function refresh (data) {
    table(data)
    legend()
    //group(data)
  }

  async function fetchData () {
    const res = await fetch(process.env.NODE_ENV === 'production' ? '/json' : 'http://localhost:8000/json')
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
  const groupGroup = div.append('div')
  setUp(tables, legendGroup, groupGroup)
}

main()
