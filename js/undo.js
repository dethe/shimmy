// Copyright (C) 2020 Richmond Public Library

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// UNDO - REDO functionality
//
// API
//
// name: name of action: Draw, Move, Rotate, Zoom, Erase, Clear, New Frame, Copy Frame, Delete Frame, Change Frame
// type: frame or document
//
// pushDocUndo(name, frameTarget, currentFrame, undoFn, redoFn);
// pushUndo(name, frame, undoFn, redoFn);
// undo(frame); pops the relevant undo stack
// redo(frame); pops the relevant redo stack
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

/* globals Mess */

const undo = (function UndoRedo(frame) {
  const undoStack = new Map();
  const redoStack = new Map();
  const mess = new Mess(); // toast-style popups for document-level undo messages
  mess.init();
  
  const clear = () => {
    undoStack.clear();
    redoStack.clear();
  }

  const getUndoStack = frame => {
    let stack = undoStack.get(frame);
    if (!stack){
      stack = [];
      undoStack.set(frame, stack);
    }
    return stack;
  }

  const getRedoStack = frame => {
    let stack = redoStack.get(frame);
    if (!stack){
      stack = [];
      redoStack.set(frame, stack);
    }
    return stack;
  }

  // top // look at the top item of a stack
  const top = stack => (stack.length ? stack[stack.length - 1].name : null);

  const topUndo = frame => {
    let stack = getUndoStack(frame);
    return stack ? top(stack): null
  }
  
  const topRedo = frame => {
    let stack = getRedoStack(frame);
    return stack ? top(stack): null
  }

  const sendEvent = (frame) => {
    let evt = new CustomEvent("shimmy-undo-change", {
      detail: {
        frameUndo: topUndo(frame),
        frameRedo: topRedo(frame)
      }
    });
    document.dispatchEvent(evt);
  };

  const pushDocUndo = (name, targetFrame, newCurrentFrame, undoFn, redoFn) => {
    // Special handling for particular events
    if (name === "Delete Frame"){
        let oldUndo = undoFn;
        undoFn = function(){
          oldUndo();
          sendEvent(targetFrame);
        }
        mess.showHtml('You deleted a frame <button>undo</button>', undoFn);
    }
    sendEvent(newCurrentFrame);
  };

  const pushUndo = (name, frame, undoFn, redoFn) => {
    getUndoStack(frame).push({ name, undoFn, redoFn });
    getRedoStack(frame).length = 0;
    sendEvent(frame);
  };

  const undo = frame => {
    let action = getUndoStack(frame).pop();
    action.undoFn();
    getRedoStack(frame).push(action);
    sendEvent(frame);
  };

  const redo = frame => {
    let action = getRedoStack(frame).pop();
    action.redoFn();
    getUndoStack(frame).push(action);
    sendEvent(frame);
  };

  // clear buttons on when new doc is created
  sendEvent(null);

  return {
    undo,
    redo,
    pushUndo,
    pushDocUndo,
    update: sendEvent,
    clear
  };
})();
