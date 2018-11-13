/*
two-neurons-worm
This is an attempt of creating a worm that find it's food using only
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
const CANVAS_SIZE = 900;
const SHADOW_BLUR = 5;
const WORM_WIDTH = 60;
const WORM_HEIGHT = 20;
const WORM_SCALE = 0.8;
const FOOD_WIDTH = 20;
const FOOD_HEIGHT = 20;
const FOOD_SCALE = 0.5;
const NUMBER_WORMS = 20;
const NUMBER_FOOD = 100;
const MAX_STEP = 5;
const MIN_AMMOUNT = 1;
const MAX_AMMOUNT = 50;
const EAT_DISTANCE = 20;
const TICK_TIME = 50;
const GENERATION_MAXITER = 500;
const PERCENTAGE_RANDOM_WORMS = 0.1;
const SOFT_BORDER = 20;
const FONT_STYLE = "monospace";
const FONT_SIZE = 26;
const worm_sprite_images_paths = [
  "./assets/worm-medium.svg", "./assets/worm-small.svg",
  "./assets/worm-medium.svg", "./assets/worm-large.svg",
];
const food_sprite_images_paths = [
  "./assets/food-1.svg", "./assets/food-2.svg",
  "./assets/food-1.svg", "./assets/food-3.svg"
];
var names = [];

var foodEaten = 0;
var numberOfGenerations = 0;
var pauseSimulation = true;
var stopSimulation = true;
var stopGeneration = false;
var foods;
var worms;
var mainInterval;
var ticks = 0;
var ctx;

/* Main function */
function start() {
  var c = document.getElementById("main-canvas");
  c.width = CANVAS_SIZE;
  c.height = CANVAS_SIZE;
  ctx = c.getContext("2d");
  ctx.shadowBlur = SHADOW_BLUR;
  ctx.font = `${FONT_SIZE}px ${FONT_STYLE}`;

  loadJSON('./assets/names.json', response => {
    names = JSON.parse(response);
    reset();
    play();
    // setTimeout(pause, TICK_TIME);
  });
}

/* Classes */
class Worm {
  constructor(x, y, weights, stepSize, azimuth, sprite_images_paths, ctx,
    shadowColor, firstName, lastName, generation, ancestorGen) {
    this.x = x;
    this.y = y;
    this.stepSize = stepSize;
    this.azimuth = azimuth;
    this.index = 0;
    this.sprite_images = sprite_images_paths.map(path => {
      var img = new Image();
      img.src = path;
      return img;
    });
    this.ctx = ctx;
    this.shadowColor = shadowColor;
    this.memory = 0;
    this.weights = weights;
    this.firstName = firstName;
    this.lastName = lastName;
    this.generation = generation || 0;
    this.ancestorGen = ancestorGen || 0;
    this.belly = 0;
    this.sizeX = WORM_WIDTH * (Math.random() * 0.2 + 0.9);
    this.sizeY = WORM_HEIGHT * (Math.random() * 0.2 + 0.9);
  }

  move(stepSize, azimuth, borders) {
    var newX = this.x + stepSize * Math.cos(azimuth);
    var newY = this.y + stepSize * Math.sin(azimuth);
    if (newX > borders[0] & newX < borders[2] &
      newY > borders[1] & newY < borders[3]) {
      this.y = newY;
      this.x = newX;
    }
  }

  sniff(foods) {
    return foods
      .map(food => food.scent(this.x, this.y))
      .reduce((acc, cur) => acc + cur, 0);
  }

  /**
   * This is the neural network
   */
  think(foods) {
    var scent = this.sniff(foods);
    var output = this.neuron1(scent, this.memory);
    this.neuron2(scent);

    if (output < 0.5) {
      // If neuron1 is active, search in a new direction
      this.azimuth += (Math.random() - 0.5) * Math.PI / 2;
    } else {
      // Otherwise keep on going
      this.stepSize = output * MAX_STEP;
    }
  }

  /**
   * This (sigmoid) neuron can compute the gradient of the scent
   */
  neuron1(input, memory) {
    return sigmoid(input * this.weights.w11 + memory * this.weights.w12 + this.weights.b1);
  }

  /**
   * This is the memory (linear) neuron that knows the previous scent
   */
  neuron2(input) {
    var memory = this.memory;
    this.memory = input * this.weights.w21 + this.weights.b2;
  }

  eat(foods) {
    return foods.reduce((acc, cur) => {
      if (distance(this.x, this.y, cur.x, cur.y) < EAT_DISTANCE) {
        acc.push(cur);
        this.belly++;
        this.sizeX *= 1.05;
        this.sizeY *= 1.05;
      }
      return acc;
    }, []);
  }

