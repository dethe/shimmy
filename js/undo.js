// UNDO - REDO functionality
// 
// API
// 
// name: name of action: Draw, Pan, Rotate, Zoom, Clear, New Frame, Copy Frame, Delete Frame
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

function UndoRedo(frame){
  const documentUndoStack = [];
  const documentRedoStack = [];
  const frameUndoStack = new Map();
  const frameRedoStack = new Map();
  let currentFrame = frame;
  
  // look at the top item of a stack
  const peek = (stack) => stack.length ? stack[stack.length -1].name : null;
  
  // for map copying a stack
  const copy = (item) => item.cloneNode ? item.cloneNode(true) : item;
  
  const sendEvent = () => {
    let evt = new CustomEvent('shimmy-undo-change', {detail: {
      frameUndo: peek(frameUndoStack[currentFrame]),
      frameRedo: peek(frameRedoStack[currentFrame]),
      docUndo: peek(documentUndoStack),
      docRedo: peek(documentRedoStack)
    }});
    document.dispatchEvent(evt);
  }
  
  const pushDocUndo = (name, frameTarget, newCurrentFrame, undoFn, redoFn) => {
      // NOTE: 'document' type actions can change the currentFrame
    currentFrame = newCurrentFrame;
    switch(name){
      case 'New Frame':
        // add a frame to the frameUndoStack and frameRedoStack
        // frameTarget and currentFrame should be the same
        frameUndoStack.set(newCurrentFrame, []);
        frameRedoStack.set(newCurrentFrame, []);
        break;
      case 'Copy Frame':
        // add a frame to the frameUndoStack and frameRedoStack
        // copy undo stack and redo stack from old frame to new frame
        // frameTarget should be the frame being copied, frame
        frameUndoStack.set(newCurrentFrame, frameUndoStack[frameTarget].map(copy));
        frameRedoStack.set(newCurrentFrame, frameRedoStack[frameTarget].map(copy));
        break;
      case 'Delete Frame':
        // Target frame has been removed. Save undo and redo stacks in case it is restored.
        undoFn.undoStack = frameUndoStack.get(targetFrame);
        undoFn.redoStack = frameRedoStack.get(targetFrame);
        frameUndoStack.delete(targetFrame);
        frameRedoStack.delete(targetFrame);
        break
      default:
        console.error('We should not get here => pushDocUndo unknown type: %s', name);
        return;
        break;
    }
        docUndoStack.push({name, frameTarget, currentFrame: newCurrentFrame, undoFn, redoFn});
    sendEvent()
  };
  
  const pushFrameUndo = (name, applyFn, restoreFn) => {
    switch(name){
      case 'Draw':
        break;
      case 'Pan':
        break;
      case 'Rotate':
        break;
      case 'Zoom':
        break;
      case 'Clear':
        break;
    }
  };
  
  const docUndo = () => {
    let action = documentUndoStack.pop();
    action.undoFn();
    if (action.undoStack){
      
    }
    documentRedoStack.push(action);
  };
  
  const docRedo = () => {
  
  };
  
  const frameUndo = () => {
    
  };
  
  const frameRedo = () => {
    
  }
  
  const switchFrame = (frame) =>  currentFrame = frame;
  
  return{
    frameUndo,
    frameRedo,
    docUndo,
    docRedo,
    pushFrameUndo,
    pushDocUndo,
    switchFrame
  }; 
}