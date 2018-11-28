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
import * as extra from "./extra.mjs";

/* Classes */
export class Worm {
  constructor(game, x, y, w, h, azimuth, sprite_images_paths, shadowColor,
    firstName, lastName, generation, ancestorGen, brain=null, body=null) {
    this.game = game;
    this.ctx = game.ctx;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.azimuth = azimuth;
    this.index = 0;
    this.sprite_images_paths = sprite_images_paths;
    this.sprite_images = sprite_images_paths.map(path => {
      let img = new Image();
      img.src = path;
      return img;
    });
    this.shadowColor = shadowColor;
    this.firstName = firstName;
    this.lastName = lastName;
    this.generation = generation;
    this.ancestorGen = ancestorGen;
    this.fullName = `${this.firstName} ${this.lastName} ${extra.romanize(this.generation) || ""}`;
    this.sizeX = this.w;
    this.sizeY = this.h;
    this.belly = 0;
    this.brain = brain || new NoBrain();
    this.body = body || new Body();
  }

  move(stepSize, azimuth, borderFunc=null) {
    this.azimuth = azimuth;
    let newX = this.x + stepSize * Math.cos(azimuth);
    let newY = this.y + stepSize * Math.sin(azimuth);
    if (borderFunc == null || borderFunc(newX, newY)) {
      this.y = newY;
      this.x = newX;
    }
    this.index += Math.floor(Math.random() * 2) > 0;
    this.index %= this.sprite_images.length;
  }

  draw() {
    this.ctx.save();
    this.ctx.shadowColor = this.shadowColor;
    this.ctx.rotate(this.azimuth);
    this.ctx.translate(this.x * Math.cos(this.azimuth) + this.y * Math.sin(this.azimuth), -this.x * Math.sin(this.azimuth) + this.y * Math.cos(this.azimuth));
    this.ctx.drawImage(this.sprite_images[this.index], -this.sizeX / 2, -this.sizeY / 2, this.sizeX, this.sizeY);
    this.ctx.restore();
  }

  drawText(text = "") {
    this.ctx.beginPath();
    this.ctx.shadowColor = this.shadowColor;
    this.ctx.font = this.game.conf.DEFAUT_FONT;
    this.ctx.lineWidth = 2;
    this.ctx.moveTo(this.x, this.y);
    let size = (this.game.conf.FONT_SIZE - 8) * text.split("\n")[text.split("\n").length - 1].length;
    if (this.x > this.game.width - size) {
      this.ctx.lineTo(this.x - 35, this.y + 25);
      this.ctx.lineTo(this.x - 200, this.y + 25);
      this.ctx.stroke();
      text.split("\n").reverse().map((text, index) => this.ctx.fillText(text, this.x - size, this.y + 20 - index * 25));
    } else {
      this.ctx.lineTo(this.x + 35, this.y + 25);
      this.ctx.lineTo(this.x + 200, this.y + 25);
      this.ctx.stroke();
      text.split("\n").reverse().map((text, index) => this.ctx.fillText(text, this.x + 35, this.y + 20 - index * 25));
    }
  }
  update(apples, borderFunc) {
    let {turn, step} = this.brain.think(apples);
    if (turn) {
      this.azimuth += extra.randomUniformInterval(this.body.minTurn, this.body.maxTurn);
    } else {
      step = step<this.body.maxStep?step:this.body.maxStep;
      this.move(step, this.azimuth, borderFunc);
    }
  }
}

class NoBrain {
  shouldTurn() {
    return false;
  }
  stepSize() {
    return 1;
  }
  think() {
    return {
      turn: this.shouldTurn(),
      step: this.stepSize()
    };
  }
}

class Body {
  constructor(maxStep, minTurn, maxTurn) {
    this.maxStep = maxStep;
    this.minTurn = minTurn;
    this.maxTurn = maxTurn;
  }
}

