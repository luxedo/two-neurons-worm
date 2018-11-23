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
export function randomBm(mean, variance) {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return mean + Math.sqrt(variance * -2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function randomUniformInterval(min=0, max=1) {
  return Math.random() * (max - min) + min;
}

export function randomAngle() {
  return Math.random() * 2 * Math.PI;
}

/* Returns `true` if the point (x, y) is inside the circle */
export function insideCircle(cx, cy, r, x, y) {
  return Math.pow(x-cx, 2) + Math.pow(y-cy, 2) < Math.pow(r, 2);
}
export function circleBorder(cx, cy, r) {
  return (x, y) => insideCircle(cx, cy, r, x, y);
}

/* Returns `true` if the point (x, y) is inside the rectangle */
export function insideRectangle(x0, x1, y0, y1, x, y) {
  return x>x0 && x<x1 && y>y0 && y<y1;
}
export function rectangleBorder(x0, x1, y0, y1) {
  return (x, y) => insideRectangle(x0, x1, y0, y1, x, y);
}

/* Distance of two vectors */
export function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

/* Thank yout Steve
http://blog.stevenlevithan.com/archives/javascript-roman-numeral-converter
*/
export function romanize(num) {
  if (!+num)
    return false;
  let digits = String(+num).split(""),
    key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
      "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
      "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"
    ],
    roman = "",
    i = 3;
  while (i--)
    roman = (key[+digits.pop() + (i * 10)] || "") + roman;
  return Array(+digits.join("") + 1).join("M") + roman;
}

/* Thank yout Steve
http://blog.stevenlevithan.com/archives/javascript-roman-numeral-converter
*/
export function deromanize(str) {
  str = str.toUpperCase();
  let validator = /^M*(?:D?C{0,3}|C[MD])(?:L?X{0,3}|X[CL])(?:V?I{0,3}|I[XV])$/,
    token = /[MDLV]|C[MD]?|X[CL]?|I[XV]?/g,
    key = {
      M: 1000,
      CM: 900,
      D: 500,
      CD: 400,
      C: 100,
      XC: 90,
      L: 50,
      XL: 40,
      X: 10,
      IX: 9,
      V: 5,
      IV: 4,
      I: 1
    },
    num = 0,
    m;
  if (!(str && validator.test(str)))
    return false;
  while (m = token.exec(str))
    num += key[m[0]];
  return num;
}
