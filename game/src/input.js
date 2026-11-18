/** Keyboard and mouse. `sample()` once per frame; edges clear after the sample. */

const MOVE_LEFT = new Set(['KeyA', 'ArrowLeft']);
const MOVE_RIGHT = new Set(['KeyD', 'ArrowRight']);
const MOVE_UP = new Set(['KeyW', 'ArrowUp']);
const MOVE_DOWN = new Set(['KeyS', 'ArrowDown']);
const BLOCKED = new Set(['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

export function createInput(canvas, clientToWorld, onGesture) {
  const held = new Set();
  const pressed = new Set();
  const pointer = { clientX: 0, clientY: 0, seen: false, left: false, right: false };
  let leftEdge = false;
  let rightEdge = false;

  function onKeyDown(event) {
    if (!event.repeat && !held.has(event.code)) pressed.add(event.code);
    held.add(event.code);
    if (BLOCKED.has(event.code)) event.preventDefault();
    if (onGesture) onGesture();
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onMove(event) {
    pointer.clientX = event.clientX;
    pointer.clientY = event.clientY;
    pointer.seen = true;
  }

  function onDown(event) {
    pointer.clientX = event.clientX;
    pointer.clientY = event.clientY;
    pointer.seen = true;
    if (event.button === 0) {
      pointer.left = true;
      leftEdge = true;
      if (onGesture) onGesture();
    } else if (event.button === 2) {
      pointer.right = true;
      rightEdge = true;
    }
  }

  function onUp(event) {
    if (event.button === 0) pointer.left = false;
    else if (event.button === 2) pointer.right = false;
  }

  function onBlur() {
    held.clear();
    pointer.left = false;
    pointer.right = false;
  }

  function onContext(event) {
    event.preventDefault();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  canvas.addEventListener('contextmenu', onContext);

  function digitDown(codes) {
    for (let n = 1; n <= 8; n += 1) {
      if (codes.has(`Digit${n}`) || codes.has(`Numpad${n}`)) return n;
    }
    return 0;
  }

  function axis(negative, positive) {
    let value = 0;
    for (const code of negative) if (held.has(code)) value -= 1;
    for (const code of positive) if (held.has(code)) value += 1;
    return value;
  }

  function sample() {
    let aimX = 0;
    let aimY = 0;
    let aimValid = false;
    if (pointer.seen) {
      const world = clientToWorld(pointer.clientX, pointer.clientY);
      aimX = world.x;
      aimY = world.y;
      aimValid = true;
    }
    const snapshot = {
      moveX: axis(MOVE_LEFT, MOVE_RIGHT),
      moveY: axis(MOVE_UP, MOVE_DOWN),
      aimX,
      aimY,
      aimValid,
      fireHeld: pointer.left,
      clickEdge: leftEdge,
      rightEdge,
      shiftEdge: pressed.has('ShiftLeft') || pressed.has('ShiftRight'),
      spaceEdge: pressed.has('Space'),
      enterEdge: pressed.has('Enter'),
      pauseEdge: pressed.has('Escape') || pressed.has('KeyP'),
      restartEdge: pressed.has('KeyR'),
      specialEdge: pressed.has('KeyF') || pressed.has('KeyQ'),
      muteEdge: pressed.has('KeyM'),
      rerollEdge: pressed.has('KeyB'),
      pickSlot: pressed.has('Digit1') || pressed.has('Numpad1') ? 1
        : pressed.has('Digit2') || pressed.has('Numpad2') ? 2
          : pressed.has('Digit3') || pressed.has('Numpad3') ? 3
            : 0,
      digit: digitDown(pressed),
      leftTap: pressed.has('ArrowLeft') || pressed.has('KeyA'),
      rightTap: pressed.has('ArrowRight') || pressed.has('KeyD'),
    };
    pressed.clear();
    leftEdge = false;
    rightEdge = false;
    return snapshot;
  }

  function dispose() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('contextmenu', onContext);
  }

  return { sample, dispose };
}
