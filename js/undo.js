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
  
  const pushDocUndo = (name, frameTarget, currentFrame, applyFn, restoreFn) => {
      // NOTE: 'document' type actions can change the currentFrame
    switch(name){
      case 'New Frame':
        // add a frame to the frameUndoStack and frameRedoStack
        // frameTarget and currentFrame should be the same
        frameUndoStack.set(frameTarget, []);
        break;
      case 'Copy Frame':
        // add a frame to the frameUndoStack and frameRedoStack
        // frameTarget should be the frame being copied, frame        
        frameUndoStack.set(frameTarget, [])
        break;
      case 'Delete Frame':
        break
      default:
        break;
    }
  };
  
  const pushFrameUndo = (name, applyFn, restorFn) => {
  };
  
  const docUndo = () => {
    
  };
  
  const docRedo = () => {
  
  };
  
  const frameUndo = () => {
    
  };
  
  const redo = (type) => {
    
  }
  
  return{
    frameUndo,
    frameRedo,
    docUndo,
    docRedo,
    pushFrameUndo,
    pushDocumentUndo
  }; 
}