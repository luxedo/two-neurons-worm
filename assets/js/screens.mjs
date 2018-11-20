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
    "./assets/img/food-1.svg", "./assets/img/food-2.svg",
    "./assets/img/food-1.svg", "./assets/img/food-3.svg"
  ],
  WORM_WIDTH: 60,
  WORM_HEIGHT: 20,
  APPLE_WIDTH: 20,
  APPLE_HEIGHT: 20,
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
    this.blurOscilation = Array(10).fill().map((v, i) => i + 10);
    this.blurOscilation.push(...this.blurOscilation.slice(0).reverse());
    this.fps = 15;

    // this.borderFunc = (x, y) => extra.inside_rectangle(50, this.game.width-50, 400, this.game.height-50, x, y);
    this.borderFunc = (x, y) => extra.inside_circle(this.game.width / 2, this.game.height / 2 + 100, this.game.width / 3, x, y);
    this.worms = wormModule.randomBasicWorms(this.game, this.wormsAmmount,
      4 * WORM_CONF.WORM_WIDTH, 4 * WORM_CONF.WORM_HEIGHT, WORM_CONF.worm_sprite_images_paths,
      GLOBAL_CONF.NAMES, 50, this.game.width - 50, 150, this.game.height - 50, this.borderFunc);
    this.apples = wormModule.randomApples(this.game, this.applesAmmount,
      WORM_CONF.APPLE_WIDTH / 2, WORM_CONF.APPLE_HEIGHT / 2, WORM_CONF.apple_sprite_images_paths,
      2, 8, 50, this.game.width - 50, 150, this.game.height - 50, this.borderFunc);
  }
  update() {
    this.worms.map(worm => {
      worm.move(5, worm.azimuth + extra.random_bm(0, Math.PI / 8),
        this.borderFunc);
    });
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
      worm.drawText(`Giant\n${worm.firstName} ${worm.lastName}`);
    });
    this.apples.map(apple => apple.draw());
    this.iter++;
    this.iter %= this.blurOscilation.length;
  }
}

export class GameScreen extends BlankScreen {
  init() {
    this.worms = wormModule.randomBasicWorms(game: this.game, this.wormsAmmount,
      WORM_CONF.WORM_WIDTH, WORM_CONF.WORM_HEIGHT, WORM_CONF.worm_sprite_images_paths,
      GLOBAL_CONF.NAMES, 50, this.game.width - 50, 150, this.game.height - 50, this.borderFunc);
    this.apples = wormModule.randomApples(this.game, this.applesAmmount,
      WORM_CONF.APPLE_WIDTH / 2, WORM_CONF.APPLE_HEIGHT / 2, WORM_CONF.apple_sprite_images_paths,
      2, 8, 50, this.game.width - 50, 150, this.game.height - 50, this.borderFunc);
  }
  update() {
    this.worms.map(worm => {
      worm.move(5, worm.azimuth + extra.random_bm(0, Math.PI / 8),
        this.borderFunc);
    });
  }
  draw() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.clientWidth, this.ctx.canvas.clientHeight);
    this.worms.map(worm => worm.draw());
    this.apples.map(apple => apple.draw());
  }
}
