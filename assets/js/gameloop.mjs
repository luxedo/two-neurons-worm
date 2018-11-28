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
import * as screen from './screens.mjs';

/*
 * Configuration
 */
var GLOBAL_CONF = {
  CANVAS_PADDING: 50,
  SHADOW_BLUR: 20,
  FONT_STYLE: '"monospace"',
  FONT_SIZE: 26,
  MUTATION_LEVELS: [0, 1e-8, 1e-4, 1e-2, 1e-1, 1],
};
GLOBAL_CONF.DEFAUT_FONT = `${GLOBAL_CONF.FONT_SIZE}px ${GLOBAL_CONF.FONT_STYLE}`;
loadJSON('./assets/js/names.json', response => {
  GLOBAL_CONF.NAMES = JSON.parse(response);
});
export {GLOBAL_CONF};

/*
 * Game class
 */
export class Game {
  constructor(canvasId, fps, width, height) {
    this.canvasId = canvasId;
    this.fps = fps;
    this.skipTicks = 1000 / this.fps;
    this.skipDraw = 1000 / this.fps;
    this.nextGameTick = this.nextGameDraw = Date.now();
    this.width = width;
    this.height = height;
    this.canvas = document.getElementById(canvasId);
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.shadowBlur = GLOBAL_CONF.SHADOW_BLUR;
    this.ctx.font = GLOBAL_CONF.DEFAUT_FONT;
    this.conf = GLOBAL_CONF;
    this.screen = new screen.BlankScreen(this.ctx);
    this.iter = 0;
    this.blurOscilation = Array(10).fill().map((v, i) => i+10);
    this.blurOscilation.push(...this.blurOscilation.slice(0).reverse());
  }

  start() {
    this.run();
  }

  changeScreen(screen, screenArgs=[]) {
    this.screen = screen;
    this.screen.init(...screenArgs);
  }

  run(timestamp) {
    let now = Date.now();
    if (now >= this.nextGameTick && !this.pause) {
      this.nextGameTick = now + this.skipTicks;
      this.skipTicks = 1000/(this.screen.ups || this.fps);  // screen's updates per second (ups)
      this.screen.update();
    }
    if (now >= this.nextGameDraw) {
      this.screen.updateDom();
      this.screen.draw();
      this.nextGameDraw = now + this.skipDraw;
      this.skipDraw = 1000/this.fps;
      this.ctx.shadowBlur = this.blurOscilation[this.iter];
      this.iter++;
      this.iter %= this.blurOscilation.length;
      if (this.pause) {
        this.ctx.font = `100px ${GLOBAL_CONF.FONT_STYLE}`;
        this.ctx.shadowColor = "#0F0";
        this.ctx.fillText("Pause", this.width / 2 - 150, this.height / 2);
      }
    }
    setTimeout(() => window.requestAnimationFrame(this.run.bind(this)), this.skipTicks/2);
  }
}


function loadJSON(uri, callback) {
  let xobj = new XMLHttpRequest();
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
