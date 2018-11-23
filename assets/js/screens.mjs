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
  GLOBAL_CONF,
  GEN_CONF
} from "./gameloop.mjs";
import * as wormModule from "./worm.mjs";
import * as extra from './extra.mjs';

const SCREEN_CONF = {};
export {
  SCREEN_CONF
};

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
  // Generation Settings
  document.getElementById("total-worms-span").textContent = GEN_CONF.WORMS;
  document.getElementById("total-apple-span").textContent = GEN_CONF.APPLES;
  document.getElementById("maxiter-span").textContent = GEN_CONF.MAXITER;
  document.getElementById("speed-span").textContent = GEN_CONF.SPEED;
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
    this.color = "#FFF";
    this.wormColor = "#0F0";
    this.wormsAmmount = 1;
    this.applesAmmount = 50;
    this.fontTitle = `50px ${GLOBAL_CONF.FONT_STYLE}`;
    this.fontSub = `20px ${GLOBAL_CONF.FONT_STYLE}`;
    this.iter = 0;
    this.blurOscilation = Array(15).fill().map((v, i) => i + 10);
    this.blurOscilation.push(...this.blurOscilation.slice(0).reverse());
    this.ups = 20;

    this.borderFunc = extra.circleBorder(this.game.width / 2, this.game.height / 2 + 100, this.game.width / 3);
    this.worms = wormModule.randomWorms(this.game, this.wormsAmmount,
      4 * WORM_CONF.WORM_WIDTH, 4 * WORM_CONF.WORM_HEIGHT, WORM_CONF.worm_sprite_images_paths,
      GLOBAL_CONF.NAMES, 50, this.game.width - 50, 150, this.game.height - 50, this.borderFunc);
    this.apples = wormModule.randomApples(this.game, this.applesAmmount,
      WORM_CONF.APPLE_WIDTH / 2, WORM_CONF.APPLE_HEIGHT / 2, WORM_CONF.apple_sprite_images_paths,
      2, 8, 50, this.game.width - 50, 150, this.game.height - 50, this.borderFunc);
  }
  update() {
    this.worms.map(worm => {
      let changeDirection = Math.random() > 0.9 ? extra.randomBm(0, Math.PI / 16) : 0;
      worm.move(2, worm.azimuth + changeDirection, this.borderFunc);
    });
    this.iter++;
    this.iter %= this.blurOscilation.length;
  }
  draw() {
    this.ctx.clearRect(0, 0, this.game.width, this.game.height);
    this.ctx.strokeStyle = this.color;
    this.ctx.fillStyle = this.color;
    this.ctx.shadowColor = this.color;
    this.ctx.shadowBlur = this.blurOscilation[this.iter];
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
      worm.drawText(`Giant Random Walk\n${worm.firstName} ${worm.lastName}`);
    });
    this.apples.map(apple => apple.draw());
  }
}

