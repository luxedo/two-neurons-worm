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
import {
  GLOBAL_CONF
} from "./gameloop.mjs";
import * as wormModule from "./worm.mjs";
import * as extra from './extra.mjs';

const WORM_CONF = {
  worm_sprite_images_paths: [
    "./assets/img/worm-medium.svg", "./assets/img/worm-small.svg",
    "./assets/img/worm-medium.svg", "./assets/img/worm-large.svg",
  ],
  apple_sprite_images_paths: [
    "./assets/img/apple-1.svg", "./assets/img/apple-2.svg",
    "./assets/img/apple-1.svg", "./assets/img/apple-3.svg"
  ],
  WORM_WIDTH: 60,
  WORM_HEIGHT: 20,
  APPLE_WIDTH: 20,
  APPLE_HEIGHT: 20,

  EAT_DISTANCE: 20,
};
export {
  WORM_CONF
};

export function setupDom() {
  // General stats
  document.getElementById("elapsed-span").textContent = "00:00:00";
  document.getElementById("generation-span").textContent = "0";
  document.getElementById("total-eaten-span").textContent = `0\t(0% - 0a/w)`;
  document.getElementById("remaining-iterations-span").textContent = 100;
}

export class BlankScreen {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
  }
  init() {}
  update() {}
  draw() {}
  updateDom() {}
}

export class StartScreen extends BlankScreen {
  init() {
    this.color = "#EEE";
    this.wormsAmmount = 1;
    this.applesAmmount = 50;
    this.fontTitle = `50px ${GLOBAL_CONF.FONT_STYLE}`;
    this.fontSub = `20px ${GLOBAL_CONF.FONT_STYLE}`;

    this.borderLimit = [GLOBAL_CONF.CANVAS_PADDING, this.game.width - GLOBAL_CONF.CANVAS_PADDING, GLOBAL_CONF.CANVAS_PADDING, this.game.height - GLOBAL_CONF.CANVAS_PADDING];
    this.borderFunc = extra.circleBorder(this.game.width / 2, this.game.height / 2 + 100, this.game.width / 3);

    let appleSize = [WORM_CONF.APPLE_WIDTH / 2, WORM_CONF.APPLE_HEIGHT / 2];
    let size = [4 * WORM_CONF.WORM_WIDTH, 4 * WORM_CONF.WORM_HEIGHT];
    let bodyConf = {
      maxStepM: 3,
      maxStepS: 0,
      maxTurnM: extra.degree2radians(90),
      maxTurnS: 0,
      turnBiasM: 0,
      turnBiasS: 0
    };
    let brainConf = {
      algorithm: "Random Walk",
      randomWalkM: 0.1,
      randomWalkS: 0.0
    };
    this.worms = wormModule.randomWorms(this.game, this.wormsAmmount, size,
      WORM_CONF.worm_sprite_images_paths, bodyConf, brainConf, GLOBAL_CONF.NAMES,
      this.borderLimit, this.borderFunc);
    this.apples = wormModule.randomApples(this.game, this.applesAmmount,
      appleSize, WORM_CONF.apple_sprite_images_paths, 2, 8, this.borderLimit,
      this.borderFunc);
  }
  update() {
    this.worms.map(worm => worm.update(this.apples, this.borderFunc));
  }
  draw() {
    this.ctx.clearRect(0, 0, this.game.width, this.game.height);
    this.ctx.strokeStyle = this.color;
    this.ctx.fillStyle = this.color;
    this.ctx.shadowColor = this.color;
    this.ctx.font = this.fontTitle;
    this.ctx.fillText("Two Neurons Worm", 100, 100);
    this.ctx.font = this.fontSub;
    this.ctx.fillText("RULES:", 100, 160);
    this.ctx.fillText("← Mess with generation settings", 100, 200);
    this.ctx.fillText("→ Mess with worms neurons", 100, 220);
    this.ctx.fillText("• BE THE VERY BEST WORM TRAINER •", 100, 240);

    // this.ctx.fillText("← CHOSE GENERATION SETTINGS", 100, 230);
    // this.ctx.fillText("← PRESS PLAY TO START TRAINING", 100, 250);
    // this.ctx.fillText("← PRESS STOP TO SEE GENERATION STATS", 100, 270);
    // this.ctx.fillText("← PRESS RESET TO START AGAIN", 100, 290);
    // this.ctx.fillText("         CHOSE WORMS NEURONS →", 100, 320);
    // this.ctx.fillText("          CHOSE WORMS INPUTS →", 100, 340);
    // this.ctx.fillText("CHOSE WORMS GENETIC VARIANCE →", 100, 360);
    this.worms.map(worm => {
      worm.draw();
      worm.drawText(`Mounthless Random Walk\n${worm.fullName}`);
    });
    this.apples.map(apple => apple.draw());
  }
}

