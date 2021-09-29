/***************************************
 *
 *  MANAGE FRAMES
 *
 ***************************************/

import state from "./state.js";
import ui from "./ui.js";
import * as dom from "./dom.js";
const { $, $$ } = dom;
import * as undo from "./undo.js";

function updateOnionskin() {
  if (!state.doOnionskin) return;
  $$(".frame.onionskin").forEach(frame => frame.classList.remove("onionskin"));
  dom.addClass(dom.previous(ui.currentFrame(), ".frame"), "onionskin");
}

function insertFrame(before, frame) {
  dom.insertAfter(frame, before);
  frame.id = dom.randomId();
  ui.addThumbnail(frame);
  return frame;
}

function addFrame() {
  let curr = ui.currentFrame();
  let frame = insertFrame(curr, dom.svg("g", { class: "frame" }));
  goToFrame(curr, frame);
}

function cloneFrame() {
  let curr = ui.currentFrame();
  let frame = insertFrame(curr, curr.cloneNode(true));
  goToFrame(curr, frame);
}

function deleteFrame(suppressUndo) {
  let frameToDelete = ui.currentFrame();
  if (frameToDelete.nextElementSibling) {
    incrementFrame(true);
  } else if (frameToDelete.previousElementSibling) {
    decrementFrame(true);
  }
  let curr = ui.currentFrame();
  let parent = frameToDelete.parentNode;
  let next = frameToDelete.nextElementSibling;
  if (frameToDelete.parentNode.children.length > 1) {
    dom.remove(frameToDelete);
    ui.removeThumbnail(frameToDelete);
    if (!suppressUndo) {
      undo.pushDocUndo(
        "Delete Frame",
        frameToDelete,
        curr,
        () => {
          parent.insertBefore(frameToDelete, next);
          ui.addThumbnail(frameToDelete);
          goToFrame(curr, frameToDelete);
        },
        () => deleteFrame(true)
      );
    }
    goToFrame(frameToDelete, curr);
  }
}

function restore(node, children, transform) {
  if (transform) {
    node.setAttribute("transform", transform);
  }
  children.forEach(child => node.appendChild(child));
  ui.updateThumbnail(node);
  return node;
}

function clearFrame(curr) {
  if (!curr) {
    curr = ui.currentFrame();
  }
  let oldTransform = curr.getAttribute("transform") || "";
  let children = [...curr.children];
  dom.clear(curr);
  ui.updateThumbnail(curr);
  undo.pushUndo(
    "Clear",
    curr,
    () => restore(curr, children, oldTransform),
    () => clearFrame(curr)
  );
}

function goToFrame(prev, next) {
  if (next.classList.contains("selected")){
    // Trying to go to frame that is already selected
    return;
  }
  prev.classList.remove("selected");
  let prevThumb = ui.thumbnailForFrame(prev);
  prevThumb.classList.remove("selected");
  next.classList.add("selected");
  let nextThumb = ui.thumbnailForFrame(next);
  nextThumb.classList.add("selected");
  nextThumb.scrollIntoView();
  updateOnionskin();
  ui.updateFrameCount();
  undo.update(next);
}

function incrementFrame() {
  let curr = ui.currentFrame();
  let next = dom.next(curr, ".frame");
  if (next) {
    goToFrame(curr, next);
  }
}

function decrementFrame() {
  let curr = ui.currentFrame();
  let prev = dom.previous(curr, ".frame");
  if (prev) {
    goToFrame(curr, prev);
  }
}

function goToFirstFrame() {
  let curr = ui.currentFrame();
  let first = $(".frame");
  goToFrame(curr, first);
}

function goToLastFrame() {
  const curr = ui.currentFrame();
  const last = $(".frame:last-child");
  goToFrame(curr, last);
}

window.goToFrame = goToFrame;

export {
  insertFrame,
  addFrame,
  cloneFrame,
  deleteFrame,
  clearFrame,
  goToFrame,
  incrementFrame,
  decrementFrame,
  goToFirstFrame,
  goToLastFrame,
  updateOnionskin,
};
