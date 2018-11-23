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
import * as gameloop from './assets/js/gameloop.mjs';
import * as screens from './assets/js/screens.mjs';

const VERSION = "v1.0";

let game;
let startScreen;
let gameScreen;
let closeStartScreen = true;


window.GEN_CONF = gameloop.GEN_CONF;

window.start = () => {
  screens.setupDom();
  game = new gameloop.Game("main-canvas", 60, 900, 900);
  startScreen = new screens.StartScreen(game);
  gameScreen = new screens.GameScreen(game);
  game.start();
  game.changeScreen(startScreen);
};


window.updateGlobalSetting = (id, ammount, lowerBound, upperBound) => {
  let element = document.getElementById(id);
  let actualValue = parseInt(element.textContent);
  if (actualValue + ammount > lowerBound && actualValue + ammount < upperBound) element.textContent = actualValue + ammount;
};


window.togglePlay = () => {
  document.querySelector(".play-pause-btn").classList.toggle("active-btn");
  if (closeStartScreen) {
    closeStartScreen = false;
    gameScreen.pause = true;
    window.reset();
  }
  gameScreen.pause = !gameScreen.pause;
};

window.toggleStop = () => {
  gameScreen.stopGeneration = !gameScreen.stopGeneration;
  document.querySelector(".stop-btn").classList.toggle("active-btn");
};

window.reset = () => {
  document.getElementById("elapsed-span").textContent = "00:00:00";
  game.changeScreen(gameScreen);
};
