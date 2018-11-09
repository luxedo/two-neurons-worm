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
const NUMBER_WORMS = 100;
const NUMBER_FOOD = 200;
const MAX_STEP = 5;
const MIN_AMMOUNT = 1;
const MAX_AMMOUNT = 50;
const EAT_DISTANCE = 20;
const TICK_TIME = 10;
const GENERATION_TIMEOUT = 5;
const worm_sprite_images_paths = [
  "./assets/worm-medium.svg", "./assets/worm-small.svg",
  "./assets/worm-medium.svg", "./assets/worm-large.svg",
];
const food_sprite_images_paths = [
  "./assets/food-1.svg", "./assets/food-2.svg",
  "./assets/food-1.svg", "./assets/food-3.svg"
];
var names = [];

var numberOfGenerations = 0;

/* Main function */
function start() {
  var c = document.getElementById("main-canvas");
  c.width = CANVAS_SIZE;
  c.height = CANVAS_SIZE;
  var ctx = c.getContext("2d");
  ctx.shadowBlur = SHADOW_BLUR;

  loadJSON('./assets/names.json', response => {
    names = JSON.parse(response);

    var foods = randomFoods(NUMBER_FOOD, food_sprite_images_paths, ctx);
    var worms = randomWorms(NUMBER_WORMS, worm_sprite_images_paths, ctx);

    var started = Date.now();
    document.getElementById("elapsed-span").textContent = "00:00:00";
    setInterval(() => {
      var now = new Date(Date.now() - started);
      document.getElementById("elapsed-span").textContent = now.toUTCString().match(/\d{2}:\d{2}:\d{2}/);
    }, 200);
    runGenerationAndLoop(foods, worms, worm_sprite_images_paths, food_sprite_images_paths, ctx);
  });
}

