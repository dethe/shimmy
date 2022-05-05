import * as dom from "./dom.js";
const { $, $$, sendEvent } = dom;

class OverlayHelper {
  createOverlay() {
    this.overlay = dom.html("canvas", {
      width: innerWidth,
      height: innerHeight,
      style:
        "position:absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;",
    });
    this.ctx = this.overlay.getContext("2d");
    this.offset = 0;
    document.body.appendChild(this.overlay);
  }

  removeOverlay() {
    clearTimeout(this.timer);
    this.timer = null;
    this.overlay.remove();
    this.overlay = null;
    this.ctx = null;
  }

  drawAnchor() {
    if (!this.ctx) {
      this.createOverlay();
    }
    this.offset++;
    this.ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let angle = 0; angle < 12; angle++) {
      this.drawArrow(angle);
    }
    this.timer = setTimeout(() => this.drawAnchor(), 20);
  }

  drawRotationAnchor() {
    if (!this.ctx) {
      this.createOverlay();
    }
    this.ctx.save();
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    let off = this.offset * 0.05;
    this.ctx.arc(
      this.tool.anchorX,
      this.tool.anchorY,
      4,
      0 + off,
      1.75 * Math.PI + off
    );
    // this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(
      this.tool.anchorX,
      this.tool.anchorY,
      8,
      0.25 * Math.PI - off,
      2 * Math.PI - off
    );
    // this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(
      this.tool.anchorX,
      this.tool.anchorY,
      12,
      0.5 * Math.PI + off,
      2.25 * Math.PI + off
    );
    // this.ctx.stroke();
    this.drawAnts();
    this.ctx.restore();
    this.timer = setTimeout(() => this.drawRotationalAnchor(), 20);
  }

  drawAnts() {
    this.offset++;
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([4, 2]);
    this.ctx.lineDashOffset = -(this.offset % 8);
    this.ctx.stroke();
  }

  drawSelectBox(x1, y1, x2, y2) {
    if (!this.ctx) {
      this.createOverlay();
    }
    this.ctx.clearRect(0, 0, innerWidth, innerHeight);
    this.cts.save();
    this.ctx.rect(x1, y1, Math.abs(x2 - x1), Math.abs(y2 - y1));
    this.drawAnts();
    this.ctx.restore();
  }
}

export default OverlayHelper;
