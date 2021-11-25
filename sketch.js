const alpha = 0.3;
const block_size = 100000000;
let counts = [];
let delta = [];
let max_delta = 0;
let min_delta = block_size;

function setup() {
  createCanvas(512, 512);
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

function clamp(x, a, b) {
  // Clamp x in [a, b]
  return Math.min(Math.max(x, a), b);
}

function normalise(x, a, b) {
  // Take x in [a, b], normalise to [0, 1]
  return (x - a) / (b - a);
}

function nclamp(x, a, b) {
  // Take x in [a, b], normalise to [0, 1] with clamping.
  return clamp(normalise(x, a, b), 0, 1);
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

function renderDeltaLerp(g1, g2, count, exponent) {
  loadPixels()
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let v = 1 - Math.exp(- alpha * counts[x][y] / count * width * height);
      let d = Math.pow(nclamp(delta[x][y], min_delta, max_delta), exponent);
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

function populateCounts(a, b, c, d) {
  let x = 0.1; let y = 0.2;
  const x_width = 1 + Math.abs(c);
  const y_width = 1 + Math.abs(d);
  for (let i = 0; i < block_size; i++) {
    let xn = (Math.sin(a * y * y_width) + c * Math.cos(a * x * x_width)) / x_width;
    let yn = (Math.sin(b * x * x_width) + d * Math.cos(b * y * y_width)) / y_width;
    let dx = xn - x; let dy = yn - y;
    x = xn; y = yn;
    let xp = Math.floor((1 + xn) * width / 2);
    let yp = Math.floor((1 + yn) * height / 2);
    counts[xp][yp] += 1;
    delta[xp][yp] += (dx ** 2 + dy ** 2);
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      // Don't consider the unset deltas when calculating max and min.
      if (counts[x][y] == 0) {
        continue;
      }
      let d = delta[x][y];
      if (d > max_delta) {
        max_delta = d;
      }
      if (d < min_delta) {
        min_delta = d;
      }
    }
  }
}

function getGradientPair(bg, select) {
  // Select is [0, 1] normalised random number
  const c_reds = [bg, color(252, 181, 154), color(247, 93, 66), color(187, 20, 25), color(103, 0, 12)];
  const c_blues = [bg, color(192, 216, 237), color(96, 166, 209), color(23, 100, 171), color(8, 48, 107)];
  const c_RdPu = [bg, color(251, 191, 190), color(240, 90, 158), color(153, 1, 123), color(73, 0, 106)];
  const c_PuRd = [bg, color(210, 180, 215), color(225, 85, 165), color(184, 10, 78), color(103, 0, 31)];
  const c_BuPu = [bg, color(186, 207, 228), color(140, 138, 192), color(133, 44, 143), color(77, 0, 75)];

  if (select < 0.2) {
    return [c_reds, c_blues, 'eros'];
  } else if (select < 0.4) {
    return [c_blues, c_reds, 'erebus'];
  } else if (select < 0.6) {
    return [c_reds, c_BuPu, 'hypnos'];
  } else if (select < 0.8) {
    return [c_PuRd, c_blues, 'nesoi'];
  } else if (select < 0.9) {
    return [c_BuPu, c_blues, 'aether'];
  } else {
    return [c_RdPu, c_blues, 'chaos'];
  }
}

function uniform(a, b, select) {
  // Map [0, 1] normalised random number to [a, b]
  return a + select * (b - a);
}

function draw() {
  const a = uniform(1.75, 2.5, fxrand());
  const b = uniform(1.75, 2.5, fxrand());
  const c = uniform(1.0, 2.0, fxrand());
  const d = uniform(-1.0, -2.0, fxrand());
  console.log(a, b, c, d);
  populateCounts(a, b, c, d)


  // Define colors
  const bg = color(255, 250, 245);
  let pair = getGradientPair(bg, fxrand());
  let g1 = pair[0];
  let g2 = pair[1];
  let pairname = pair[2];
  console.log(pairname);

  render_select = fxrand();
  if (render_select < 0.9) {
    renderDeltaLerp(g1, g2, block_size, 0.22);
    render_type = 'bilinear';
  } else if (render_select < 0.95) {
    renderCorners(bg, g1, g2, block_size);
    render_type = 'corners';
  } else {
    renderDebug(bg, g1, g2, block_size);
    render_type = 'debug';
  }
  console.log(render_type);

  window.$fxhashFeatures = {
    "Render": render_type,
    "PairName": pairname
  }
}