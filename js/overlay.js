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
    if (this.overlay) {
      this.overlay.remove();
    }
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
    this.ctx.clearRect(0, 0, innerWidth, innerHeight);
    this.ctx.save();
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    let off = this.offset * 0.05;
    this.ctx.arc(this.anchorX, this.anchorY, 4, 0 + off, 1.75 * Math.PI + off);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(
      this.anchorX,
      this.anchorY,
      8,
      0.25 * Math.PI - off,
      2 * Math.PI - off
    );
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(
      this.anchorX,
      this.anchorY,
      12,
      0.5 * Math.PI + off,
      2.25 * Math.PI + off
    );
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(this.anchorX, this.anchorY);
    this.ctx.lineTo(this.mouseX, this.mouseY);
    this.drawAnts();
    this.ctx.restore();
    this.timer = setTimeout(() => this.drawRotationAnchor(), 20);
  }

  drawAnts() {
    this.offset++;
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([4, 2]);
    this.ctx.lineDashOffset = -(this.offset % 8);
    this.ctx.stroke();
  }

  drawSelectBox() {
    if (!this.ctx) {
      this.createOverlay();
    }
    this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    this.ctx.save();
    let x = Math.min(this.ax, this.px);
    let y = Math.min(this.ay, this.py);
    let width = Math.abs(this.ax - this.px);
    let height = Math.abs(this.ay - this.py);
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.drawAnts();
    this.ctx.restore();
    this.timer = setTimeout(() => this.drawSelectBox(), 20);
  }
}

export default OverlayHelper;
