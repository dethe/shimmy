class Pen {
  constructor() {
    this.name = "pen";
    this.drawing = false;
    this.currentPath = null;
    this.prevPoint = null;
  }

  startPath(x, y) {
    let path = dom.svg("path", {
      d: `M${x},${y}`,
      stroke: currentColor,
      "stroke-width": currentStrokeWidth,
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
      fill: "none"
    });
    this.currentPath = currentFrame().appendChild(path);
    // console.log('currentPath: %o', this.currentPath);
    file.onChange();
  }

  appendToPath(x, y) {
    this.currentPath.setAttribute(
      "d",
      this.currentPath.getAttribute("d") + ` L${x},${y}`
    );
  }

  start(evt) {
    saveMatrix();
    let { x, y, err } = getXY(evt);
    if (err) {
      return;
    }
    this.firstPoint = { x, y };
    this.prevPoint = { x, y };
    this.startPath(x, y);
    this.drawing = true;
  }

  move(evt) {
    if (!this.drawing) return;
    let { x, y, wx, wy, err } = getXY(evt);
    if (err) {
      return;
    }
    // if (collideCircle({ x, y }, 1, this.prevPoint, 1)) {
    //   // too close to previous point to both drawing
    //   return;
    // }
    this.prevPoint = {x,y};
    if (inBounds(wx, wy)) {
      this.appendToPath(x, y);
    }
  }

  stop(evt) {
    if (!this.drawing) return;
    let { x, y, wx, wy, err } = getXY(evt);
    if (err) {
      return;
    }
    let path = this.currentPath;
    let parent = currentFrame();
    if (this.currentPath) {
      if (inBounds(wx, wy) && this.sx === x && this.sy === y) {
        this.appendToPath(x, y);
      }
      //dom.simplifyPath(currentPath);
      this.currentPath = null;
    }
    this.drawing = false;
    currentMatrix = null;
    undo.pushFrameUndo(
      "Draw",
      () => path.remove(),
      () => parent.appendChild(path)
    );
  }

  cancel() {
    this.currentPath.remove();
    this.currentPath = null;
    currentMatrix = null;
  }
}

class Move {
  constructor() {
    this.name = "move";
    this.dragging = false;
    this.px = 0;
    this.py = 0;
  }

  start(evt) {
    saveMatrix();
    let { x, y, err } = getXY(evt);
    if (err) {
      return;
    }
    this.px = x;
    this.py = y;
    this.dragging = true;
    this.origTransform = currentFrame().getAttribute("transform") || "";
  }

  move(evt) {
    if (!this.dragging) {
      return;
    }
    let { x, y, err } = getXY(evt);
    if (err) {
      return;
    }
    let dx = x - this.px;
    let dy = y - this.py;
    currentFrame().setAttribute(
      "transform",
      `${this.origTransform} translate(${dx} ${dy})`
    );
  }

  stop(evt) {
    if (!this.dragging) {
      return;
    }
    this.px = 9;
    this.py = 0;
    this.dragging = false;
    let oldTransform = this.origTransform;
    this.origTransform = "";
    currentMatrix = null;
    let curr = currentFrame();
    let newTransform = curr.getAttribute("transform");
    undo.pushFrameUndo(
      "Move",
      () => curr.setAttribute("transform", oldTransform),
      () => curr.setAttribute("transform", newTransform)
    );
  }

  cancel() {
    currentFrame().setAttribute("transform", this.origTransform);
    this.dragging = false;
    this.origTransform = false;
    currentMatrix = null;
  }
}

function dist(dx, dy) {
  return Math.sqrt(dx * dx + dy * dy);
}

class Rotate {
  constructor() {
    this.name = "rotate";
    this.dragging = false;
    this.px = 0;
    this.py = 0;
    this.originalAngle = null;
  }

  start(evt) {
    saveMatrix();
    let { x, y, err } = getXY(evt);
    if (err) {
      return;
    }
    this.px = x;
    this.py = y;
    this.dragging = true;
    this.origTransform = currentFrame().getAttribute("transform") || "";
  }

  move(evt) {
    if (!this.dragging) {
      return;
    }
    let { x, y, err } = getXY(evt);
    if (err) {
      return;
    }
    let px = this.px;
    let py = this.py;
    let dx = x - px;
    let dy = y - py;
    if (dist(dx, dy) < 20) {
      return;
    } // don't pick starting angle until we've moved a little from the starting point
    if (this.originalAngle !== null) {
      let transform = this.origTransform;
      let angle = degrees(Math.atan2(dy, dx)) - this.originalAngle;
      currentFrame().setAttribute(
        "transform",
        `${transform} rotate(${angle} ${px} ${py})`
      );
    } else {
      this.originalAngle = degrees(Math.atan2(dy, dx));
    }
  }

