// Copyright (C) 2020 Dethe Elza

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import ui from "/shimmy/js/ui.js";
import { $, $$, html } from "/shimmy/js/dom.js";

function frameToThumbnail(frame) {
  return ui.frameToImage(frame, 0, 0, WIDTH, HEIGHT, 64);
}

function thumbnailForFrame(frame) {
  if (!frame) {
    console.error("error: no frame in thumbnailForFrame");
    return null;
  }
  let thumb = $(`#${frame.id}-canvas`);
  return thumb;
}

function frameForThumbnail(thumb) {
  return $(`#${thumb.id.split("-")[0]}`);
}

function makeThumbnails() {
  const tl = $(".timeline-frames");
  tl.innerHTML = ""; // remove any existing children
  $$(".frame").forEach(frame => {
    const thumb = frameToThumbnail(frame);
    tl.appendChild(html("div", [thumb]));
  });
  tl.children[state.currentFrame].firstChild.classList.add("selected");
  tl.children[state.currentFrame].firstChild.scrollIntoView();
}

function updateThumbnail(frame) {
  const oldThumb = thumbnailForFrame(frame);
  const newThumb = frameToThumbnail(frame);
  if (oldThumb.classList.contains("selected")) {
    newThumb.classList.add("selected");
  }
  oldThumb.replaceWith(newThumb);
  newThumb.scrollIntoView();
}

function addThumbnail(frame) {
  const oldFrame = frame.nextElementSibling;
  const oldThumb = oldFrame
    ? thumbnailForFrame(frame.nextElementSibling).parentNode
    : null;
  const newThumb = html("div", [frameToThumbnail(frame)]);
  $(".timeline-frames").insertBefore(newThumb, oldThumb);
  newThumb.scrollIntoView();
}

function removeThumbnail(frame) {
  this.thumbnailForFrame(frame).parentNode.remove();
}

function toggleTimeline() {
  document.body.classList.toggle("notimeline");
}

function selectThumbnail(frame) {
  $$(".canvas-frame.selected").forEach(thumb =>
    thumb.classList.remove("selected")
  );
  let nextThumb = thumbnailForFrame(frame);
  nextThumb.classList.add("selected");
  nextThumb.scrollIntoView();
}

export {
  frameToThumbnail,
  frameForThumbnail,
  thumbnailForFrame,
  makeThumbnails,
  updateThumbnail,
  addThumbnail,
  removeThumbnail,
  selectThumbnail,
  toggleTimeline,
};