export class GameScreen extends BlankScreen {
  init(worms, generation) {
    this.generation = generation || 0;

    this.iter = 0;
    this.eaten = 0;
    this.startingTime = Date.now();
    this.stopGeneration = false;

    let input = loadInputs();
    this.totalWorms = input.totalWorms;
    this.totalApples = input.totalApples;
    this.maxiter = input.maxiter;
    this.speed = input.speed;
    this.mutationLevel = input.mutationLevel;
    this.randomWorms = input.randomWorms;

    let bodyConf = input.bodyConf;

    let brainConf = input.brainConf;
    brainConf.algorithm = this.game.algorithm;

    let size = [WORM_CONF.WORM_WIDTH, WORM_CONF.WORM_HEIGHT];
    let appleSize = [WORM_CONF.APPLE_WIDTH, WORM_CONF.APPLE_HEIGHT];
    this.borderLimit = [GLOBAL_CONF.CANVAS_PADDING, this.game.width - GLOBAL_CONF.CANVAS_PADDING, GLOBAL_CONF.CANVAS_PADDING, this.game.height - GLOBAL_CONF.CANVAS_PADDING];
    this.borderFunc = extra.rectangleBorder(0, this.game.width, 0, this.game.height);
    this.worms = worms || wormModule.randomWorms(this.game, this.totalWorms, size,
      WORM_CONF.worm_sprite_images_paths, bodyConf, brainConf, GLOBAL_CONF.NAMES, this.borderLimit,
      this.borderFunc);
    this.apples = wormModule.randomApples(this.game, this.totalApples,
      appleSize, WORM_CONF.apple_sprite_images_paths,
      2, 8, this.borderLimit, this.borderFunc);
  }
  update() {
    if (this.iter >= this.maxiter || this.eaten === this.apples.length) {
      this.game.changeScreen(new StatsScreen(this.game), [this.worms, this.apples, this.stopGeneration, this.generation]);
    }
    this.maxiter = parseInt(document.getElementById("maximum-iterations").value);
    this.speed = parseInt(document.getElementById("speed").value);
    this.ups = this.speed;
    this.worms.map(worm => worm.update(this.apples, this.borderFunc));
    this.apples.filter(apple => !apple.eaten).map(apple => apple.update());
    // Eating apples
    this.apples.map(apple => {
      if (!apple.eaten) {
        this.worms.map(worm => {
          if (extra.distance(worm.x, worm.y, apple.x, apple.y) < WORM_CONF.EAT_DISTANCE) {
            worm.belly++;
            apple.eaten = true;
            apple.eatenIter = this.iter;
          }
        });
      }
    });
    this.eaten = this.apples.filter(apple => apple.eaten).length;
    this.iter++;
  }
  draw() {
    this.ctx.clearRect(0, 0, this.game.width, this.game.height);
    let maxEaten = 1;
    let glutton = [];
    this.worms.map(worm => {
      if (worm.belly > maxEaten) {
        glutton = [worm];
        maxEaten = worm.belly;
      } else if (worm.belly == maxEaten) glutton.push(worm);
      worm.draw();
    });
    glutton.map(worm => worm.drawText(`${maxEaten} Apples\n${worm.fullName}`));
    this.apples.filter(apple => !apple.eaten).map(apple => apple.draw());
  }
  updateDom() {
    document.getElementById("generation-span").textContent = this.generation;
    document.getElementById("elapsed-span").textContent = new Date(Date.now() - this.startingTime).toUTCString().match(/\d{2}:\d{2}:\d{2}/);
    document.getElementById("total-eaten-span").textContent = `${this.eaten.toString().padEnd(4)}(${(100*this.eaten/this.apples.length).toFixed(2)}% - ${(this.eaten/this.worms.length).toFixed(2)}a/w)`;
    document.getElementById("remaining-iterations-span").textContent = `${this.maxiter-this.iter} (${((this.maxiter-this.iter)/this.speed).toFixed(2)}s)`;
    this.worms.sort((a, b) => b.belly - a.belly).slice(0, 5).map((worm, index) => {
      document.getElementById(`worm${index}-name`).parentElement.style.color = worm.shadowColor;
      document.getElementById(`worm${index}-name`).textContent = worm.fullName;
      document.getElementById(`worm${index}-belly`).textContent = worm.belly;
    });
  }
}

