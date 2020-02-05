// UNDO - REDO functionality
//
// API
//
// name: name of action: Draw, Pan, Rotate, Zoom, Clear, New Frame, Copy Frame, Delete Frame, Change Frame
// type: frame or document
//
// pushDocUndo(name, frameTarget, currentFrame, applyFn, restoreFn);
// pushFrameUndo(name, applyFn, restoreFn);
// undo(type); pops the relevant undo stack
// redo(type); pops the relevant redo stack
// switchFrame(newFrame); // because most undo is frame-based
// clear(); // reset, i.e., when a new document is created
//
// Use events for enabling/disabling buttons and changing button labels
// Events: document.addEventListener('shimmy-undo-change', handler, true);
// function undoHandler(evt){
//   evt.detail.frameUndo = nameOfFrameUndo or null;
//   evt.detail.frameRedo = nameOfFrameRedo or null;
//   evt.detail.docUndo = nameOfDocUndo or null;
//   evt.detail.docRedo = nameOfDocRedo or null;
// }

function UndoRedo(frame) {
  const documentUndoStack = [];
  const documentRedoStack = [];
  const frameUndoStack = new Map();
  const frameRedoStack = new Map();
  let currentFrame = frame;
  [...currentFrame.parentElement.children].forEach(frame => {
    frameUndoStack[frame] = [];
    frameRedoStack[frame] = [];
  });

  // look at the top item of a stack
  const peek = stack => (stack.length ? stack[stack.length - 1].name : null);

  // for map copying a stack
  const copy = item => (item.cloneNode ? item.cloneNode(true) : item);

  const sendEvent = () => {
    let evt = new CustomEvent("shimmy-undo-change", {
      detail: {
        frameUndo: peek(frameUndoStack[currentFrame]),
        frameRedo: peek(frameRedoStack[currentFrame]),
        docUndo: peek(documentUndoStack),
        docRedo: peek(documentRedoStack)
      }
    });
    document.dispatchEvent(evt);
  };

  const pushDocUndo = (name, targetFrame, newCurrentFrame, undoFn, redoFn) => {
    // NOTE: 'document' type actions can change the currentFrame
    currentFrame = newCurrentFrame;
    // Special handling for particular events
    switch (name) {
      case "New Frame":
        // add a frame to the frameUndoStack and frameRedoStack
        // frameTarget and currentFrame should be the same
        frameUndoStack.set(newCurrentFrame, []);
        frameRedoStack.set(newCurrentFrame, []);
        break;
      case "Copy Frame":
        // add a frame to the frameUndoStack and frameRedoStack
        // copy undo stack and redo stack from old frame to new frame
        // frameTarget should be the frame being copied, frame
        frameUndoStack.set(
          newCurrentFrame,
          frameUndoStack[targetFrame].map(copy)
        );
        frameRedoStack.set(
          newCurrentFrame,
          frameRedoStack[targetFrame].map(copy)
        );
        break;
      case "Delete Frame":
        // Target frame has been removed. Save undo and redo stacks in case it is restored.
        undoFn.undoStack = frameUndoStack.get(targetFrame);
        undoFn.redoStack = frameRedoStack.get(targetFrame);
        frameUndoStack.delete(targetFrame);
        frameRedoStack.delete(targetFrame);
        break;
      case "Change Frame":
        // Do Nothing
        break; 
      default:
        console.error(
          "We should not get here => pushDocUndo unknown type: %s",
          name
        );
        return;
        break;
    }
    documentUndoStack.push({
      name,
      targetFrame,
      currentFrame: newCurrentFrame,
      undoFn,
      redoFn
    });
    documentRedoStack.clear();
    sendEvent();
  };

  const pushFrameUndo = (name, applyFn, restoreFn) => {
    // Special handling for particular events
    switch (name) {
      case "Draw":
        break;
      case "Pan":
        break;
      case "Rotate":
        break;
      case "Zoom":
        break;
      case "Clear":
        break;
    }
    frameUndoStack[currentFrame].push({name, applyFn, restoreFn});
    frameRedoStack[currentFrame].clear();
    sendEvent();
  };

  const docUndo = () => {
    let action = documentUndoStack.pop();
    action.undoFn();
    if (action.undoStack) {
      frameUndoStack[action.targetFrame] = action.undoStack;
      frameRedoStack[action.targetFrame] = action.redoStack;
    }
    documentRedoStack.push(action);
  };

  const docRedo = () => {
    let action = documentRedoStack.pop();
    action.redoFn();
    documentUndoStack.push(action);
  };

  const frameUndo = () => {
    let action = frameUndoStack[currentFrame].pop();
    action.undoFn();
    frameRedoStack[currentFrame].push(action);
  };

  const frameRedo = () => {
    let action = frameRedoStack[currentFrame].pop();
    action.undoFn();
    frameRedoStack[currentFrame].push(action);
  };

  const switchFrame = frame => (currentFrame = frame);

  return {
    frameUndo,
    frameRedo,
    docUndo,
    docRedo,
    pushFrameUndo,
    pushDocUndo,
    switchFrame
  };
}