export class GameScreen extends BlankScreen {
  init() {

    this.iter = 0;
    this.eaten = 0;
    this.startingTime = Date.now();
    this.stopGeneration = true;

    this.totalWorms = parseInt(document.getElementById("total-worms-span").textContent) || GEN_CONF.WORMS;
    this.totalApples = parseInt(document.getElementById("total-apple-span").textContent) || GEN_CONF.APPLES;
    this.maxiter = parseInt(document.getElementById("maxiter-span").textContent) || GEN_CONF.MAXITER;
    this.speed = parseInt(document.getElementById("speed-span").textContent) || GEN_CONF.SPEED;

    this.borderFunc = extra.rectangleBorder(0, this.game.width, 0, this.game.height);
    this.worms = wormModule.randomWorms(this.game, this.totalWorms,
      WORM_CONF.WORM_WIDTH, WORM_CONF.WORM_HEIGHT, WORM_CONF.worm_sprite_images_paths,
      GLOBAL_CONF.NAMES, GLOBAL_CONF.CANVAS_PADDING, this.game.width - GLOBAL_CONF.CANVAS_PADDING,
      GLOBAL_CONF.CANVAS_PADDING, this.game.height - GLOBAL_CONF.CANVAS_PADDING, this.borderFunc);
    this.apples = wormModule.randomApples(this.game, this.totalApples,
      WORM_CONF.APPLE_WIDTH, WORM_CONF.APPLE_HEIGHT, WORM_CONF.apple_sprite_images_paths, 2, 8,
      GLOBAL_CONF.CANVAS_PADDING, this.game.width - GLOBAL_CONF.CANVAS_PADDING,
      GLOBAL_CONF.CANVAS_PADDING, this.game.height - GLOBAL_CONF.CANVAS_PADDING, this.borderFunc);
  }
  update() {
    if (this.iter >= this.maxiter) {
      this.game.changeScreen(new StatsScreen(this.game), [this.worms, this.apples, this.stopGeneration]);
    }
    if (!this.pause) {
      this.maxiter = parseInt(document.getElementById("maxiter-span").textContent) || GEN_CONF.MAXITER;
      this.speed = parseInt(document.getElementById("speed-span").textContent) || GEN_CONF.SPEED;
      this.ups = this.speed;
      this.worms.map(worm => {
        worm.move(5, worm.azimuth + extra.randomBm(0, Math.PI / 8),
          this.borderFunc);
      });
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
  }
  draw() {
    this.ctx.clearRect(0, 0, this.game.width, this.game.height);
    let maxEaten = 1;
    let glutton = [];
    this.worms.map(worm => {
      if (worm.belly > maxEaten) {
        glutton = [worm];
        maxEaten = worm.belly;
      }
      if (worm.belly == maxEaten) glutton.push(worm);
      worm.draw();
    });
    glutton.map(worm => worm.drawText(`${maxEaten} Apples\n${worm.firstName} ${worm.lastName}`));
    this.apples.filter(apple => !apple.eaten).map(apple => apple.draw());
    if (this.pause) {
      this.ctx.font = `100px ${GLOBAL_CONF.FONT_STYLE}`;
      this.ctx.shadowColor = "#0F0";
      this.ctx.fillText("Pause", this.game.width / 2 - 150, this.game.height / 2);
    }
    document.getElementById("elapsed-span").textContent = new Date(Date.now() - this.startingTime).toUTCString().match(/\d{2}:\d{2}:\d{2}/);
    document.getElementById("total-eaten-span").textContent = `${this.eaten}\t(${(100*this.eaten/this.apples.length).toFixed(2)}% - ${(this.eaten/this.worms.length).toFixed(2)}a/w)`;
  }
  updateDom() {
    this.worms.sort((a, b) => b.belly - a.belly).slice(0, 5).map((worm, index) => {
      let firstName = worm.firstName;
      let lastName = worm.lastName;
      document.getElementById(`worm${index}-name`).parentElement.style.color = worm.shadowColor;
      document.getElementById(`worm${index}-name`).textContent = `${firstName} ${lastName} ${extra.romanize(worm.generation) || ""}`;
      document.getElementById(`worm${index}-belly`).textContent = worm.belly;
    });
  }
}

export class StatsScreen extends BlankScreen {
  init(worms, apples, stopGeneration) {
    this.worms = worms;
    this.apples = apples;
    this.stopGeneration = stopGeneration || false;

    this.freezeState = 10; // 10 updates frozen
    this.slidingAnimation = 20; // 20 updates for the animation

    this.borderFunc = extra.rectangleBorder(0, this.game.width, 0, this.game.height);
    this.newWorms = wormModule.breedLarvae(this.game, this.worms, WORM_CONF.WORM_WIDTH,
      WORM_CONF.WORM_HEIGHT, WORM_CONF.worm_sprite_images_paths, GLOBAL_CONF.NAMES,
      GLOBAL_CONF.CANVAS_PADDING, this.game.width - GLOBAL_CONF.CANVAS_PADDING,
      GLOBAL_CONF.CANVAS_PADDING, this.game.height - GLOBAL_CONF.CANVAS_PADDING, this.borderFunc);
    this.topWorms = this.worms.sort((a, b) => b.belly - a.belly).slice(0, 5).map((worm, index) => {
      let fx = this.game.width / 2 - 250;
      let fy = (100 * index + 200);
      let slope = (fy - worm.y) / (fx - worm.x);
      worm.dx = (fx - worm.x) / this.slidingAnimation;
      worm.dy = (slope * worm.dx);
      return worm;
    });
    this.color = "#FFF";
    this.wormColor = "#0F0";
    this.fontTitle = `50px ${GLOBAL_CONF.FONT_STYLE}`;
    this.fontSub = `20px ${GLOBAL_CONF.FONT_STYLE}`;
    this.iter = 0;
    this.glowIter = 0;
    this.blurOscilation = Array(15).fill().map((v, i) => i + 10);
    this.blurOscilation.push(...this.blurOscilation.slice(0).reverse());
    this.ups = 30;
    this.fillAncestorTable(this.newWorms);
  }
  update() {
    this.iter++;
    if (this.stopGeneration) {
      if (this.iter>this.freezeState && this.iter <= this.slidingAnimation+this.freezeState) {
        this.topWorms.map(worm => {
          worm.x += worm.dx;
          worm.y += worm.dy;
        });
      }
    } else {
    }
  }
  draw() {
    this.glowIter++;
    this.glowIter %= this.blurOscilation.length;
    if (this.stopGeneration && this.iter>this.freezeState) {
      this.ctx.clearRect(0, 0, this.game.width, this.game.height);
      this.topWorms.map(worm => {
        worm.draw();
        worm.drawText(`${worm.firstName} ${worm.lastName}  ${extra.romanize(worm.generation) || ""}`);
      });
      this.ctx.font = `50px ${GLOBAL_CONF.FONT_STYLE}`;
      this.ctx.shadowColor = "#F00";
      this.ctx.fillText("Top Worms", 330, 100);
      this.ctx.font = GLOBAL_CONF.DEFAUT_FONT;
    } else {
      // this.ctx.strokeStyle = this.color;
      // this.ctx.fillStyle = this.color;
      // this.ctx.shadowColor = this.color;
      // this.ctx.shadowBlur = this.blurOscilation[this.iter];
      // this.ctx.font = this.fontTitle;
      // this.ctx.fillText("Two Neurons Worm", 100, 100);
      // this.ctx.font = this.fontSub;
      // this.ctx.fillText("RULES:", 100, 160);
      // this.ctx.fillText("← Mess with generation settings", 100, 200);
      // this.ctx.fillText("→ Mess with worms neurons", 100, 220);
      // this.ctx.fillText("• BE THE VERY BEST WORM TRAINER •", 100, 240);
    }
  }
  fillAncestorTable(worms) {
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
}