  stop(evt) {
    if (!this.dragging) {
      return;
    }
    this.px = 9;
    this.py = 0;
    this.dragging = false;
    let oldTransform = this.origTransform;
    this.origTransform = "";
    this.originalAngle = null;
    currentMatrix = null;
    let curr = currentFrame();
    let newTransform = curr.getAttribute("transform");
    undo.pushFrameUndo(
      "Rotate",
      () => curr.setAttribute("transform", oldTransform),
      () => curr.setAttribute("transform", newTransform)
    );
  }

  cancel(evt) {
    currentFrame().setAttribute("transform", this.origTransform);
    this.dragging = false;
    this.origTransform = false;
    currentMatrix = null;
  }
}

class ZoomIn {
  constructor() {
    this.name = "zoomin";
  }

  start(evt) {
    saveMatrix();
    let { x, y, err } = getXY(evt);
    if (err) {
      return;
    }
    let curr = currentFrame();
    let oldTransform = curr.getAttribute("transform") || "";
    let newTransform = `${oldTransform} translate(${x} ${y}) scale(${ZOOMIN}) translate(-${x}, -${y})`;
    currentFrame().setAttribute("transform", newTransform);
    currentMatrix = null;
    undo.pushFrameUndo(
      "Zoom In",
      () => curr.setAttribute("transform", oldTransform),
      () => curr.setAttribute("transform", newTransform)
    );
  }

  move(evt) {
    // do nothing
  }

  stop(evt) {
    // do nothing
  }

  cancel(evt) {
    // do nothing
  }
}

class ZoomOut {
  constructor() {
    this.name = "zoomout";
  }

  start(evt) {
    saveMatrix();
    let { x, y, err } = getXY(evt);
    if (err) {
      return;
    }
    let curr = currentFrame();
    let oldTransform = curr.getAttribute("transform") || "";
    let newTransform = `${oldTransform} translate(${x} ${y}) scale(${ZOOMOUT}) translate(-${x}, -${y})`;
    currentFrame().setAttribute("transform", newTransform);
    currentMatrix = null;
    undo.pushFrameUndo(
      "Zoom Out",
      () => curr.setAttribute("transform", oldTransform),
      () => curr.setAttribute("transform", newTransform)
    );
  }

  move(evt) {
    // do nothing
  }

  stop(evt) {
    // do nothing
  }

  cancel(evt) {
    // do nothing
  }
}

class Eraser {
  constructor() {
    this.name = "eraser";
  }

  collidePaths(x, y) {
    let paths = Array.from(currentFrame().querySelector("path"));
    // quck check to try to eliminate paths that don't intersect
    let d = currentEraserWidth / 2;
    let eraserBox = {
      x: x - d,
      y: y - d,
      width: currentEraserWidth,
      height: currentEraserWidth
    };
    return paths.filter(path =>
      collideBox(eraserBox, path.getBBox({ stroke: true }))
    );
  }

  start(evt) {
    saveMatrix();
    let { x, y, wx, wy, err } = getXY(evt);
    if (err) {
      return;
    }
    if (collideCircle({ x, y }, 1, this.prevPoint, 1)) {
      // too close to previous point to both erasing
      return;
    }
  }

  move(evt) {
    if (!this.drawing) return;
    let { x, y, wx, wy, err } = getXY(evt);
    if (err) {
      return;
    }
    if (inBounds(wx, wy)) {
      this.appendToPath(x, y);
    }
  }

  stop(evt) {
    if (!this.drawing) return;
    let { x, y, wx, wy, err } = getXY(evt);
    if (err) {
      return;
    }
    let path = this.currentPath;
    let parent = currentFrame();
    if (this.currentPath) {
      if (
        inBounds(wx, wy) &&
        this.firstPoint.x === x &&
        this.firstPoint.y === y
      ) {
        // We haven't drawn a line, ending on the same spot, but make a dot anyway.
        this.appendToPath(x, y);
      }
      this.currentPath = null;
    }
    this.drawing = false;
    currentMatrix = null;
    undo.pushFrameUndo(
      "Draw",
      () => path.remove(),
      () => parent.appendChild(path)
    );
  }

  cancel() {
    this.currentPath.remove();
    this.currentPath = null;
    currentMatrix = null;
  }
}

// UTILITIES

function pointsFromPath(path) {
  let coords = path
    .getAttribute("d")
    .split(/[ ,LM]+/)
    .map(Number);
  // First one is empty
  let points = [];
  while (coords.length) {
    points.push((points.shift(), points.shift()));
  }
  return points;
}

// Because points are actually circles (due to penWidth / eraserWidth) this is a basic circl collision algorithm
function collideCircle(p1, r1, p2, r2) {
  return (
    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) > Math.pow(r1 + r2, 2)
  );
}

function collideBox(r1, r2) {
  if (r1.x + r1.width < r2.x) {
    return false;
  }
  if (r1.y + r1.height < r2.y) {
    return false;
  }
  if (r1.x > r2.y + r2.width) {
    return false;
  }
  if (r1.y > r2.y + r2.height) {
    return false;
  }
  return true;
}
