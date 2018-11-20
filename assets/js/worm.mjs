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


/* Classes */
export class BasicWorm {
  constructor(game, x, y, w, h, azimuth, sprite_images_paths, shadowColor, firstName, lastName) {
    this.game = game;
    this.ctx = game.ctx;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.azimuth = azimuth;
    this.index = 0;
    this.sprite_images = sprite_images_paths.map(path => {
      let img = new Image();
      img.src = path;
      return img;
    });
    this.shadowColor = shadowColor;
    this.firstName = firstName;
    this.lastName = lastName;
    this.sizeX = this.w;
    this.sizeY = this.h;
  }

  move(stepSize, azimuth, borderFunc = null) {
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
    this.ctx.font = GLOBAL_CONF.DEFAUT_FONT;
    this.ctx.lineWidth = 2;
    this.ctx.moveTo(this.x, this.y);
    let size = (GLOBAL_CONF.FONT_SIZE - 8) * text.split("\n")[text.split("\n").length - 1].length;
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
  }

  scent(x, y) {
    return this.intensity / Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2);
  }

  draw() {
    this.ctx.shadowColor = this.shadowColor;
    this.ctx.drawImage(this.sprite_images[this.index], this.x - this.sizeX / 2, this.y - this.sizeY / 2, this.sizeX, this.sizeY);
    this.index += Math.floor((Math.random() * 1.1)) > 0;
    this.index %= this.sprite_images.length;
  }
}


/* Initialize random foods */
export function randomApples(game, number, width, height, apple_sprite_images_paths,
    minIntensity, maxIntensity, minX, maxX, minY, maxY, borderFunc=null) {
  return new Array(number).fill(undefined).map(() => {
    let intensity = (Math.random() * (maxIntensity - minIntensity)) + minIntensity;
    let x;
    let y;
    do {
      x = Math.random() * (maxX - minX) + minX;
      y = Math.random() * (maxY - minY) + minY;
    } while (borderFunc != null && !borderFunc(x, y));
    let color = "#F00";
    return new Apple(game, x, y, width, height, intensity, apple_sprite_images_paths, color);
  });
}

export function randomBasicWorms(game, number, width, height, worm_sprite_images_paths,
    names, minX, maxX, minY, maxY, borderFunc=null) {
  return new Array(number).fill(0).map(() => {
    let x;
    let y;
    do {
      x = Math.random() * (maxX - minX) + minX;
      y = Math.random() * (maxY - minY) + minY;
    } while (borderFunc != null && !borderFunc(x, y));
    let color = "#0F0";
    let azimuth = Math.random() * 2 * Math.PI;

    let firstName = names[Math.floor(Math.random() * names.length)].first_name;
    let lastName = names[Math.floor(Math.random() * names.length)].last_name;

    return new BasicWorm(game, x, y, width, height, azimuth, worm_sprite_images_paths, color, firstName, lastName);
  });
}