  draw(shadowColor) {
    this.ctx.save();
    this.ctx.shadowColor = shadowColor;
    this.ctx.rotate(this.azimuth);
    this.ctx.translate(this.x * Math.cos(this.azimuth) + this.y * Math.sin(this.azimuth), -this.x * Math.sin(this.azimuth) + this.y * Math.cos(this.azimuth));
    this.ctx.drawImage(this.sprite_images[this.index], -this.sizeX / 2, -this.sizeY / 2, this.sizeX, this.sizeY);
    this.ctx.restore();

    this.index += Math.floor((Math.random() * (Math.log2(this.stepSize) + 2))) > 0;
    this.index %= this.sprite_images.length;
  }
}


class Food {
  constructor(x, y, ammount, sprite_images_paths, ctx, shadowColor) {
    this.x = x;
    this.y = y;
    this.ammount = ammount;
    this.index = 0;
    this.sprite_images = sprite_images_paths.map(path => {
      var img = new Image();
      img.src = path;
      return img;
    });
    this.ctx = ctx;
    this.shadowColor = shadowColor;
    this.sizeX = FOOD_WIDTH * FOOD_SCALE * Math.log(this.ammount);
    this.sizeY = FOOD_HEIGHT * FOOD_SCALE * Math.log(this.ammount);
  }

