/***************************************
 *
 *  MANAGE FRAMES
 *
 ***************************************/

/* global dom file undo
   currentFrame currentDoOnionskin updateFrameCount */

function isOnionskinOn() {
  return currentDoOnionskin;
}

function currentOnionskinFrame() {
  return document.querySelector(".frame.onionskin");
}

function updateOnionskin() {
  if (!isOnionskinOn()) return;
  dom.removeClass(currentOnionskinFrame(), "onionskin");
  dom.addClass(dom.previous(currentFrame(), ".frame"), "onionskin");
}

function insertFrame(before, frame) {
  dom.insertAfter(frame, before);
  file.onChange();
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
  file.onChange();
}

function restore(node, children, transform) {
  if (transform) {
    node.setAttribute("transform", transform);
  }
  children.forEach(child => node.appendChild(child));
  return node;
}

function _clear() {
  let curr = currentFrame();
  let oldTransform = curr.getAttribute("transform") || "";
  let children = [...curr.children];
  dom.clear(curr);
  undo.pushUndo(
    "Clear",
    curr,
    () => restore(curr, children, oldTransform),
    () => dom.clear(curr)
  );
}

function setOnionSkin(input) {
  currentDoOnionskin = input.checked;
  toggleOnionskin();
}

function toggleOnionskin() {
  if (isOnionskinOn()) {
    dom.addClass(currentFrame().previousElementSibling, "onionskin");
  } else {
    dom.removeClass(currentOnionskinFrame(), "onionskin");
  }
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

function gotoFirstFrame() {
  let curr = currentFrame();
  let first = document.querySelector(".frame");
  goToFrame(curr, first);
}

function gotoLastFrame() {
  const curr = currentFrame();
  const last = document.querySelector(".frame:last-child");
  goToFrame(curr, last);
}
