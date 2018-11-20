/*
two-neurons-worm
This is a project for creating a worm that find it's food using only
two neurons:
https://phys.org/news/2018-07-reveals-complex-math-worms-food.html

Copyright (C) 2017  Luiz Eduardo Amaral - <luizamaral306@gmail.com>
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
"use strict";

/* Configuration */
const VERSION = "v1.0";
const WORM_WIDTH = 60;
const WORM_HEIGHT = 20;
const WORM_SCALE = 0.8;
const FOOD_WIDTH = 20;
const FOOD_HEIGHT = 20;
const FOOD_SCALE = 0.5;
const NUMBER_WORMS = 20;
const MAX_WORMS = 1000;
const NUMBER_FOOD = 100;
const MAX_FOOD = 1000;
const MAX_STEP = 5;
const MIN_AMMOUNT = 1;
const MAX_AMMOUNT = 50;
const EAT_DISTANCE = 20;
const TICK_TIME = 10;
const MAXITER = 50;
const MAX_MAXITER = 100000;
const MIN_MAXITER = 10;
const MIN_SPEED = 10;
const MAX_SPEED = 100000;
const PERCENTAGE_RANDOM_WORMS = 0.2;
const SOFT_BORDER = 20;
const worm_sprite_images_paths = [
  "./assets/worm-medium.svg", "./assets/worm-small.svg",
  "./assets/worm-medium.svg", "./assets/worm-large.svg",
];
const food_sprite_images_paths = [
  "./assets/food-1.svg", "./assets/food-2.svg",
  "./assets/food-1.svg", "./assets/food-3.svg"
];
let names = [];

let foodEaten = 0;
let numberOfGenerations = 0;
let pauseSimulation = true;
let stopSimulation = true;
let stopGeneration = false;
let eatenHistory;
let foodPerWormHistory;
let foods;
let worms;
let mainInterval;
let ticks = 0;
let ctx;

/* Main function */
function start() {
  let c = document.getElementById("main-canvas");
  c.width = CANVAS_SIZE;
  c.height = CANVAS_SIZE;
  ctx = c.getContext("2d");
  ctx.shadowBlur = SHADOW_BLUR;
  ctx.font = `${FONT_SIZE}px ${FONT_STYLE}`;

  loadJSON('./assets/names.json', response => {
    names = JSON.parse(response);
    reset();
  });
}




/* Functions */

/* Sigmoid activation function */
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

/* Distance of two vectors */
function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

