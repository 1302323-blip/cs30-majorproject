// Array and Object Notation
// Steven Qiu
// March 5, 2026
//
// Extra for Experts:
// - 

let player;

let bulletsArray = [];

class Player {
  constructor(){
    this.pos = createVector(width/2, height / 2);
    this.dir = createVector(0, 0);
    this.angle;
    this.speed = 7;
    this.size = 30;

    this.colour = color(255);
  }

  movement(){
    if (keyIsDown(87) || keyIsDown(38)){ // up
      this.dir.y = -1;
    }
    else if (keyIsDown(83) || keyIsDown(40)){ // down
      this.dir.y = 1;
    }
    else {
      this.dir.y = 0;
    }

    if (keyIsDown(65) || keyIsDown(37)){ // left
      this.dir.x = -1;
    }
    else if (keyIsDown(68) || keyIsDown(39)){ // right
      this.dir.x = 1;
    }
    else {
      this.dir.x = 0;
    }

    this.dir.normalize();
    this.dir.mult(this.speed);

    this.pos.add(this.dir);
  }

  containInBorder(){
    if (this.pos.x < 0){
      this.pos.x = 0;
    }
    if (this.pos.x > width){
      this.pos.x = width;
    }
    if (this.pos.y < 0){
      this.pos.y = 0;
    }
    if (this.pos.y > height){
      this.pos.y = height;
    }
  }

  display(){
    push();
    translate(this.pos.x, this.pos.y);
    this.angle = atan2(mouseY - this.pos.y, mouseX - this.pos.x);
    fill(this.colour);
    rotate(this.angle);
    rectMode(CENTER);
    square(0, 0, this.size);
    pop();
  }
}

class Bullet {
  constructor(_x, _y, _angle){
    this.pos = createVector(_x, _y);
    this.angle = _angle;
    this.speed = 20;
    this.radius = 10;

    this.colour = color("yellow");
  }

  display(){
    noStroke();
    fill(this.colour);
    circle(this.pos.x, this.pos.y, this.radius);
  }

  movement(){

  }
}



function setup(){
  if (windowWidth > windowHeight){
    createCanvas(windowHeight, windowHeight);
  }
  else if (windowWidth < windowHeight){
    createCanvas(windowWidth, windowWidth);
  }
  // createCanvas(windowWidth, windowHeight);
  reset();
}

function reset(){
  player = new Player();
}

function draw(){
  background(100);

  managePlayerFunctions();
  manageBulletFunctions();
}



function managePlayerFunctions(){
  player.display();
  player.movement();
  player.containInBorder();
}

function manageBulletFunctions(){
  for (let bullet = bulletsArray.length - 1; bullet >= 0; bullet--){
    bullet.display();
    bullet.movement();
  }
}

function manageZombieFunctions(){

}