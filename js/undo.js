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
// clear()