/* Standard Normal variate using Box-Muller transform. */
function random_bm(mean, variance) {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return mean + Math.sqrt(variance * -2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/* Initialize random foods */
function randomFoods(number, food_sprite_images_paths) {
  let foods = [];
  for (let i = 0; i < number; i++) {
    let ammount = (Math.random() * (MAX_AMMOUNT - MIN_AMMOUNT)) + MIN_AMMOUNT;
    let factorX = FOOD_WIDTH * FOOD_SCALE * Math.log(ammount);
    let factorY = FOOD_HEIGHT * FOOD_SCALE * Math.log(ammount);
    let x = Math.random() * (CANVAS_SIZE - 2 * SOFT_BORDER) + SOFT_BORDER;
    let y = Math.random() * (CANVAS_SIZE - 2 * SOFT_BORDER) + SOFT_BORDER;
    let green = Math.floor(Math.random() * 127).toString(16);
    let blue = Math.floor(Math.random() * 255).toString(16);
    green = green.length == 2 ? green : "0" + green;
    blue = blue.length == 2 ? blue : "0" + blue;
    let color = "#FF" + green + blue;
    let food = new Food(x, y, ammount, food_sprite_images_paths, ctx, color);
    foods.push(food);
  }
  return foods;
}

/* Initialize random foods */
function randomWorms(number, worm_sprite_images_paths) {
  let worms = new Array(number).fill(0);
  return worms.map(() => createRandomWorm(worm_sprite_images_paths));
}


function createRandomWorm(worm_sprite_images_paths) {
  let x = Math.random() * (CANVAS_SIZE - 2 * SOFT_BORDER) + SOFT_BORDER;
  let y = Math.random() * (CANVAS_SIZE - 2 * SOFT_BORDER) + SOFT_BORDER;
  let stepSize = Math.random() * MAX_STEP;
  let azimuth = Math.random() * 2 * Math.PI;
  let weights = {
    b1: Math.random() * 2 - 1,
    w11: Math.random() * 2 - 1,
    w12: Math.random() * 2 - 1,
    b2: Math.random() * 2 - 1,
    w21: Math.random() * 2 - 1
  };
  let red = Math.floor(Math.random() * 255).toString(16);
  let blue = Math.floor(Math.random() * 127).toString(16);
  red = red.length == 2 ? red : "0" + red;
  blue = blue.length == 2 ? blue : "0" + blue;
  let color = `#${red}FF${blue}`;
  let firstName = names[Math.floor(Math.random() * names.length)].first_name;
  let lastName = names[Math.floor(Math.random() * names.length)].last_name;
  let worm = new Worm(x, y, weights, stepSize, azimuth, worm_sprite_images_paths, ctx, color, firstName, lastName, 0, numberOfGenerations);
  return worm;
}


/* Reproduce most fit worms */
function reproduceWorms(worms, worm_sprite_images_paths) {
  let number = worms.length;
  let newWorms = new Array(number).fill(0);
  let larvae = computeChildren(worms);
  newWorms = newWorms.map((_, index) => {
    return breedWorm(worms[larvae[index]], worm_sprite_images_paths);
  });
  return newWorms;
}

function computeChildren(worms) {
  let number = worms.length;

  worms = worms.filter(worm => worm.belly !== 0);
  worms.sort((a, b) => b.belly - a.belly);

  let totalFood = worms.reduce((acc, worm) => {
    acc += worm.belly;
    return acc;
  }, 0);
  let larvae = worms.reduce((acc, worm, index) => {
    let numberOfChildren = Math.ceil(worm.belly / totalFood * number);
    let children = new Array(numberOfChildren).fill(index);
    acc.push(...children);
    return acc;
  }, []).slice(0, Math.floor(number * (1 - PERCENTAGE_RANDOM_WORMS)));
  return larvae;
}

function breedWorm(worm, worm_sprite_images_paths) {
  if (worm === undefined) {
    return createRandomWorm(worm_sprite_images_paths);
  }

  let x = Math.random() * (CANVAS_SIZE - 2 * SOFT_BORDER) + SOFT_BORDER;
  let y = Math.random() * (CANVAS_SIZE - 2 * SOFT_BORDER) + SOFT_BORDER;
  let azimuth = Math.random() * 2 * Math.PI;

  let stepSize = worm.stepSize + random_bm(0, 1);
  stepSize = stepSize > MAX_STEP ? MAX_STEP : stepSize;
  stepSize = stepSize < 0 ? -stepSize : stepSize;

  let weights = {
    b1: worm.weights.b1 + random_bm(0, 0.5),
    w11: worm.weights.w11 + random_bm(0, 0.5),
    w12: worm.weights.w12 + random_bm(0, 0.5),
    b2: worm.weights.b2 + random_bm(0, 0.5),
    w21: worm.weights.w21 + random_bm(0, 0.5)
  };
  let color = worm.shadowColor;
  let red = (parseInt(color.slice(1, 3), 16) + Math.floor(random_bm(0, 10)) % 256).toString(16);
  let blue = (parseInt(color.slice(5), 16) + Math.floor(random_bm(0, 10)) % 256).toString(16);
  red = red.length == 2 ? red : "0" + red;
  blue = blue.length == 2 ? blue : "0" + blue;
  color = `#${red}FF${blue}`;
  let firstName = names[Math.floor(Math.random() * names.length)].first_name;
  let lastName = worm.lastName;
  let gen = worm.generation + 1;
  let ancestorGen = worm.ancestorGen;
  return new Worm(x, y, weights, stepSize, azimuth, worm_sprite_images_paths, ctx, color, firstName, lastName, gen, ancestorGen);
}

function runGeneration(foods, worms, maxiter) {
  let iter = 0;
  let totalWorms = worms.length;
  let totalFood = foods.length;
  let promise = new Promise(function(resolve) {
    mainInterval = setInterval(() => {
      if (pauseSimulation) {
        return;
      }
      iter++;
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      let eaten = [];
      worms.map(worm => {
        worm.think(foods);
        worm.move(worm.stepSize, worm.azimuth, [SOFT_BORDER, SOFT_BORDER, CANVAS_SIZE - SOFT_BORDER, CANVAS_SIZE - SOFT_BORDER]);
        eaten.push(...worm.eat(foods));
        worm.draw(worm.shadowColor);
      });
      foods = foods.filter(food => eaten.indexOf(food) === -1);
      foods.map(food => {
        food.draw(food.shadowColor);
      });
      if (iter > maxiter || foods.length == 0 || stopSimulation) {
        clearInterval(mainInterval);
        resolve(foods, worms);
      }
      drawTopWormsTable(worms);
      ticks++;
      let totalEaten = totalFood - foods.length;
      document.getElementById("elapsed-span").textContent = new Date(ticks * TICK_TIME).toUTCString().match(/\d{2}:\d{2}:\d{2}/);
      document.getElementById("total-worms-span").textContent = totalWorms;
      document.getElementById("total-food-span").textContent = totalFood;
      // document.getElementById("maxiter-span").textContent = MAXITER;
      document.getElementById("speed-span").textContent = (1/TICK_TIME)*100;
      document.getElementById("total-eaten-span").textContent = `${totalEaten}\t(${(100*totalEaten/totalFood).toFixed(2)}% - ${(totalEaten/totalWorms).toFixed(2)}a/w)`;
    }, TICK_TIME);
  });
  return promise;
}

function drawTopWormsTable(worms) {
  worms.sort((a, b) => b.belly - a.belly).slice(0, 5).map((worm, index) => {
    let firstName = worm.firstName;
    let lastName = worm.lastName;
    document.getElementById(`worm${index}-name`).parentElement.style.color = worm.shadowColor;
    document.getElementById(`worm${index}-name`).textContent = `${firstName} ${lastName} ${romanize(worm.generation) || ""}`;
    document.getElementById(`worm${index}-belly`).textContent = worm.belly;
    if (index == 0) {
      drawLegendInWorm(worm, `Glutton\n${worm.firstName} ${worm.lastName}`);
    }
  });
}

function drawLegendInWorm(worm, legend) {
  ctx.fillStyle = "#FFF";
  ctx.shadowColor = worm.shadowColor;
  ctx.beginPath();
  ctx.strokeStyle = "#FFF";
  ctx.lineWidth = 2;
  ctx.moveTo(worm.x, worm.y);
  let size = (FONT_SIZE - 8) * legend.split("\n")[legend.split("\n").length - 1].length;
  if (worm.x > CANVAS_SIZE - size - SOFT_BORDER) {
    ctx.lineTo(worm.x - 35, worm.y + 25);
    ctx.lineTo(worm.x - 200, worm.y + 25);
    ctx.stroke();
    legend.split("\n").reverse().map((text, index) => ctx.fillText(text, worm.x - size, worm.y + 20 - index * 25));
  } else {
    ctx.lineTo(worm.x + 35, worm.y + 25);
    ctx.lineTo(worm.x + 200, worm.y + 25);
    ctx.stroke();
    legend.split("\n").reverse().map((text, index) => ctx.fillText(text, worm.x + 35, worm.y + 20 - index * 25));
  }
}

function runGenerationAndLoop(foods, worms, worm_sprite_images_paths, food_sprite_images_paths) {
  document.getElementById("generation-span").textContent = "" + numberOfGenerations;
  var maxiter = parseInt(document.getElementById("maxiter-span").textContent);
  console.log(maxiter);
  runGeneration(foods, worms, maxiter).then((newFoods, newWorms) => {
    let wormsOld = worms.slice(0);
    let foodsOld = foods.slice(0);
    worms = reproduceWorms(worms, worm_sprite_images_paths);
    foods = randomFoods(foods.length, food_sprite_images_paths);
    drawAncestorTable(worms);
    eatenHistory.push((1 - newFoods.length / foods.length) * 100);
    foodPerWormHistory.push((foods.length - newFoods.length) / worms.length);
    plotPercentGraphs();
    if (stopGeneration) {
      drawStats(wormsOld, foodsOld);
      pause();
    }
    numberOfGenerations++;
    runGenerationAndLoop(foods, worms, worm_sprite_images_paths, food_sprite_images_paths);
  });
}

function resampleData(data, length) {
  // COMBAK: Improve the resampling!
  const sampler = fc.largestTriangleThreeBucket();
  sampler.x(d => d[0]);
  sampler.y(d => d[1]);
  sampler.bucketSize(data.length / length * 2);
  return sampler(data);
}


function plotLine(selector, data, width, height) {
  if (data.length > width/2) {
    data = data.slice(data.length-width/2, data.length);
  }
  let maxData = Math.max(...data);
  let minData = Math.min(...data);

  data = data.map((d, index) => [index, d]);

  // if (data.length > 2 * width) {
  //   data = resampleData(data, width);
  // }


  let x = d3.scaleLinear()
    .domain([0, data[data.length - 1][0]]).nice()
    .range([0, width]);
  let y = d3.scaleLinear()
    .domain([minData, maxData])
    .range([height, 0]);
  let area = d3.area()
    .x(d => x(d[0]))
    .y0(y(0))
    .y1(d => y(d[1]));
  let line = d3.line()
    .x(d => x(d[0]))
    .y(d => y(d[1]))

  let xAxis = g => g
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x)
      .ticks(4)
      .tickSizeInner(-5)
      .tickSizeOuter(0));

  let yAxis = g => g
    .call(
      d3.axisLeft(y)
      .ticks(4)
      .tickSizeInner(-5)
      .tickSizeOuter(0));
  d3.selectAll(`${selector} > svg`).remove();
  let svg = d3.select(selector)
    .append("svg")
    .attr("width", width)
    .attr("height", height);
  svg.append("path")
    .datum(data)
    .attr("fill", "#F00")
    .attr("opacity", "0.2")
    .attr("d", area);
  svg.append("path")
    .datum(data)
    .attr("stroke", "#F00")
    .attr("fill", "none")
    .attr("stroke-width", "2")
    .attr("opacity", "0.5")
    .attr("d", line);


  let xAxisObj = svg.append("g")
    .call(xAxis);
  xAxisObj.select("path").remove();
  xAxisObj.selectAll("text").attr("transform", `translate(0, -20)`);
  xAxisObj.select("g > text").attr("transform", `translate(10, -20)`);

  let yAxisObj = svg.append("g")
    .call(yAxis);
  yAxisObj.select("path").remove();
  yAxisObj.selectAll("text").attr("transform", `translate(20, 0)`);
  yAxisObj.select("g > text").remove();

  /* Glow effect
   * https://www.visualcinnamon.com/2016/06/glow-filter-d3-visualization.html
   */
  //Container for the gradients
  let defs = svg.append("defs");

  //Filter for the outside glow
  let filter = defs.append("filter")
    .attr("id", "glow");
  filter.append("feGaussianBlur")
    .attr("stdDeviation", "5")
    .attr("result", "coloredBlur");
  let feMerge = filter.append("feMerge");
  feMerge.append("feMergeNode")
    .attr("in", "coloredBlur");
  feMerge.append("feMergeNode")
    .attr("in", "SourceGraphic");
  d3.selectAll("path")
    .style("filter", "url(#glow)");
}

