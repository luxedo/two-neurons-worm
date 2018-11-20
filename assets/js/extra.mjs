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


/* Standard Normal variate using Box-Muller transform. */
export function random_bm(mean, variance) {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return mean + Math.sqrt(variance * -2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/* Returns `true` if the point (x, y) is inside the circle */
export function inside_circle(cx, cy, r, x, y) {
  return Math.pow(x-cx, 2) + Math.pow(y-cy, 2) < Math.pow(r, 2);
}

/* Returns `true` if the point (x, y) is inside the rectangle */
export function inside_rectangle(x0, x1, y0, y1, x, y) {
  return x>x0 && x<x1 && y>y0 && y<y1;
}