export class StatsScreen extends BlankScreen {
  // COMBAK: Think about this properly
  init(worms, apples, stopGeneration, generation) {
    this.worms = worms;
    this.apples = apples;
    this.eaten = this.apples.filter(apple => apple.eaten).length;
    this.stopGeneration = stopGeneration || false;
    this.generation = generation || 0;

    let input = loadInputs();
    this.totalWorms = input.totalWorms;
    this.totalApples = input.totalApples;
    this.maxiter = input.maxiter;
    this.speed = input.speed;
    this.mutationLevel = input.mutationLevel;
    this.randomWorms = input.randomWorms;

    let bodyConf = input.bodyConf;

    let brainConf = input.brainConf;
    brainConf.algorithm = this.game.algorithm;

    this.borderFunc = extra.rectangleBorder(0, this.game.width, 0, this.game.height);
    this.borderLimit = [GLOBAL_CONF.CANVAS_PADDING, this.game.width - GLOBAL_CONF.CANVAS_PADDING, GLOBAL_CONF.CANVAS_PADDING, this.game.height - GLOBAL_CONF.CANVAS_PADDING];
    let size = [WORM_CONF.WORM_WIDTH, WORM_CONF.WORM_HEIGHT];
    this.newWorms = wormModule.breedWorms(this.game, this.worms, this.totalWorms,
      size, WORM_CONF.worm_sprite_images_paths, bodyConf, brainConf, GLOBAL_CONF.NAMES,
      this.borderLimit, this.borderFunc, this.generation, this.randomWorms, this.mutationLevel);

    this.freezeState = 10; // 10 updates frozen
    this.slidingAnimation = 15; // 15 updates for the animation
    let border = 100;
    let borderArray = [border, this.game.width - border, border / 2, this.game.height - border];
    this.borderApples = this.apples.slice(0).filter(apple => !apple.eaten && !extra.insideRectangle(...borderArray, apple.x, apple.y));
    this.borderWorms = this.worms.slice(0).filter(worm => !extra.insideRectangle(...borderArray, worm.x, worm.y));

    this.topWorms = this.worms.sort((a, b) => b.belly - a.belly).slice(0, 5).map((worm, index) => {
      let fx = this.game.width / 2 - 280;
      let fy = (80 * index + 200);
      let slope = (fy - worm.y) / (fx - worm.x);
      worm.dx = (fx - worm.x) / this.slidingAnimation;
      worm.dy = (slope * worm.dx);
      return worm;

    });
    this.topWorms.map(worm => worm.drawText(worm.fullName));

    this.color = "#EEE";
    this.wormColor = "#0F0";
    this.fontTitle = `50px ${GLOBAL_CONF.FONT_STYLE}`;
    this.fontSub = `20px ${GLOBAL_CONF.FONT_STYLE}`;
    this.iter = 0;
    this.glowIter = 0;
    this.blurOscilation = Array(15).fill().map((v, i) => i + 10);
    this.blurOscilation.push(...this.blurOscilation.slice(0).reverse());
    this.ups = 30;
    this.fillAncestorTable(this.newWorms);

    this.game.eatenHistory = this.game.eatenHistory || [];
    this.game.foodPerWormHistory = this.game.foodPerWormHistory || [];

    this.game.eatenHistory.push(this.apples.filter(apple => apple.eaten).length / this.apples.length * 100);
    this.game.foodPerWormHistory.push(this.apples.filter(apple => apple.eaten).length / this.worms.length * 100);
    plotPercentGraphs(this.game);
  }
  update() {
    this.iter++;
    if (this.stopGeneration) {
      if (this.iter > this.freezeState && this.iter <= this.slidingAnimation + this.freezeState) {
        this.topWorms.map(worm => {
          worm.x += worm.dx;
          worm.y += worm.dy;
        });
      } else if (this.iter > this.slidingAnimation + this.freezeState) {
        this.topWorms.map((worm, index) => {
          worm.x = this.game.width / 2 - 280;
          worm.y = (80 * index + 200);
        });
      }
    } else {
      if (this.iter > 15) this.game.changeScreen(new GameScreen(this.game), [this.newWorms, this.generation + 1]);
    }
  }
  draw() {
    this.ctx.clearRect(0, 0, this.game.width, this.game.height);
    this.glowIter++;
    this.glowIter %= this.blurOscilation.length;
    this.ctx.shadowBlur = this.blurOscilation[this.glowIter];
    if (this.stopGeneration) {
      if (this.iter < this.freezeState + this.slidingAnimation) {
        this.topWorms.map(worm => {
          worm.draw();
          worm.drawText(worm.fullName);
        });
        this.apples.filter(apple => !apple.eaten).map(apple => apple.draw());
      } else {
        this.ctx.font = `50px ${GLOBAL_CONF.FONT_STYLE}`;
        this.ctx.shadowColor = "#F00";
        this.ctx.fillText("Top Worms", 330, 100);
        this.ctx.font = GLOBAL_CONF.DEFAUT_FONT;
        let largestName = this.topWorms.reduce((acc, worm) => worm.fullName.length > acc ? worm.fullName.length : acc, 0);
        this.ctx.fillText(`${(100*this.eaten/this.apples.length).toFixed(2)}% apples eaten`, 190, 700);
        this.ctx.fillText(`${(this.eaten/this.worms.length).toFixed(2)} apples/worm`, 190, 740);
        this.topWorms.map(worm => {
          worm.draw();
          worm.drawText(`${worm.fullName.padEnd(largestName)} - ${worm.belly} apples`);
        });
        this.borderApples.map(apple => apple.draw());
        this.borderWorms.map(worm => worm.draw());
      }
    } else {
      this.ctx.font = `50px ${GLOBAL_CONF.FONT_STYLE}`;
      this.ctx.shadowColor = "#F00";
      this.ctx.fillText("End Gen", 340, this.game.height / 2 - 110);
      if (this.iter < 5) this.ctx.fillText("Breeding.", 330, this.game.height / 2 - 50);
      else if (this.iter < 10) this.ctx.fillText("Breeding..", 330, this.game.height / 2 - 50);
      else this.ctx.fillText("Breeding...", 330, this.game.height / 2 - 50);
      this.ctx.font = GLOBAL_CONF.DEFAUT_FONT;
      this.worms.map(worm => worm.draw());
      this.apples.filter(apple => !apple.eaten).map(apple => apple.draw());
      this.topWorms.map(worm => worm.drawText(worm.fullName));
    }
  }
  fillAncestorTable(worms) {
    new Array(5).fill(0).map((_, index) => {
      document.getElementById(`ancestor${index}-name`).parentElement.style.color = "#EEE";
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
}

export function plotLine(selector, data, width, height) {
  if (data == undefined || data.length < 2) return "no data";
  if (data.length > width / 2) {
    data = data.slice(data.length - width / 2, data.length);
  }
  let maxData = Math.max(...data);
  let minData = Math.min(...data);

  data = data.map((d, index) => [index, d]);

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
    .y(d => y(d[1]));

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

export function plotPercentGraphs(game) {
  let width = 250;
  let height = 150;
  let retval;
  if (!document.querySelector(".eaten-graph-group").classList.contains("hide")) {
    if (game.percentGraph) {
      retval = plotLine(".eaten-graph", game.foodPerWormHistory, width, height);
    } else {
      retval = plotLine(".eaten-graph", game.eatenHistory, width, height);
    }
    if (retval != "no data") {
      document.getElementById("waiting-data").classList.add("hide");
    } else {
      document.getElementById("waiting-data").classList.remove("hide");
    }
  }
}


function loadInputs() {
  let mutationLevels = GLOBAL_CONF.MUTATION_LEVELS;
  return {
    // Generation Settings
    totalWorms: parseInt(document.getElementById("total-worms").value),
    totalApples: parseInt(document.getElementById("total-apples").value),
    maxiter: parseInt(document.getElementById("maximum-iterations").value),
    speed: parseInt(document.getElementById("speed").value),
    mutationLevel: mutationLevels[parseInt(document.getElementById("mutation-level").value)],
    randomWorms: parseInt(document.getElementById("random-worms").value)/100,
    bodyConf: {

      // Worms Bodies
      maxStepM: parseFloat(document.getElementById("step-size-mean").value),
      maxStepS: parseFloat(document.getElementById("step-size-std").value),
      maxTurnM: extra.degree2radians(parseInt(document.getElementById("turning-range-mean").value)),
      maxTurnS: extra.degree2radians(parseInt(document.getElementById("turning-range-std").value)),
      turnBiasM: extra.degree2radians(parseInt(document.getElementById("turning-bias-mean").value)),
      turnBiasS: extra.degree2radians(parseInt(document.getElementById("turning-bias-std").value)),
    },
    brainConf: {
      // Worms Brains - Random Walk
      randomWalkM: parseInt(document.getElementById("random-walk-slider-mean").value)/100,
      randomWalkS: parseInt(document.getElementById("random-walk-slider-std").value)/100,
      // Worms Brains - Two Neurons
      twoNeuronsArch: document.querySelector("#two-neuron-arch-select>.select-selected").textContent,
      twoNeuronsN1Activation: document.querySelector("#two-neuron-n1-activation>.select-selected").textContent,
      twoNeuronsN1Mean: parseFloat(document.getElementById("two-neurons-n1-mean").value),
      twoNeuronsN1Std: parseFloat(document.getElementById("two-neurons-n1-std").value),
      twoNeuronsN2Activation: document.querySelector("#two-neuron-n2-activation>.select-selected").textContent,
      twoNeuronsN2Mean: parseFloat(document.getElementById("two-neurons-n2-mean").value),
      twoNeuronsN2Std: parseFloat(document.getElementById("two-neurons-n2-std").value),
    }
  };
}