function drawStats(wormsOld, foods) {
  let frames = 20;
  let speed = 20;
  let totalFood = foods.length;

  let larvae = computeChildren(wormsOld);
  let eaten = wormsOld.reduce((acc, worm) => worm.belly + acc, 0);
  let totalWorms = wormsOld.length;
  let border = {
    x0: 50,
    x1: CANVAS_SIZE - 50,
    y0: 80,
    y1: 780
  };
  let wormsBorder = wormsOld.slice(0).filter(worm => !(worm.x > border.x0 && worm.x < border.x1 && worm.y > border.y0 && worm.y < border.y1));
  let foodsBorder = foods.slice(0).filter(food => !(food.x > border.x0 && food.x < border.x1 && food.y > border.y0 && food.y < border.y1));

  wormsOld = wormsOld.sort((a, b) => b.belly - a.belly).slice(0, 5).map((worm, index) => {
    let fx = CANVAS_SIZE / 2 - 250;
    let fy = (100 * index + 200);
    let slope = (fy - worm.y) / (fx - worm.x);
    worm.dx = (fx - worm.x) / 20;
    worm.dy = (slope * worm.dx);
    worm.children = larvae.filter(larva => larva == index).length;
    drawLegendInWorm(worm, `${worm.firstName} ${worm.lastName} ${romanize(worm.generation) || ""}`);
    return worm;
  });
  setTimeout(() => {
    for (let i = 0; i < 20; i++) {
      setTimeout((wormsOld) => {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        wormsOld.map((worm, index) => {
          worm.x += worm.dx;
          worm.y += worm.dy;
          worm.draw(worm.shadowColor);
          drawLegendInWorm(worm, `${worm.firstName} ${worm.lastName} ${romanize(worm.generation) || ""}`);
        });
      }, i * speed, wormsOld);
    }
  }, 500);
  setTimeout((wormsOld) => {
    wormsBorder.map(worm => worm.draw(worm.shadowColor));
    foodsBorder.map(food => food.draw(food.shadowColor));
    let ordinal = ["1st", "2nd", "3rd", "4th", "5th"];
    ctx.font = `50px ${FONT_STYLE}`;
    ctx.shadowColor = "#F00";
    ctx.fillText("Top Worms", 330, 100);
    ctx.font = `${FONT_SIZE}px ${FONT_STYLE}`;
    ctx.fillText(`${(100*eaten/totalFood).toFixed(2)}% apples eaten`, 190, 700);
    ctx.fillText(`${eaten/totalWorms} apples/worm`, 190, 740);
    ctx.fillText("apples", 570, 160);
    ctx.fillText("breed", 700, 160);
    wormsOld.forEach((worm, index) => {
      ctx.shadowColor = worm.shadowColor;
      ctx.fillText(ordinal[index], worm.x - 100, worm.y);
      ctx.fillText(`${worm.belly}`, worm.x + 410, worm.y);
      ctx.fillText(`${worm.children}`, worm.x + 530, worm.y);
    });
  }, 500 + speed * frames, wormsOld);
}