/* Classes */
class Worm {
  constructor(x, y, weights, stepSize, azimuth, sprite_images_paths, ctx, shadowColor, name, generation) {
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
    this.name = name;
    this.generation = generation;
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
        this.sizeX *= 1.1;
        this.sizeY *= 1.1;
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
function randomFoods(number, food_sprite_images_paths, ctx) {
  var foods = [];
  for (var i = 0; i < number; i++) {
    var ammount = (Math.random() * (MAX_AMMOUNT - MIN_AMMOUNT)) + MIN_AMMOUNT;
    var factorX = FOOD_WIDTH * FOOD_SCALE * Math.log(ammount);
    var factorY = FOOD_HEIGHT * FOOD_SCALE * Math.log(ammount);
    var x = (Math.random() * CANVAS_SIZE - factorX) + factorX / 2;
    var y = (Math.random() * CANVAS_SIZE - factorY) + factorY / 2;
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
function randomWorms(number, worm_sprite_images_paths, ctx) {
  var worms = new Array(number).fill(0);
  return worms.map(() => createRandomWorm(worm_sprite_images_paths, ctx));
}


function createRandomWorm(worm_sprite_images_paths, ctx) {
  var x = Math.random() * CANVAS_SIZE;
  var y = Math.random() * CANVAS_SIZE;
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
  var color = "#" + red + "FF" + blue;
  var firstName = names[Math.floor(Math.random() * names.length)].first_name;
  var lastName = names[Math.floor(Math.random() * names.length)].last_name;
  var name = `${firstName} ${lastName}`;
  var worm = new Worm(x, y, weights, stepSize, azimuth, worm_sprite_images_paths, ctx, color, name, 0);
  return worm;
}


/* Reproduce most fit worms */
function reproduceWorms(worms, worm_sprite_images_paths, ctx) {
  var number = worms.length;
  var newWorms = new Array(number).fill(0);

  worms = worms.filter(worm => worm.belly !== 0);
  worms.sort((a, b) => b.belly - a.belly);

  var totalFood = worms.reduce((acc, worm) => {
    acc += worm.belly;
    return acc;
  }, 0);
  var larvae = worms.reduce((acc, worm, index) => {
    var numberOfChildren = Math.floor(worm.belly / totalFood * number);
    var children = new Array(numberOfChildren).fill(index);
    acc.push(...children);
    return acc;
  }, []);
  newWorms = newWorms.map((_, index) => {
    return breedWorm(worms[index], worm_sprite_images_paths, ctx);
  });
  return newWorms;
}

function breedWorm(worm, worm_sprite_images_paths, ctx) {
  if (worm === undefined) {
    return createRandomWorm(worm_sprite_images_paths, ctx);
  }

  var x = Math.random() * CANVAS_SIZE;
  var y = Math.random() * CANVAS_SIZE;
  var azimuth = Math.random() * 2 * Math.PI;

  var stepSize = worm.stepSize + random_bm(0, 4);
  stepSize = stepSize > MAX_STEP ? MAX_STEP : stepSize;
  stepSize = stepSize < 0 ? -stepSize : stepSize;

  var weights = {
    b1: worm.weights.b1 + random_bm(0, 2),
    w11: worm.weights.w11 + random_bm(0, 2),
    w12: worm.weights.w12 + random_bm(0, 2),
    b2: worm.weights.b2 + random_bm(0, 2),
    w21: worm.weights.w21 + random_bm(0, 2)
  };
  var color = worm.shadowColor;
  var red = (parseInt(color.slice(1, 3), 16) + Math.floor(random_bm(0, 10)) % 256).toString(16);
  var blue = (parseInt(color.slice(5), 16) + Math.floor(random_bm(0, 10)) % 256).toString(16);
  red = red.length == 2 ? red : "0" + red;
  blue = blue.length == 2 ? blue : "0" + blue;
  color = "#" + red + "FF" + blue;
  var name = worm.name;
  var gen = worm.generation + 1;
  // if (name.split(" ").length == 2) {
  //   name += " I";
  // } else {
  //   name = name.split(" ").slice(0, 2).join(" ") + " " + romanize(numberOfGenerations);
  // }
  return new Worm(x, y, weights, stepSize, azimuth, worm_sprite_images_paths, ctx, color, name, gen);
}

function runGeneration(foods, worms, timeout, ctx) {
  var promise = new Promise(function(resolve) {
    timeout = Date.now() + timeout * 1000;
    var interval = setInterval(() => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      var eaten = [];
      worms.map(worm => {
        worm.think(foods);
        worm.move(worm.stepSize, worm.azimuth, [0, 0, CANVAS_SIZE, CANVAS_SIZE]);
        eaten.push(...worm.eat(foods));
        worm.draw(worm.shadowColor);
      });
      foods = foods.filter(food => eaten.indexOf(food) === -1);
      foods.map(food => {
        food.draw(food.shadowColor);
      });
      if (Date.now() > timeout | foods.length == 0) {
        clearInterval(interval);
        resolve();
      }
      worms.sort((a, b) => b.belly - a.belly).slice(0, 5).map((worm, index) => {
        document.getElementById("worm" + index + "-name").textContent = `${worm.name} ${romanize(worm.generation) || ""}`;
        document.getElementById("worm" + index + "-belly").textContent = worm.belly;
      });
    }, TICK_TIME);
  });
  return promise;
}


function runGenerationAndLoop(foods, worms, worm_sprite_images_paths, food_sprite_images_paths, ctx) {
  document.getElementById("generation-span").textContent = "" + numberOfGenerations;
  console.log(worms
    .map(worm => worm.name)
    .reduce((acc, name) => {
      if (acc.hasOwnProperty(name)) {
        acc[name]++;
      } else {
        acc[name] = 1;
      }
      return acc;
    }, {})
    .map(item => {
      console.log(item);
    })
  );
  var generation = runGeneration(foods, worms, GENERATION_TIMEOUT, ctx);
  generation.then(() => {
    worms = reproduceWorms(worms, worm_sprite_images_paths, ctx);
    foods = randomFoods(foods.length, food_sprite_images_paths, ctx);
    runGenerationAndLoop(foods, worms, worm_sprite_images_paths, food_sprite_images_paths, ctx);
  });
  numberOfGenerations++;
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
