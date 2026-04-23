// Plants vs Zombies Recreation (Major Project)
// Steven Qiu
// April 21, 2026
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

// Steps
// 1. Build the Grid
// 2. Build the shop and the ability to plant a peashooter
// 3. Sun can fall from the sky
// 4. Sunflower
// 5. Zombie system

let visibleGrid;
let cellSize;
let gridStartingX;
let gridStartingY;

const COLUMNS = 9; // x
const ROWS = 5; // y
// tile colours
const LIGHT_TILE = 0;
let lightColour;
const MEDIUM_TILE = 1;
let mediumColour;
const DARK_TILE = 2;
let darkColour;

// grid that tracks where the plants are
let plantGrid;
const EMPTY_SPACE = 0;
const PEASHOOTER_SPACE = 1;

let plantsArray = [];



class Plant {
  constructor(){
    this.x;
    this.y;
    this.health;

    this.plantType;
  }

  display(){
    stroke(100);
    fill("green");
    rectMode(CENTER);
    rect(this.x * cellSize + gridStartingX + cellSize/2, this.y * cellSize + gridStartingY + cellSize/2, cellSize*0.5, cellSize*0.5);
  }
}

class Peashooter extends Plant{
  constructor(_x, _y){
    super();
    this.x = _x;
    this.y = _y;

    this.health = 20;
    this.plantType = "peashooter";
  }
}



function setup() {
  createCanvas(windowWidth, windowHeight);
  reset();
  plantsArray.push(new Peashooter(2, 3));
}

function reset(){
  visibleGrid = generateGrid(ROWS, COLUMNS);
  console.log(visibleGrid);

  cellSize = height / 7;
  if (cellSize * COLUMNS > width * 9/11){
    cellSize = width/11;
  }
  gridStartingX = width/2 - cellSize*(COLUMNS / 2);
  gridStartingY = height - cellSize*ROWS;

  lightColour = color(255, 255, 255);
  mediumColour = color(100, 100, 100);
  darkColour = color(0, 0, 0);
}

function draw() {
  background(220);

  displayGrid();
  plantGrid = trackingPlantsOnGrid();

  managePlants();
  plantShop();
}



// Grid functions
function generateGrid(yDimension, xDimension){
  let newGrid = [];
  let tileWasMedium = false;

  for (let y = 0; y < yDimension; y++){
    newGrid.push([]);
    for (let x = 0; x < xDimension; x++){
      if (y % 2 === 0){
        if (!tileWasMedium){
          newGrid[y].push(MEDIUM_TILE);
        }
        else if (tileWasMedium){
          newGrid[y].push(DARK_TILE);
        }
      }
      else {
        if (!tileWasMedium){
          newGrid[y].push(MEDIUM_TILE);
        }
        else if (tileWasMedium){
          newGrid[y].push(LIGHT_TILE);
        }
      }
      tileWasMedium = !tileWasMedium;
    }
  }
  return newGrid;
}

function displayGrid(){
  for (let _y = 0; _y < visibleGrid.length; _y++){
    for (_x = 0; _x < visibleGrid[_y].length; _x++){
      if (visibleGrid[_y][_x] === MEDIUM_TILE){
        fill(mediumColour);
      }
      else if (visibleGrid[_y][_x] === LIGHT_TILE){
        fill(lightColour);
      }
      else if (visibleGrid[_y][_x] === DARK_TILE){
        fill(darkColour);
      }
      noStroke();
      rectMode(CORNER);
      square(_x * cellSize + gridStartingX, _y * cellSize + gridStartingY, cellSize);
    }
  }
}

// 0 = empty
// 1 = peashooter
// 2 = sunflower

// tracks the position of all plants on the grid
function trackingPlantsOnGrid(){
  let newGrid = [];
  
  // for (let _y = 0; _y < rows; _y++){
  //   newGrid.push([]);

  //   for (let _x = 0; _x < cols; _x++){
  //     // is there a piece in this space
  //     newGrid[_y].push(EMPTY_SPACE);

  //     for (let piece of pieces){
  //       if (_x === piece.x && _y === piece.y){
  //         // which piece colour is it?
  //         if (piece.team === "white"){
  //           newGrid[_y][_x] = WHITE_IN_SPACE;
  //         }
  //         else if (piece.team === "black"){
  //           newGrid[_y][_x] = BLACK_IN_SPACE;
  //         }
  //         break;
  //       }
  //     }
  //   }
  // }

  for (let _y = 0; _y < ROWS; _y++){
    newGrid.push([]);
    for (let _x = 0; _x < COLUMNS; _x++){
      newGrid[_y].push(EMPTY_SPACE);

      for (let plant of plantsArray){
        if (plant.x === _x && plant.y === _y){
          newGrid[_y][_x] = PEASHOOTER_SPACE;
        }
      }
    }
  }

  return newGrid;
}



function managePlants(){
  for (let plant of plantsArray){
    plant.display();
  }
}

function plantShop(){
  stroke(0);
  rectMode(CORNER);
  fill("brown");
  rect(gridStartingX, 0, cellSize * COLUMNS, cellSize * 1.7);
}