export class BrainRandomWalk extends NoBrain{
  constructor(turningChance) {
    super();
    this.turningChance = turningChance;
  }
  shouldTurn() {
    return Math.random() < this.turningChance;
  }
  stepSize() {
    return Infinity;
  }
}


export class Apple {
  constructor(game, x, y, w, h, intensity, sprite_images_paths, shadowColor) {
    this.game = game;
    this.ctx = game.ctx;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.intensity = intensity;
    this.index = 0;
    this.sprite_images = sprite_images_paths.map(path => {
      let img = new Image();
      img.src = path;
      return img;
    });
    this.shadowColor = shadowColor;
    this.sizeX = this.w * Math.log2(this.intensity);
    this.sizeY = this.h * Math.log2(this.intensity);
    this.eaten = false;
    this.eatenIter=null;
  }

  scent(x, y) {
    return this.eaten ? 0 : this.intensity / Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2);
  }

  update() {
    this.index += Math.floor((Math.random() * 1.1)) > 0;
    this.index %= this.sprite_images.length;
  }

  draw() {
    this.ctx.shadowColor = this.shadowColor;
    this.ctx.drawImage(this.sprite_images[this.index], this.x - this.sizeX / 2, this.y - this.sizeY / 2, this.sizeX, this.sizeY);
  }
}


/* Initialize random foods */
export function randomApples(game, number, size, apple_sprite_images_paths,
  minIntensity, maxIntensity, borderLimit, borderFunc=null) {
  let [width, height] = size;
  let [minX, maxX, minY, maxY] = borderLimit;
  let color = "#F00";
  return new Array(number).fill(undefined).map(() => {
    let intensity = (Math.random() * (maxIntensity - minIntensity)) + minIntensity;
    let x, y;
    do {
      x = extra.randomUniformInterval(minX, maxX);
      y = extra.randomUniformInterval(minY, maxY);
    } while (borderFunc != null && !borderFunc(x, y));
    return new Apple(game, x, y, width, height, intensity, apple_sprite_images_paths, color);
  });
}

export function randomWorms(game, number, size, worm_sprite_images_paths,
  body, brain, names, borderLimit, borderFunc=null, generation=0, ancestorGen=0) {
  return new Array(number).fill(0).map(() => createRandomWorm(game, size, worm_sprite_images_paths,
    body, brain, names, borderLimit, borderFunc, generation, ancestorGen));
}

export function createRandomWorm(game, size, worm_sprite_images_paths,
  body, brain, names, borderLimit, borderFunc=null, generation=0, ancestorGen=0) {
  let [width, height] = size;
  let [minX, maxX, minY, maxY] = borderLimit;
  let x;
  let y;
  do {
    x = extra.randomUniformInterval(minX, maxX);
    y = extra.randomUniformInterval(minY, maxY);
  } while (borderFunc != null && !borderFunc(x, y));
  let color = "#0F0";
  let azimuth = Math.random() * 2 * Math.PI;

  let firstName = names[Math.floor(Math.random() * names.length)].first_name;
  let lastName = names[Math.floor(Math.random() * names.length)].last_name;

  let worm = new Worm(game, x, y, width, height, azimuth, worm_sprite_images_paths,
    color, firstName, lastName, generation, ancestorGen);

  if (body != undefined) {
    let maxStep = extra.randomBm(body.maxStepM, Math.pow(body.maxStepS, 2));
    maxStep = maxStep<0?0:maxStep;
    maxStep = maxStep>20?20:maxStep;

    let turningRange = extra.randomBm(body.maxTurnM, Math.pow(body.maxTurnS, 2));
    turningRange = turningRange>2*Math.PI?2*Math.PI:turningRange;
    turningRange = turningRange<0?0:turningRange;
    let turningBias = extra.randomBm(body.turnBiasM, Math.pow(body.turnBiasM, 2));
    let [minTurn, maxTurn] = [turningBias-turningRange/2, turningBias+turningRange/2];
    worm.body = new Body(maxStep, minTurn, maxTurn);
  }
  if (brain != undefined) {
    switch (brain.algorithm) {
      case "Random Walk":
        let randomWalkM = extra.randomBm(brain.randomWalkM, Math.pow(brain.randomWalkS, 2));
        randomWalkM = randomWalkM<0?0:randomWalkM;
        randomWalkM = randomWalkM>1?1:randomWalkM;
        worm.brain = new BrainRandomWalk(randomWalkM);
        break;
    }
  }
  return worm;
}