  scent(x, y) {
    var r2 = Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2);
    return this.ammount / r2;
  }

  draw(shadowColor) {
    this.ctx.shadowColor = shadowColor;
    this.ctx.drawImage(this.sprite_images[this.index], this.x - this.sizeX / 2, this.y - this.sizeY / 2, this.sizeX, this.sizeY);
    this.index += Math.floor((Math.random() * 5)) > 0;
    this.index %= this.sprite_images.length;
  }
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
  var u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return mean + Math.sqrt(variance * -2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/* Initialize random foods */
function randomFoods(number, food_sprite_images_paths) {
  var foods = [];
  for (var i = 0; i < number; i++) {
    var ammount = (Math.random() * (MAX_AMMOUNT - MIN_AMMOUNT)) + MIN_AMMOUNT;
    var factorX = FOOD_WIDTH * FOOD_SCALE * Math.log(ammount);
    var factorY = FOOD_HEIGHT * FOOD_SCALE * Math.log(ammount);
    var x = Math.random() * (CANVAS_SIZE-2*SOFT_BORDER) + SOFT_BORDER;
    var y = Math.random() * (CANVAS_SIZE-2*SOFT_BORDER) + SOFT_BORDER;
    var green = Math.floor(Math.random() * 127).toString(16);
    var blue = Math.floor(Math.random() * 255).toString(16);
    green = green.length == 2 ? green : "0" + green;
    blue = blue.length == 2 ? blue : "0" + blue;
    var color = "#FF" + green + blue;
    var food = new Food(x, y, ammount, food_sprite_images_paths, ctx, color);
    foods.push(food);
  }
  return foods;
}

/* Initialize random foods */
function randomWorms(number, worm_sprite_images_paths) {
  var worms = new Array(number).fill(0);
  return worms.map(() => createRandomWorm(worm_sprite_images_paths));
}


function createRandomWorm(worm_sprite_images_paths) {
  var x = Math.random() * (CANVAS_SIZE-2*SOFT_BORDER) + SOFT_BORDER;
  var y = Math.random() * (CANVAS_SIZE-2*SOFT_BORDER) + SOFT_BORDER;
  var stepSize = Math.random() * MAX_STEP;
  var azimuth = Math.random() * 2 * Math.PI;
  var weights = {
    b1: Math.random() * 2 - 1,
    w11: Math.random() * 2 - 1,
    w12: Math.random() * 2 - 1,
    b2: Math.random() * 2 - 1,
    w21: Math.random() * 2 - 1
  };
  var red = Math.floor(Math.random() * 255).toString(16);
  var blue = Math.floor(Math.random() * 127).toString(16);
  red = red.length == 2 ? red : "0" + red;
  blue = blue.length == 2 ? blue : "0" + blue;
  var color = `#${red}FF${blue}`;
  var firstName = names[Math.floor(Math.random() * names.length)].first_name;
  var lastName = names[Math.floor(Math.random() * names.length)].last_name;
  var worm = new Worm(x, y, weights, stepSize, azimuth, worm_sprite_images_paths, ctx, color, firstName, lastName, 0, numberOfGenerations);
  return worm;
}


/* Reproduce most fit worms */
function reproduceWorms(worms, worm_sprite_images_paths) {
  var number = worms.length;
  var newWorms = new Array(number).fill(0);
  var larvae = computeChildren(worms);
  newWorms = newWorms.map((_, index) => {
    return breedWorm(worms[larvae[index]], worm_sprite_images_paths);
  });
  return newWorms;
}

function computeChildren(worms) {
  var number = worms.length;

  worms = worms.filter(worm => worm.belly !== 0);
  worms.sort((a, b) => b.belly - a.belly);

  var totalFood = worms.reduce((acc, worm) => {
    acc += worm.belly;
    return acc;
  }, 0);
  var larvae = worms.reduce((acc, worm, index) => {
    var numberOfChildren = Math.ceil(worm.belly / totalFood * number);
    var children = new Array(numberOfChildren).fill(index);
    acc.push(...children);
    return acc;
  }, []).slice(0, Math.floor(number * (1-PERCENTAGE_RANDOM_WORMS)));
  return larvae;
}

function breedWorm(worm, worm_sprite_images_paths) {
  if (worm === undefined) {
    return createRandomWorm(worm_sprite_images_paths);
  }

  var x = Math.random() * (CANVAS_SIZE-2*SOFT_BORDER) + SOFT_BORDER;
  var y = Math.random() * (CANVAS_SIZE-2*SOFT_BORDER) + SOFT_BORDER;
  var azimuth = Math.random() * 2 * Math.PI;

  var stepSize = worm.stepSize + random_bm(0, 1);
  stepSize = stepSize > MAX_STEP ? MAX_STEP : stepSize;
  stepSize = stepSize < 0 ? -stepSize : stepSize;

  var weights = {
    b1: worm.weights.b1 + random_bm(0, 0.5),
    w11: worm.weights.w11 + random_bm(0, 0.5),
    w12: worm.weights.w12 + random_bm(0, 0.5),
    b2: worm.weights.b2 + random_bm(0, 0.5),
    w21: worm.weights.w21 + random_bm(0, 0.5)
  };
  var color = worm.shadowColor;
  var red = (parseInt(color.slice(1, 3), 16) + Math.floor(random_bm(0, 10)) % 256).toString(16);
  var blue = (parseInt(color.slice(5), 16) + Math.floor(random_bm(0, 10)) % 256).toString(16);
  red = red.length == 2 ? red : "0" + red;
  blue = blue.length == 2 ? blue : "0" + blue;
  color = `#${red}FF${blue}`;
  var firstName = names[Math.floor(Math.random() * names.length)].first_name;
  var lastName = worm.lastName;
  var gen = worm.generation + 1;
  var ancestorGen = worm.ancestorGen;
  return new Worm(x, y, weights, stepSize, azimuth, worm_sprite_images_paths, ctx, color, firstName, lastName, gen, ancestorGen);
}

function runGeneration(foods, worms, maxiter) {
  var iter = 0;
  var totalWorms = worms.length;
  var totalFood = foods.length;
  var promise = new Promise(function(resolve) {
    mainInterval = setInterval(() => {
      if (pauseSimulation) {
        return;
      }
      iter++;
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      var eaten = [];
      worms.map(worm => {
        worm.think(foods);
        worm.move(worm.stepSize, worm.azimuth, [SOFT_BORDER, SOFT_BORDER, CANVAS_SIZE-SOFT_BORDER, CANVAS_SIZE-SOFT_BORDER]);
        eaten.push(...worm.eat(foods));
        worm.draw(worm.shadowColor);
      });
      foods = foods.filter(food => eaten.indexOf(food) === -1);
      foods.map(food => {
        food.draw(food.shadowColor);
      });
      if (iter > maxiter || foods.length == 0 || stopSimulation) {
        clearInterval(mainInterval);
        resolve();
      }
      drawTopWormsTable(worms);
      ticks++;
      var totalEaten = totalFood - foods.length;
      document.getElementById("elapsed-span").textContent = new Date(ticks * TICK_TIME).toUTCString().match(/\d{2}:\d{2}:\d{2}/);
      document.getElementById("total-worms-span").textContent = totalWorms;
      document.getElementById("total-food-span").textContent = totalFood;
      document.getElementById("total-eaten-span").textContent = `${totalEaten}\t(${(100*totalEaten/totalFood).toFixed(2)}% - ${(totalEaten/totalWorms).toFixed(2)}a/w)`;
    }, TICK_TIME);
  });
  return promise;
}

function drawTopWormsTable(worms) {
  worms.sort((a, b) => b.belly - a.belly).slice(0, 5).map((worm, index) => {
    var firstName = worm.firstName;
    var lastName = worm.lastName;
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
  var size = (FONT_SIZE-8)*legend.split("\n")[legend.split("\n").length-1].length;
  if (worm.x>CANVAS_SIZE-size-SOFT_BORDER) {
    ctx.lineTo(worm.x - 35, worm.y + 25);
    ctx.lineTo(worm.x - 200, worm.y + 25);
    ctx.stroke();
    legend.split("\n").reverse().map((text, index) => ctx.fillText(text, worm.x-size, worm.y+20-index*25));
  } else {
    ctx.lineTo(worm.x + 35, worm.y + 25);
    ctx.lineTo(worm.x + 200, worm.y + 25);
    ctx.stroke();
    legend.split("\n").reverse().map((text, index) => ctx.fillText(text, worm.x+35, worm.y+20-index*25));
  }
}

function runGenerationAndLoop(foods, worms, worm_sprite_images_paths, food_sprite_images_paths) {
  document.getElementById("generation-span").textContent = "" + numberOfGenerations;
  runGeneration(foods, worms, GENERATION_MAXITER).then(() => {
    var wormsOld = worms.slice(0);
    var foodsOld = foods.slice(0);
    worms = reproduceWorms(worms, worm_sprite_images_paths);
    foods = randomFoods(foods.length, food_sprite_images_paths);
    drawAncestorTable(worms);
    if (stopGeneration) {
      drawStats(wormsOld, foodsOld);
      pause();
    }
    numberOfGenerations++;
    runGenerationAndLoop(foods, worms, worm_sprite_images_paths, food_sprite_images_paths);
  });
}

function drawStats(wormsOld, foods) {
  var frames = 20;
  var speed = 20;
  var totalFood = foods.length;

  var larvae = computeChildren(wormsOld);
  var eaten = wormsOld.reduce((acc, worm) => worm.belly+acc, 0);
  var totalWorms = wormsOld.length;
  var border =  {
    x0: 50,
    x1: CANVAS_SIZE-50,
    y0: 80,
    y1: 780
  };
  var wormsBorder = wormsOld.slice(0).filter(worm => !(worm.x>border.x0 && worm.x<border.x1 && worm.y>border.y0 && worm.y<border.y1));
  var foodsBorder = foods.slice(0).filter(food => !(food.x>border.x0 && food.x<border.x1 && food.y>border.y0 && food.y<border.y1));

  wormsOld = wormsOld.sort((a, b) => b.belly-a.belly).slice(0, 5).map((worm, index) => {
    var fx = CANVAS_SIZE/2-250;
    var fy = (100*index + 200);
    var slope = (fy - worm.y)/(fx - worm.x);
    worm.dx = (fx-worm.x)/20;
    worm.dy = (slope*worm.dx);
    worm.children = larvae.filter(larva => larva==index).length;
    drawLegendInWorm(worm, `${worm.firstName} ${worm.lastName} ${romanize(worm.generation) || ""}`);
    return worm;
  });
  setTimeout(() => {
    for (var i=0; i<20; i++) {
      setTimeout((wormsOld) => {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        wormsOld.map((worm, index) => {
          worm.x += worm.dx;
          worm.y += worm.dy;
          worm.draw(worm.shadowColor);
          drawLegendInWorm(worm, `${worm.firstName} ${worm.lastName} ${romanize(worm.generation) || ""}`);
        });
      }, i*speed, wormsOld);
    }
  }, 500);
  setTimeout((wormsOld)=> {
    wormsBorder.map(worm => worm.draw(worm.shadowColor));
    foodsBorder.map(food => food.draw(food.shadowColor));
    var ordinal = ["1st", "2nd", "3rd", "4th", "5th"];
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
      ctx.fillText(ordinal[index], worm.x-100, worm.y);
      ctx.fillText(`${worm.belly}`, worm.x+410, worm.y);
      ctx.fillText(`${worm.children}`, worm.x+530, worm.y);
    });
  }, 500+speed*frames, wormsOld);
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


function loadJSON(uri, callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', uri, true);
  xobj.onreadystatechange = function() {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

/* Thank yout Steve
http://blog.stevenlevithan.com/archives/javascript-roman-numeral-converter
*/
function romanize(num) {
  if (!+num)
    return false;
  var digits = String(+num).split(""),
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
  var str = str.toUpperCase(),
    validator = /^M*(?:D?C{0,3}|C[MD])(?:L?X{0,3}|X[CL])(?:V?I{0,3}|I[XV])$/,
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
  stopSimulation = true;
  clearInterval(mainInterval);
  foods = randomFoods(NUMBER_FOOD, food_sprite_images_paths);
  worms = randomWorms(NUMBER_WORMS, worm_sprite_images_paths);
  play();
  setTimeout(pause, TICK_TIME);
}
