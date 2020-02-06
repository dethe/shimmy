// UNDO - REDO functionality
//
// API
//
// name: name of action: Draw, Move, Rotate, Zoom, Clear, New Frame, Copy Frame, Delete Frame, Change Frame
// type: frame or document
//
// pushDocUndo(name, frameTarget, currentFrame, undoFn, redoFn);
// pushFrameUndo(name, undoFn, redoFn);
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
    frameUndoStack.set(frame, []);
    frameRedoStack.set(frame, []);
  });

  // look at the top item of a stack
  const peek = stack => (stack.length ? stack[stack.length - 1].name : null);

  // for map copying a stack
  const copy = item => (item.cloneNode ? item.cloneNode(true) : item);

  const sendEvent = () => {
    let evt = new CustomEvent("shimmy-undo-change", {
      detail: {
        frameUndo: peek(frameUndoStack.get(currentFrame)),
        frameRedo: peek(frameRedoStack.get(currentFrame)),
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
          frameUndoStack.get(targetFrame).map(copy)
        );
        frameRedoStack.set(
          newCurrentFrame,
          frameRedoStack.get(targetFrame).map(copy)
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
    documentRedoStack.length = 0;
    sendEvent();
  };

  const pushFrameUndo = (name, undoFn, redoFn) => {
    // Special handling for particular events
    switch (name) {
      case "Draw":
        break;
      case "Move":
        break;
      case "Rotate":
        break;
      case "Zoom":
        break;
      case "Clear":
        break;
    }
    frameUndoStack.get(currentFrame).push({name, undoFn, redoFn});
    frameRedoStack.get(currentFrame).length = 0;
    sendEvent();
  };

  const docUndo = () => {
    let action = documentUndoStack.pop();
    action.undoFn();
    // handle special case of copying a frame, which copies undo/redo stacks of the frame
    if (action.undoStack) {
      frameUndoStack.set(action.targetFrame, action.undoStack);
      frameRedoStack.set(action.targetFrame,  action.redoStack);
    }
    documentRedoStack.push(action);
    sendEvent();
  };

  const docRedo = () => {
    let action = documentRedoStack.pop();
    action.redoFn();
    documentUndoStack.push(action);
    sendEvent();
  };

  const frameUndo = () => {
    let action = frameUndoStack.get(currentFrame).pop();
    action.undoFn();
    frameRedoStack.get(currentFrame).push(action);
    sendEvent();
  };

  const frameRedo = () => {
    let action = frameRedoStack.get(currentFrame).pop();
    action.redoFn();
    frameUndoStack.get(currentFrame).push(action);
    sendEvent();
  };

  const switchFrame = frame => {
    currentFrame = frame;
    sendEvent();
  };
    
  
  // clear buttons on when new doc is created
  sendEvent();

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