function drawAncestorTable(worms) {
  new Array(5).fill(0).map((_, index) => {
    document.getElementById(`ancestor${index}-name`).parentElement.style.color = "#FFF";
    document.getElementById(`ancestor${index}-name`).textContent = "";
    document.getElementById(`ancestor${index}-gen`).textContent = "";
    document.getElementById(`ancestor${index}-breed`).textContent = "";
  });
  Object.entries(worms
      .reduce((acc, worm) => {
        if (acc.hasOwnProperty(worm.lastName)) acc[worm.lastName].breed++;
        else acc[worm.lastName] = {
          breed: 1,
          ancestorGen: worm.ancestorGen,
          shadowColor: worm.shadowColor
        };
        return acc;
      }, {}))
    .sort((a, b) => b[1].breed - a[1].breed)
    .slice(0, 5)
    .map((worm, index) => {
      document.getElementById(`ancestor${index}-name`).parentElement.style.color = worm[1].shadowColor;
      document.getElementById(`ancestor${index}-name`).textContent = worm[0];
      document.getElementById(`ancestor${index}-gen`).textContent = worm[1].ancestorGen || "Pioneer";
      document.getElementById(`ancestor${index}-breed`).textContent = worm[1].breed;
    });
}

/* Thank yout Steve
http://blog.stevenlevithan.com/archives/javascript-roman-numeral-converter
*/
function romanize(num) {
  if (!+num)
    return false;
  let digits = String(+num).split(""),
    key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
      "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
      "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"
    ],
    roman = "",
    i = 3;
  while (i--)
    roman = (key[+digits.pop() + (i * 10)] || "") + roman;
  return Array(+digits.join("") + 1).join("M") + roman;
}

