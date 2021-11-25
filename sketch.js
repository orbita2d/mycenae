// these are the variables you can use as inputs to your algorithms
console.log(fxhash)   // the 64 chars hex number fed to your algorithm
console.log(fxrand()) // deterministic PRNG function, use it instead of Math.random()

// note about the fxrand() function 
// when the "fxhash" is always the same, it will generate the same sequence of
// pseudo random numbers, always

//----------------------
// defining features
//----------------------
// You can define some token features by populating the $fxhashFeatures property
// of the window object.
// More about it in the guide, section features:
// [https://fxhash.xyz/articles/guide-mint-generative-token#features]
//
// window.$fxhashFeatures = {
//   "Background": "Black",
//   "Number of lines": 10,
//   "Inverted": true
// }


let counts = [];
let delta = [];
let max_delta = 0;
const alpha = 0.2;
const block_size = 10000000;
let x = 0.1; let y = 0.2;

function setup() {
  createCanvas(640, 640);
  // Initialise counts to zeros
  for (let x = 0; x < width; x++) {
    counts[x] = []; // create nested array
    delta[x] = [];
    for (let y = 0; y < height; y++) {
      counts[x][y] = 0;
      delta[x][y] = 0;
    }
  }
  pixelDensity(1);
  noLoop();
}

function colourmap(colours, interp) {
  const n = colours.length;
  // Which pair of colours are we interpolating between
  const bin = Math.floor(interp * (n - 1));
  // What is our [0, 1] normalised interpolation index for this bin.
  const bin_width = 1 / (n - 1);
  const bin_interp = (interp - bin_width * bin) / bin_width;
  if (bin >= n - 1) {
    return colours[n - 1];
  } else if (bin < 0) {
    return colours[0];
  } else {
    return lerpColor(colours[bin], colours[bin + 1], bin_interp);
  }
}

function renderDebug(highlight, g1, g2, n) {
  loadPixels()
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let v = 1 - Math.exp(- alpha * counts[x][y] / n * width * height);
      const pix = (x + y * width) * 4;
      let c1lerp = colourmap(g1, 1 - y / height)
      let c2lerp = colourmap(g2, 1 - y / height);
      let c = lerpColor(c1lerp, c2lerp, x / height);
      pixels[pix + 0] = red(lerpColor(c, highlight, v));
      pixels[pix + 1] = green(lerpColor(c, highlight, v));
      pixels[pix + 2] = blue(lerpColor(c, highlight, v));
      pixels[pix + 3] = 255;
    }
  }
  updatePixels()
}

function renderCorners(highlight, g1, g2, n) {
  loadPixels()
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let v = 1 - Math.exp(- alpha * counts[x][y] / n * width * height);
      const pix = (x + y * width) * 4;
      let c1lerp = colourmap(g1, 1 - y / height)
      let c2lerp = colourmap(g2, y / height);
      let c = lerpColor(c1lerp, c2lerp, x / height);
      pixels[pix + 0] = red(lerpColor(c, highlight, v));
      pixels[pix + 1] = green(lerpColor(c, highlight, v));
      pixels[pix + 2] = blue(lerpColor(c, highlight, v));
      pixels[pix + 3] = 255;
    }
  }
  updatePixels()
}

function renderDeltaLerp(g1, g2, count) {
  loadPixels()
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let v = 1 - Math.exp(- alpha * counts[x][y] / count * width * height);
      let d = Math.pow(delta[x][y] / max_delta, 0.3);
      const pix = (x + y * width) * 4;
      let c1lerp = colourmap(g1, v)
      let c2lerp = colourmap(g2, v);
      let c = lerpColor(c1lerp, c2lerp, d);
      pixels[pix + 0] = red(c);
      pixels[pix + 1] = green(c);
      pixels[pix + 2] = blue(c);
      pixels[pix + 3] = 255;
    }
  }
  updatePixels()
}

function draw() {
  background(255);
  const a = 2.02; const b = 2.04; const c = 1.60; const d = -1.20;
  const x_width = 1 + Math.abs(c);
  const y_width = 1 + Math.abs(d);
  // Define colors
  const bg = color(255, 250, 245);
  const c_reds = [bg, color(252, 181, 154), color(247, 93, 66), color(187, 20, 25), color(103, 0, 12)];
  const c_blues = [bg, color(192, 216, 237), color(96, 166, 209), color(23, 100, 171), color(8, 48, 107)];

  const g1 = c_reds;
  const g2 = c_blues;

  for (let i = 0; i < block_size; i++) {
    let xn = (Math.sin(a * y * y_width) + c * Math.cos(a * x * x_width)) / x_width;
    let yn = (Math.sin(b * x * x_width) + d * Math.cos(b * y * y_width)) / y_width;
    let dx = xn - x; let dy = yn - y;
    x = xn; y = yn;
    let xp = Math.floor((1 + xn) * width / 2);
    let yp = Math.floor((1 + yn) * height / 2);
    counts[xp][yp] += 1;
    delta[xp][yp] += (dx ** 2 + dy ** 2);
    if (delta[xp][yp] > max_delta) {
      max_delta = delta[xp][yp];
    }
  }
  //renderDebug(bg, g1, g2, block_size);
  renderCorners(bg, g1, g2, block_size);
  //renderDeltaLerp(g1, g2, block_size);
}