/* Calculates the statistics for the generation */
export function generationStatistics(worms, apples) {
  let eaten = apples.filter(apple => apple.eaten);
  let totalApples = apples.length;
  let totalWorms = worms.length;
}

export function breedWorms(game, worms, number, size, worm_sprite_images_paths,
  body, brain, names, borderLimit, borderFunc=null, generation=0, randomWorms=0.2,
  variance=0.01) {
  let larvae = new Array(number).fill();

  worms = worms.filter(worm => worm.belly !== 0);
  worms.sort((a, b) => b.belly - a.belly);

  let totalFood = worms.reduce((acc, worm) => {
    acc += worm.belly;
    return acc;
  }, 0);
  let parents = worms.reduce((acc, worm) => {
    let numberOfChildren = Math.ceil(worm.belly / totalFood * number);
    let parent = new Array(numberOfChildren).fill(worm);
    acc.push(...parent);
    return acc;
  }, []).slice(0, Math.floor(number * (1 - randomWorms)));

  larvae = larvae.map((_, index) => {
    if (parents[index] == undefined) {
      return createRandomWorm(game, size, worm_sprite_images_paths, body, brain,
        names, borderLimit, borderFunc, 0, generation);
    } else {
      return breedWorm(parents[index], names, borderLimit, borderFunc, variance);
    }
  });
  return larvae;
}

function breedWorm(worm, names, borderLimit, borderFunc, variance) {
  let [minX, maxX, minY, maxY] = borderLimit;
  let x;
  let y;
  do {
    x = extra.randomUniformInterval(minX, maxX);
    y = extra.randomUniformInterval(minY, maxY);
  } while (borderFunc != null && !borderFunc(x, y));
  let azimuth = extra.randomAngle();
  let w = worm.w;
  let h = worm.h;
  let game = worm.game;
  let sprite_images_paths = worm.sprite_images_paths;
  let color = worm.shadowColor;
  let firstName = names[Math.floor(Math.random() * names.length)].first_name;
  let lastName = worm.lastName;
  let gen = worm.generation + 1;
  let ancestorGen = worm.ancestorGen;
  let newWorm = new Worm(game, x, y, w, h, azimuth, sprite_images_paths, color, firstName, lastName, gen, ancestorGen);
  newWorm.body = randomizeBody(worm.body, variance);
  newWorm.brain = randomizeBrain(worm.brain, variance);
  return newWorm;
}

function randomizeBody(body, variance) {

  let maxStep = body.maxStep;
  let minTurn = body.minTurn;
  let maxTurn = body.maxTurn;

  maxStep = extra.randomBm(maxStep, 20*variance);
  maxStep = maxStep<0?0:maxStep;
  maxStep = maxStep>20?20:maxStep;

  minTurn = extra.randomBm(minTurn, Math.PI*variance);
  minTurn %= 2*Math.PI;
  maxTurn = extra.randomBm(maxTurn, Math.PI*variance);
  maxTurn %= 2*Math.PI;
  return new Body(maxStep, minTurn, maxTurn);
}

function randomizeBrain(brain, variance) {
  if (brain instanceof BrainRandomWalk) {
    let turningChance = extra.randomBm(brain.turningChance, variance);
    turningChance = turningChance<0?0:turningChance;
    turningChance = turningChance>1?1:turningChance;
    return new BrainRandomWalk(turningChance);
  }
  return brain;
}
