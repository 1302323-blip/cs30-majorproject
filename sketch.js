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

let grid;
let cellSize;
// [y, x]
const GRID_DIMENSIONS = [5, 9];
// tile colours
const LIGHT_TILE = 0;
const MEDIUM_TILE = 1;
const DARK_TILE = 2;

function setup() {
  createCanvas(windowWidth, windowHeight);
  reset();
}

function reset(){
  grid = generateGrid(GRID_DIMENSIONS[0], GRID_DIMENSIONS[1]);
  console.log(grid);
}

function draw() {
  background(220);
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

function drawGrid(){

}