"use strict";

const filterMain = document.querySelector(".filter-container");
const minInput = document.getElementById("min-price");
const maxInput = document.getElementById("max-price");
const sliderElSize = 20;
let minPrice = 0;
let maxPrice = 0;
let targetEl = null;
let currSettings = null;
let isActive = false;
let hasMoved = false;
let inValidMove = false;

const settings = {
  min: {
    type: "min",
    parentPosition: 0,
    position: 0,
    slideStart: 0,
    viewSize: 0,
    lastPos: 0,
    currTrack: 0,
    split: 0,
    moveCount: 1,
    currValue: 6,
  },
  max: {
    type: "max",
    parentPosition: 0,
    position: 0,
    slideStart: 0,
    viewSize: 0,
    lastPos: 0,
    currTrack: 0,
    split: 0,
    moveCount: 1,
    currValue: 20,
  },
};
const priceTracking = {
  min: 0,
  max: 0,
  "deadzone-min": 0,
  "deadzone-max": 0,
};

// Calculates position diff between both elements to stop moveSlide function from overlaying elements if they fall into position area in line with the element width
function calcElementCollision(val) {
  const { viewSize, type } = currSettings;
  const diff = viewSize - val;
  priceTracking["deadzone-" + type] = diff;
}

// Keeps track of changing price values based on slider changes to ensure both min and max inputs have visibility of the others current value changes.
function updatePriceTrack(type) {
  const { currValue } = currSettings;
  priceTracking[type] = currValue;
}

// Updates designated input value based on current new value set by slider changes.
function updateInputVal(inputEl, val) {
  inputEl.value = val;
}

// Disables entire event actions and tracks last made position then resets currSettings object back to default null state.
function slideEnd() {
  if (!isActive) return;
  isActive = false;
  if (hasMoved) {
    hasMoved = inValidMove = false;
    currSettings.lastPos = currSettings.position;
    settings[currSettings.type] = currSettings;
    updatePriceTrack(currSettings.type);
  }
  setTimeout(() => (currSettings = targetEl = null), 300);
}

// Checks if mouse cursor is currently in valid event area to allow event actions to continue. If outside of parent area will end event or will stop tracking position if elements will overlap each other.
function checkEventOOB(area, posDiff) {
  const safeZone = calcSafeZone(posDiff, currSettings.type);
  if (safeZone <= 0) {
    inValidMove = true;
  } else {
    if (inValidMove) inValidMove = false;
  }

  if (area <= 1 || area >= currSettings.viewSize) {
    slideEnd();
  }
}

// Updates slider elements in view with new position calculated from targeted track
function updatePosition(posVal) {
  const { type, currValue } = currSettings;
  if (type === "min") {
    targetEl.style.left = `${posVal}%`;
    updateInputVal(minInput, currValue);
  }
  if (type === "max") {
    targetEl.style.right = `${posVal}%`;
    updateInputVal(maxInput, currValue);
  }
}

// calculates % split for each movement required based 100% left position and max price difference against min price
function calcSlideSplit() {
  const priceTrack = minPrice + 1;
  const sum = (maxPrice - minPrice) / 100;
  const posMove = sum + priceTrack;
  return posMove;
}

// calculates % value for each slide movement based on cursor position and 100% left position of parent width
function calcMovement(movestate) {
  const { viewSize } = currSettings;
  const sum = (movestate / viewSize) * 100;
  return sum.toFixed(3);
}

// Calculates how far mouse cursor moves in relation to the starting click point of event
function calcMoveState(e) {
  const { slideStart, lastPos } = currSettings;
  const moveTrack = e.clientX - slideStart;
  return moveTrack + lastPos;
}

// Calculates valid area event can stay active in, in relation to parent left position value and position of mouse cursor
function calcValidEventArea(e) {
  const { parentPosition } = currSettings;
  const eventArea = parentPosition.left - e.movementX;
  return e.clientX - eventArea;
}

function calcSafeZone(currPos, type) {
  if (type === "min") {
    return currPos - priceTracking["deadzone-max"] - sliderElSize * 2;
  }
  if (type === "max") {
    return currPos - priceTracking["deadzone-min"] - sliderElSize;
  }
}

function moveSlide(e, moveState, posDiff, eventMove = 0) {
  if (!isActive || inValidMove) return;
  const posVal = calcMovement(moveState);
  // RIGHT MOVEMENT
  if (e.movementX > 0 || eventMove > 0) {
    const targetTrack = currSettings.split * currSettings.moveCount;

    if (posVal > targetTrack) {
      hasMoved = true;
      currSettings.position = moveState;
      currSettings.moveCount++;
      currSettings.currValue++;
      calcElementCollision(posDiff);
      updatePosition(Math.abs(posVal));
    }
  }
  // LEFT MOVEMENT
  if (e.movementX < 0 || eventMove < 0) {
    const targetTrack = currSettings.split * (currSettings.moveCount - 2);

    if (posVal < targetTrack) {
      hasMoved = true;
      currSettings.position = moveState;
      currSettings.moveCount--;
      currSettings.currValue--;
      calcElementCollision(posDiff);
      updatePosition(Math.abs(posVal));
    }
  }
}

function trackMousePos(e) {
  const moveState = calcMoveState(e);
  const posDiff = currSettings.viewSize - Math.abs(moveState);
  const wrapperArea = calcValidEventArea(e);
  checkEventOOB(wrapperArea, posDiff);
  moveSlide(e, moveState, posDiff);
}

function dragAction(e, direction) {
  e.preventDefault();
  if (e.type === "mousemove") trackMousePos(e);
  // if (e.type === 'touchmove') this.trackTouchPos(e as TouchEvent, direction);
}

function mouseElPos(e) {
  currSettings.slideStart = e.clientX;
  targetEl = e.target;
}

function setParentPosition() {
  currSettings.parentPosition = filterMain.getBoundingClientRect();
  currSettings.viewSize = currSettings.parentPosition.width;
  currSettings.split = calcSlideSplit();
}

function grabSliderPosition(e) {
  setParentPosition();
  if (e.type === "mousedown") mouseElPos(e);
}

function grabSettings(type) {
  currSettings = settings[type];
}

// function mouseEnd() {
//   slideEnd();
// }

function mouseAction(e) {
  if (!isActive) return;
  dragAction(e);
}

function mouseStart(e) {
  if (!e.target.dataset.evAction) return;
  isActive = true;
  const slider = e.target.dataset.filtertype;
  grabSettings(slider);
  grabSliderPosition(e);
}

window.addEventListener("load", function () {
  minPrice = parseInt(filterMain.dataset.minprice, 10);
  maxPrice = parseInt(filterMain.dataset.maxprice, 10);

  filterMain.addEventListener("mousedown", mouseStart);
  filterMain.addEventListener("mousemove", mouseAction);
  filterMain.addEventListener("mouseup", slideEnd);
});
