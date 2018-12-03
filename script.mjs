/*
two-neurons-worm
This is a project for creating a worm that find it's food using two neurons:
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
import * as extra from './assets/js/extra.mjs';

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
  game.wormInspect = null;
  game.start();
  game.changeScreen(startScreen);
  game.stopGeneration = false;
  document.querySelectorAll(".select-items").forEach(node => node.firstChild.click());

  // Click worm on canvas
  let canvas = document.getElementById("main-canvas");
  canvas.addEventListener('click', function(evt) {
    let rect = canvas.getBoundingClientRect();
    let mousePos = {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
    let worms = game.screen.worms;
    if (worms !== undefined) {
      worms.map(worm => {
        if (extra.distance(worm.x, worm.y, mousePos.x, mousePos.y) < 30) window.inspectWorm(worm);
      });
    }
  }, false);
};

window.togglePlay = () => {
  document.querySelectorAll(".play-pause").forEach(node => node.classList.toggle("hide"));
  if (closeStartScreen) {
    closeStartScreen = false;
    game.pause = true;
    window.reset();
  }
  if (game.screen instanceof screens.StatsScreen) {
    game.stopGeneration = false;
    document.querySelector(".fa-stop.run-btn").classList.remove("active-btn");
    game.pause = true;
  }
  game.pause = !game.pause;
  let opPlay = !game.pause ? "add" : "remove";
  let opStop = game.pause ? "add" : "remove";
  document.querySelectorAll(".fa-play.play-pause").forEach(node => node.classList[opPlay]("hide"));
  document.querySelectorAll(".fa-pause.play-pause").forEach(node => node.classList[opStop]("hide"));
};

window.toggleStop = () => {
  game.stopGeneration = !game.stopGeneration;
  document.querySelector(".fa-stop.run-btn").classList.toggle("active-btn");
};

window.reset = () => {
  game.wormInspect = null;
  screens.setupDom();
  screens.clearGraphs(game);
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


window.inspectWorm = (obj) => {
  document.querySelectorAll('.inspect-worm-box').forEach(node => node.classList.remove('hide'));
  let worms = game.screen.worms;
  if (worms !== undefined) {
    if (typeof obj === "number") {
      let index = obj;  // If the argument is a number, search for the worm in the table
      worms.sort((a, b) => b.belly - a.belly).slice(index, index + 1).map(w => game.wormInspect = w);
    } else if (obj.constructor.name == "Worm") {
      game.wormInspect = obj;  // If the argument is a worm, set it to inspect
    }
  }
  fillWormData(game.wormInspect);
};

function fillWormData(worm) {
  document.getElementById("name-value").textContent = `${worm.fullName}`;
  document.getElementById("belly-value").textContent = `${worm.belly} Apples`;
  let algorithm = worm.brain.constructor.name == "BrainTwoNeurons" ? "Two Neurons" : "Random Walk";
  document.getElementById("algorithm-value").textContent = algorithm;
  switch (algorithm) {
    case "Two Neurons":
      document.querySelectorAll(".two-neurons-values").forEach(node => node.classList.remove("hide"));
      document.querySelectorAll(".random-walk-values").forEach(node => node.classList.add("hide"));
      // document.getElementById("arch-value").textContent = `Architecture`;
      document.getElementById("brain-n1-b1").value = worm.brain.weights1.b1;
      document.getElementById("brain-n1-w1").value = worm.brain.weights1.w1;
      document.getElementById("brain-n1-w2").value = worm.brain.weights1.w2;
      document.getElementById("brain-n1-w3").value = worm.brain.weights1.w3;
      document.getElementById("brain-n2-b1").value = worm.brain.weights2.b1;
      document.getElementById("brain-n2-w1").value = worm.brain.weights2.w1;
      document.getElementById("brain-n2-w2").value = worm.brain.weights2.w2;
      document.getElementById("brain-n2-w3").value = worm.brain.weights2.w3;
      document.getElementById("body-max-step").value = worm.body.maxStep;
      document.getElementById("body-turn-left").value = extra.radians2degree(parseFloat(worm.body.maxTurn));
      document.getElementById("body-turn-right").value = -extra.radians2degree(parseFloat(worm.body.minTurn));
      break;
    case "Random Walk":
      document.querySelectorAll(".two-neurons-values").forEach(node => node.classList.add("hide"));
      document.querySelectorAll(".random-walk-values").forEach(node => node.classList.remove("hide"));
      document.getElementById("turning-chance-value").value = worm.brain.turningChance;
      break;
    default:
  }
}

window.updateValue = (id) => {
  let value = parseFloat(document.getElementById(id).value);
  switch (id) {
    case "brain-n1-b1":
      game.wormInspect.brain.weights1.b1 = value;
      break;
    case "brain-n1-w1":
      game.wormInspect.brain.weights1.w1 = value;
      break;
    case "brain-n1-w2":
      game.wormInspect.brain.weights1.w2 = value;
      break;
    case "brain-n1-w3":
      game.wormInspect.brain.weights1.w3 = value;
      break;
    case "brain-n2-b1":
      game.wormInspect.brain.weights2.b1 = value;
      break;
    case "brain-n2-w1":
      game.wormInspect.brain.weights2.w1 = value;
      break;
    case "brain-n2-w2":
      game.wormInspect.brain.weights2.w2 = value;
      break;
    case "brain-n2-w3":
      game.wormInspect.brain.weights2.w3 = value;
      break;
    case "brain-n2-w3":
      game.wormInspect.brain.weights2.w3 = value;
      break;
    case "body-max-step":
      game.wormInspect.body.maxStep = value;
      break;
    case "body-turn-left":
      game.wormInspect.body.maxTurn = -extra.degree2radians(value);
      break;
    case "turning-chance-value":
      game.wormInspect.body.turningChance = value / 100;
      break;
    default:
  }
};
