/***************************************
 *
 *  MANAGE FRAMES
 *
 ***************************************/

/* global dom file undo
   currentFrame  */

import state from "./state.js";
import {$$, addClass, previous, insertAfter} from "./dom.js";
import {onChange} from "./file.js";

function currentFrame() {
  let frame = document.querySelector(".frame.selected");
  if (!frame) {
    frame = dom.svg("g", { class: "frame selected" });
    canvas.insertBefore(frame, canvas.firstElementChild);
  }
  return frame;
}


function currentOnionskinFrame() {
  return $(".frame.onionskin");
}

function updateOnionskin() {
  if (!state.doOnionskin) return;
  $$('.frame.onionskin').forEach(frame => frame.classList.remove('onionskin'));
  addClass(previous(currentFrame(), ".frame"), "onionskin");
}

function insertFrame(before, frame) {
  insertAfter(frame, before);
  onChange();
  return frame;
}

function addFrame() {
  let curr = currentFrame();
  let frame = insertFrame(curr, dom.svg("g", { class: "frame" }));
  goToFrame(curr, frame);
}

function cloneFrame() {
  let curr = currentFrame();
  let frame = insertFrame(curr, curr.cloneNode(true));
  goToFrame(curr, frame);
}

function deleteFrame(suppressUndo) {
  let frameToDelete = currentFrame();
  if (frameToDelete.nextElementSibling) {
    incrementFrame(true);
  } else if (frameToDelete.previousElementSibling) {
    decrementFrame(true);
  }
  let curr = currentFrame();
  let parent = frameToDelete.parentNode;
  let next = frameToDelete.nextElementSibling;
  if (frameToDelete.parentNode.children.length > 1) {
    dom.remove(frameToDelete);
    if (!suppressUndo) {
      undo.pushDocUndo(
        "Delete Frame",
        frameToDelete,
        curr,
        () => {
          parent.insertBefore(frameToDelete, next);
          goToFrame(curr, frameToDelete);
        },
        () => deleteFrame(true)
      );
    }
    goToFrame(frameToDelete, curr);
  }
  onChange();
}

function restore(node, children, transform) {
  if (transform) {
    node.setAttribute("transform", transform);
  }
  children.forEach(child => node.appendChild(child));
  return node;
}

function clearFrame() {
  let curr = currentFrame();
  let oldTransform = curr.getAttribute("transform") || "";
  let children = [...curr.children];
  clear(curr);
  undo.pushUndo(
    "Clear",
    curr,
    () => restore(curr, children, oldTransform),
    () => clear(curr)
  );
}

function goToFrame(prev, next) {
  prev.classList.remove("selected");
  next.classList.add("selected");
  updateOnionskin();
  updateFrameCount();
  undo.update(next);
}

function incrementFrame() {
  let curr = currentFrame();
  let next = dom.next(curr, ".frame");
  if (next) {
    goToFrame(curr, next);
  }
}

function decrementFrame() {
  let curr = currentFrame();
  let prev = dom.previous(curr, ".frame");
  if (prev) {
    goToFrame(curr, prev);
  }
}

function goToFirstFrame() {
  let curr = currentFrame();
  let first = document.querySelector(".frame");
  goToFrame(curr, first);
}

function goToLastFrame() {
  const curr = currentFrame();
  const last = document.querySelector(".frame:last-child");
  goToFrame(curr, last);
}

export {currentOnionskinFrame, currentFrame, insertFrame, addFrame, cloneFrame, deleteFrame, clearFrame, goToFrame, incrementFrame, decrementFrame, goToFirstFrame, goToLastFrame};