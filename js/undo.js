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

/* globals Mess */

function UndoRedo(frame) {
  const undoStack = new Map();
  const redoStack = new Map();
  const mess = new Mess(); // toast-style popups for document-level undo messages
  mess.init();
  let curr = frame;
  [...curr.parentElement.children].forEach(frame => {
    undoStack.set(frame, []);
    redoStack.set(frame, []);
  });

  const getUndoStack = frame => {
    let stack = undoStack.get(frame);
    if (!stack){
      stack = [];
      redoStack.set(frame, stack);
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

  const sendEvent = () => {
    let evt = new CustomEvent("shimmy-undo-change", {
      detail: {
        frameUndo: topUndo(curr),
        frameRedo: topRedo(curr)
      }
    });
    document.dispatchEvent(evt);
  };

  const pushDocUndo = (name, targetFrame, newCurrentFrame, undoFn, redoFn) => {
    // NOTE: 'document' type actions can change the curr (current frame)
    curr = newCurrentFrame;
    // Special handling for particular events
    switch (name) {
      case "New Frame":
        // frames are lazily instantiated, nothing to do here
        break;
      case "Copy Frame":
        // frames are lazily instantiated, nothing to do here
        break;
      case "Delete Frame":
        let oldUndo = undoFn;
        undoFn = function(){
          oldUndo();
          curr = targetFrame;
        }
        mess.showHtml('You deleted a frame <button>undo</button>', undoFn);
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
    sendEvent();
  };

  const pushFrameUndo = (name, undoFn, redoFn) => {
    // Special handling for particular events
    get(curr).push({ name, undoFn, redoFn });
    frameRedoStack.get(curr).length = 0;
    sendEvent();
  };

  const docUndo = () => {
    let action = documentUndoStack.pop();
    action.undoFn();
    // handle special case of copying a frame, which copies undo/redo stacks of the frame
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
    let action = frameUndoStack.get(curr).pop();
    action.undoFn();
    frameRedoStack.get(curr).push(action);
    sendEvent();
  };

  const frameRedo = () => {
    let action = frameRedoStack.get(curr).pop();
    action.redoFn();
    frameUndoStack.get(curr).push(action);
    sendEvent();
  };

  const switchFrame = frame => {
    curr = frame;
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
