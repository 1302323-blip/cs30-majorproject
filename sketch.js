// Array and Object Notation
// Steven Qiu
// March 5, 2026
//
// Extra for Experts:
// - 

let player;

let playerBulletsArray = [];
let zombiesArray = [];

class Player {
  constructor(){
    this.pos = createVector(width/2, height / 2);
    this.dir = createVector(0, 0);
    this.angle;
    this.speed = 7;
    this.size = 30;

    this.firingSpd = 100; // milli-seconds
    this.lastTimeFiredBullet = 0;

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

    // contains on screen
    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);
  }

  display(){
    push();
    translate(this.pos.x, this.pos.y);
    this.angle = atan2(mouseY - this.pos.y, mouseX - this.pos.x);
    fill(this.colour);
    stroke("black");
    rotate(this.angle);
    rectMode(CENTER);
    square(0, 0, this.size);
    pop();
  }

  shootBullets(){
    if (mouseIsPressed && this.lastTimeFiredBullet < millis()){
      this.lastTimeFiredBullet = millis() + this.firingSpd;
      playerBulletsArray.push(new Bullet(this.pos.x, this.pos.y, this.angle));
    }
  }
}

class Bullet {
  constructor(_x, _y, _angle){
    this.pos = createVector(_x, _y);
    this.angle = _angle;
    this.speed = 20;
    this.radius = 3;
    this.damage;

    this.colour = color("yellow");
  }

  display(){
    noStroke();
    fill(this.colour);
    circle(this.pos.x, this.pos.y, this.radius * 2);
  }

  movement(){
    this.pos.x += this.speed * cos(this.angle);
    this.pos.y += this.speed * sin(this.angle);
  }

  isOffScreen(){
    let isOffscreen = false;
    if (this.pos.x < -this.radius || this.pos.x > width - this.radius || this.pos.y < -this.radius || this.pos.y > height - this.radius){
      isOffscreen = true;
    }
    else {
      isOffscreen = false;
    }
    return isOffscreen;
  }
}



class Enemy {
  constructor(_enemyType, _size, _spd, _health, _damage, _bounty, _colour){
    this.pos = createVector();
    this.angle;
    this.type = _enemyType;
    this.size = _size;
    this.speed = _spd;
    this.colour = _colour;

    // spawn enemy in random location
    if (random(1) < 0.5){
      this.pos.y = random(-height/2, 0);
    }
    else {
      this.pos.y = random(height, height * (3/2));
    }

    if (random(1) < 0.5){
      this.pos.x = random(-width/2, 0);
    }
    else {
      this.pos.x = random(width, width * (3/2));
    }
  }

  display(){
    // experimental, idk if tracking player position will work
    push();
    translate(this.pos.x, this.pos.y);
    this.angle = atan2(player.pos.y - this.pos.y, player.pos.x - this.pos.x);
    fill(this.colour);
    rotate(this.angle);
    rectMode(CENTER);
    circle(0, 0, this.size);
    pop();
  }

  movement(){
    this.pos.x += this.speed * cos(this.angle);
    this.pos.y += this.speed * sin(this.angle);
  }
}

class Normal extends Enemy {
  constructor(){
    super("normal", 30, 2, 3, 1, 15, color(100, 250, 100));
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

  manageBulletFunctions();
  managePlayerFunctions();
}



function managePlayerFunctions(){
  player.display();
  player.movement();
  player.shootBullets();
}

function manageBulletFunctions(){
  for (let i = playerBulletsArray.length - 1; i >= 0; i--){
    playerBulletsArray[i].display();
    playerBulletsArray[i].movement();

    if (playerBulletsArray[i].isOffScreen()){
      playerBulletsArray.splice(i, 1);
    }
  }
}

function manageZombieFunctions(){

}