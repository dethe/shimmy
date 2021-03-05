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
  const documentUndoStack = [];
  const documentRedoStack = [];
  const frameUndoStack = new Map();
  const frameRedoStack = new Map();
  const mess = new Mess(); // toast-style popups for document-level undo messages
  mess.init();
  let curr = frame;
  [...curr.parentElement.children].forEach(frame => {
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
        frameUndo: peek(frameUndoStack.get(curr)),
        frameRedo: peek(frameRedoStack.get(curr)),
        docUndo: peek(documentUndoStack),
        docRedo: peek(documentRedoStack)
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
        // add a frame to the frameUndoStack and frameRedoStack
        // frameTarget and curr should be the same
        frameUndoStack.set(newCurrentFrame, []);
        frameRedoStack.set(newCurrentFrame, []);
        break;
      case "Copy Frame":
        // add a frame to the frameUndoStack and frameRedoStack
        // copy undo stack and redo stack from old frame to new frame
        // frameTarget should be the frame being copied, frame
        frameUndoStack.set(newCurrentFrame, []);
        frameRedoStack.set(newCurrentFrame, []);
        break;
      case "Delete Frame":
        // Target frame has been removed. Save undo and redo stacks in case it is restored.
        // Not deleting the stacks will  leak some memory, but we're saving them anyway for undo, at least this might be more reliable?
        // let undoStack = frameUndoStack.get(targetFrame);
        // let redoStack = frameRedoStack.get(targetFrame);
        // frameUndoStack.delete(targetFrame);
        // frameRedoStack.delete(targetFrame);
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
    documentUndoStack.push({
      name,
      targetFrame,
      curr: newCurrentFrame,
      undoFn,
      redoFn
    });
    documentRedoStack.length = 0;
    mess;
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
      case "Erase":
        break;
    }
    frameUndoStack.get(curr).push({ name, undoFn, redoFn });
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
