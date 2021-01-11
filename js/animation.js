function playingFrame() {
  return document.querySelector(".frame.play-frame");
}


function getAnimationBBox(show) {
  let frames = Array.from(document.querySelectorAll(".frame"));
  let boxes = frames.map(frame => {
    if (frame.classList.contains("selected")) {
      return frame.getBoundingClientRect();
    } else {
      frame.classList.add("selected");
      let box = frame.getBoundingClientRect();
      frame.classList.remove("selected");
      return box;
    }
  });
  let box = {
    x: Math.max(Math.floor(Math.min(...boxes.map(b => b.x))) - 10, 0),
    y: Math.max(Math.floor(Math.min(...boxes.map(b => b.y))) - 10, 0),
    right: Math.min(
      Math.floor(Math.max(...boxes.map(b => b.right))) + 10,
      document.body.clientWidth
    ),
    bottom: Math.min(
      Math.floor(Math.max(...boxes.map(b => b.bottom))) + 10,
      document.body.clientHeight
    )
  };
  box.width = box.right - box.x;
  box.height = box.bottom - box.y;
  if (show) {
    dom.insertAfter(
      dom.svg("rect", {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        stroke: "red",
        fill: "none"
      }),
      currentFrame()
    );
  }
  return box;
}

function play() {
  // turn play button into stop button
  // disable all other controls
  // temporarily turn off onionskin (remember state)
  // start at beginning of document (remember state)
  let { x, y, width, height } = getAnimationBBox();
  let onion = document.querySelector(".onionskin");
  if (onion) {
    onion.classList.replace("onionskin", "nskin");
  }
  document.body.classList.add("playing");
  document.querySelector(".frame").classList.add("play-frame");
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
  dom.removeClass(playingFrame(), "play-frame");
  document.body.classList.remove("playing");
  let onion = document.querySelector(".nskin");
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
  if (time - _lastFrameTime < currentFrameDelay) {
    requestAnimationFrame(playNextFrame);
    return;
  }
  let currFrame = playingFrame();
  _lastFrameTime = time;
  let next = dom.next(currFrame, ".frame");
  if (next) {
    currFrame.classList.remove("play-frame");
    next.classList.add("play-frame");
    requestAnimationFrame(playNextFrame);
  } else {
    setTimeout(stop, 500);
  }
}