/* Thank yout Steve
http://blog.stevenlevithan.com/archives/javascript-roman-numeral-converter
*/
function deromanize(str) {
  str = str.toUpperCase();
  let validator = /^M*(?:D?C{0,3}|C[MD])(?:L?X{0,3}|X[CL])(?:V?I{0,3}|I[XV])$/,
    token = /[MDLV]|C[MD]?|X[CL]?|I[XV]?/g,
    key = {
      M: 1000,
      CM: 900,
      D: 500,
      CD: 400,
      C: 100,
      XC: 90,
      L: 50,
      XL: 40,
      X: 10,
      IX: 9,
      V: 5,
      IV: 4,
      I: 1
    },
    num = 0,
    m;
  if (!(str && validator.test(str)))
    return false;
  while (m = token.exec(str))
    num += key[m[0]];
  return num;
}

function play() {
  if (stopSimulation) {
    runGenerationAndLoop(foods, worms, worm_sprite_images_paths, food_sprite_images_paths);
  }
  pauseSimulation = false;
  stopSimulation = false;
}

function togglePlay() {
  document.querySelector(".play-pause-btn").classList.toggle("active-btn");
  if (pauseSimulation) play();
  else pause();
}

function toggleStop() {
  stopGeneration = !stopGeneration;
  document.querySelector(".stop-btn").classList.toggle("active-btn");
}

