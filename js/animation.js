
import {svg, removeClass, insertAfter, next, $, $$} from "./dom.js";
import state from "./state.js";
import ui from "./ui.js";

let _lastFrameTime = 0;

function playingFrame() {
  return $(".frame.play-frame");
}

function play() {
  // turn play button into stop button
  // disable all other controls
  // temporarily turn off onionskin (remember state)
  // start at beginning of document (remember state)
  let { x, y, width, height } = ui.getAnimationBBox();
  let onion = $(".onionskin");
  if (onion) {
    onion.classList.replace("onionskin", "nskin");
  }
  document.body.classList.add("playing");
  $(".frame").classList.add("play-frame");
  canvas.setAttribute("width", width + "px");
  canvas.setAttribute("height", height + "px");
  canvas.style.left = (document.body.clientWidth - width) / 2 + "px";
  canvas.style.top = (document.body.clientHeight - height) / 2 + "px";
  canvas.setAttribute("viewBox", [x, y, width, height].join(" "));
  // add SVG SMIL animation
  // Unless looping, call stop() when animation is finished
  // How much of this can I do by adding "playing" class to body?
  setTimeout(function() {
    _lastFrameTime = Date.now();
    requestAnimationFrame(playNextFrame);
  }, 500);
}

function stop() {
  // remove SMIL animation
  // re-enable all controls
  // return to the frame we were on
  // re-enable onionskin if needed
  // turn stop button into play button
  removeClass(playingFrame(), "play-frame");
  document.body.classList.remove("playing");
  let onion = $(".nskin");
  if (onion) {
    onion.classList.replace("nskin", "onionskin");
  }
  canvas.removeAttribute("viewBox");
  canvas.removeAttribute("style");
  canvas.setAttribute("width", document.body.clientWidth + "px");
  canvas.setAttribute("height", document.body.clientHeight + "px");
}

function playNextFrame() {
  let time = Date.now();
  if (time - _lastFrameTime < state.frameDelay) {
    requestAnimationFrame(playNextFrame);
    return;
  }
  let currFrame = playingFrame();
  _lastFrameTime = time;
  let nextFrame = next(currFrame, ".frame");
  if (nextFrame) {
    currFrame.classList.remove("play-frame");
    nextFrame.classList.add("play-frame");
    requestAnimationFrame(playNextFrame);
  } else {
    setTimeout(stop, 500);
  }
}

export {playingFrame, play};
