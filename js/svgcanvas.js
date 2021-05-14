class SVGCanvas {
  constructor(frame, x, y, width, height) {
    this.canvas = dom.html("canvas", {
      width: width,
      height: height,
      class: "storyboard-frame"
    });
    this.ctx = this.canvas.getContext("2d");
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.svg = frame;
    this.offset = { x, y };
    this.draw();
  }

  draw() {
    this.setTransforms();
    let lines = this.svg.querySelectorAll("path");
    lines.forEach(line => this.drawLine(line));
  }

  setTransforms() {
    let { a, b, c, d, e, f } = this.svg.getCTM();
    this.ctx.setTransform(a, b, c, d, e - this.offset.x, f - this.offset.y);
  }

  translate(x, y) {
    this.ctx.translate(x, y);
  }

  scale(x) {
    this.ctx.scale(x, x);
  }

  rotate(angle, cx, cy) {
    this.ctx.translate(cx, cy);
    this.ctx.rotate(radians(angle));
    this.ctx.translate(-cx, -cy);
  }

  drawLine(line) {
    this.ctx.beginPath();
    this.ctx.lineWidth = Number(line.getAttribute("stroke-width"));
    this.ctx.strokeStyle = line.getAttribute("stroke");
    let path = line
      .getAttribute("d")
      .slice(1)
      .trim()
      .split(/\s*L\s*/);
    let pairs = path.map(p => p.split(/\s*,\s*/).map(Number));
    let start = pairs.shift();
    this.ctx.moveTo(...start);
    pairs.forEach(p => {
      this.ctx.lineTo(...p);
    });
    this.ctx.stroke();
  }
}

export default SVGCanvas;