function pause() {
  pauseSimulation = true;
}

function reset() {
  document.getElementById("elapsed-span").textContent = "00:00:00";
  eatenHistory = [];
  foodPerWormHistory = [];
  stopSimulation = true;
  clearInterval(mainInterval);
  foods = randomFoods(NUMBER_FOOD, food_sprite_images_paths);
  worms = randomWorms(NUMBER_WORMS, worm_sprite_images_paths);
  play();
  setTimeout(pause, TICK_TIME);
}

function togglePercentGraphs() {
  document.querySelector('.graph-percent').classList.toggle('graph-apple');
  document.querySelectorAll('.toggle-eaten-graph').forEach(node => node.classList.toggle('hide'));
  plotPercentGraphs();
}

function plotPercentGraphs() {
  let width = 250;
  let height = 150;
  if (!document.querySelector(".eaten-graph-group").classList.contains("hide")) {
    if (document.querySelector(".graph-percent").classList.contains("graph-apple")) {
      plotLine(".eaten-graph", foodPerWormHistory, width, height);
    } else {
      plotLine(".eaten-graph", eatenHistory, width, height);
    }
  }
}

function updateGlobalSetting(id, ammount, lowerBound, upperBound) {
  let el = document.getElementById(id);
  let actualValue = parseInt(el.textContent);
  if (actualValue+ammount>lowerBound && actualValue+ammount<upperBound) el.textContent=actualValue+ammount;
}