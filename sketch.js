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
// [y, x]
const GRID_DIMENSIONS = [5, 9];
// tile colours
const LIGHT_TILE = 0;
let lightColour;
const MEDIUM_TILE = 1;
let mediumColour;
const DARK_TILE = 2;
let darkColour;

// grid that tracks where the plants are
let plantGrid;

let plantsArray = [];



class Plant {
  constructor(_x, _y){
    this.x = _x;
    this.y = _y;

    this.health;
  }

  
}



function setup() {
  createCanvas(windowWidth, windowHeight);
  reset();
}

function reset(){
  visibleGrid = generateGrid(GRID_DIMENSIONS[0], GRID_DIMENSIONS[1]);
  console.log(visibleGrid);

  plantGrid = generatePlantGrid(GRID_DIMENSIONS[0], GRID_DIMENSIONS[1]);
  console.log(plantGrid);

  cellSize = height / 6;
  gridStartingX = width/2 - cellSize*(GRID_DIMENSIONS[1] / 2);
  gridStartingY = height - cellSize*GRID_DIMENSIONS[0];

  lightColour = color(255, 255, 255);
  mediumColour = color(100, 100, 100);
  darkColour = color(0, 0, 0);
}

function draw() {
  background(220);

  displayGrid();
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
      square(_x * cellSize + gridStartingX, _y * cellSize + gridStartingY, cellSize);
    }
  }
}

// 0 = empty
// 1 = peashooter
// 2 = sunflower
function generatePlantGrid(yDimension, xDimension){
  let newGrid = [];

  for (let y = 0; y < yDimension; y++){
    newGrid.push([]);
    for (let x = 0; x < xDimension; x++){
      newGrid[y].push(0);
    }
  }
  return newGrid;
}

// tracks the position of all plants on the grid
function trackingPlantsOnGrid(){
  
}