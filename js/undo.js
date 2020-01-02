// UNDO - REDO functionality
// 
// API
// 
// name: name of action: Draw, Pan, Rotate, Zoom, Clear, New Frame, Copy Frame, Delete Frame
// type: frame or document
//
// pushUndo(name, type, applyFn, restoreFn);
// undo(type); pops the relevant undo stack
// redo(type); pops the relevant redo stack
// switchFrame(newFrame); // because most undo is frame-based
// clear(); // reset, i.e., when a new document is created
//
// Use events for enabling/disabling buttons and changing button labels
// Events: document.addEventListener('shimmy-undo-change', handler, true);
// function undoHandler(evt){
//   evt.frameUndo = nameOfFrameUndo or null;
//   evt.frameRedo = nameOfFrameRedo or null;
//   evt.docUndo = nameOfDocUndo or null;
//   evt.docRedo = nameOfDocRedo or null;
// }

(function(){
  const documentUndoStack = [];
  const documentRedoStack = [];
  const framesUndoStack = new Map();
  const frameRedoStack = new Map();
  let currentFrame = null;
  
  const init = (frame) => 
  
  const pushUndo = (name, type, applyFn, restoreFn) => {
    
  };
  
  const undo = (type) => {
    
  }
  
  const redo = (type) => {
    
  }
  
  window.undoredo = {
    init(currentFrame);
    undo,
    redo,
    pushUndo
  }
  
})();