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

window.start = () => {
  screens.setupDom();
  game = new gameloop.Game("main-canvas", 20, 900, 900);
  startScreen = new screens.StartScreen(game);
  gameScreen = new screens.GameScreen(game);
  game.start();
  game.changeScreen(startScreen);
  document.querySelectorAll(".select-items").forEach(node =>node.firstChild.click());
};

window.togglePlay = () => {
  document.querySelectorAll(".play-pause").forEach(node => node.classList.toggle("hide"));
  if (closeStartScreen) {
    closeStartScreen = false;
    game.pause = true;
    window.reset();
  }
  game.pause = !game.pause;
};

window.toggleStop = () => {
  gameScreen.stopGeneration = !gameScreen.stopGeneration;
  document.querySelector(".fa-stop.run-btn").classList.toggle("active-btn");
};

window.reset = () => {
  game.changeScreen(gameScreen);
};

window.plotPercentGraphs = () => screens.plotPercentGraphs(game);

window.togglePercentGraphs = () => {
  game.percentGraph = !game.percentGraph;
  document.querySelectorAll('.toggle-eaten-graph').forEach(node => node.classList.toggle('hide'));
  plotPercentGraphs(game);
};

window.selectedNode = (node) => {
  let select = node.parentNode.parentNode.id;
  switch (select) {
    case "algorithm-select":
      let algorithm = node.textContent;
      game.algorithm = algorithm;
      document.querySelectorAll('.random-walk-brain,.two-neurons-brain').forEach(node => node.classList.add('hide'));
      switch (algorithm) {
        case "Random Walk":
          document.querySelectorAll('.random-walk-brain').forEach(node => node.classList.remove('hide'));
          break;
        case "Two Neurons":
          document.querySelectorAll('.two-neurons-brain').forEach(node => node.classList.remove('hide'));
          break;
        default:
      }
      break;
    default:

  }
};
