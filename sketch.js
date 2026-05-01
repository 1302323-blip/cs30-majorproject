// Array and Object Notation
// Steven Qiu
// March 5, 2026
//
// Extra for Experts:
// - 

// commit message from apr 4 2026 (not given yet)
// finished on making zombies
// working on being able to damage zombies with bullets


let player;

let playerBulletsArray = [];
let zombiesArray = [];

let wave = 0;
let allZombiesDead = true;
let zombiesFinishedSpawning = true;

class Player {
  constructor(){
    this.pos = createVector(width/2, height / 2);
    this.dir = createVector(0, 0);
    this.angle;
    this.speed = 7;
    this.size = 30;

    this.health = 10;
    this.firingSpd = 150; // milli-seconds
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

  takeDamage(){
    for (let i = zombiesArray.length - 1; i >= 0; i--){
      if (dist(zombiesArray[i].pos.x, zombiesArray[i].pos.y, this.pos.x, this.pos.y) < this.size * 0.9){
        this.health -= zombiesArray[i].damage;
        zombiesArray.splice(i, 1);
        console.log(this.health);
      }
    }
  }

  isDead(){
    if (this.health > 0){
      return false;
    }
    else {
      return true;
    }
  }
}

class Bullet {
  constructor(_x, _y, _angle){
    this.pos = createVector(_x, _y);
    this.angle = _angle;
    this.speed = 10; // 10
    this.radius = 3;
    this.damage = 1;

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
  constructor(_enemyType, _radius, _spd, _health, _damage, _bounty, _fillColour, _strokeColour){
    this.pos = createVector();
    this.angle;
    this.radius = _radius;

    this.type = _enemyType;
    this.speed = _spd;
    this.health = _health;
    this.damage = _damage;

    this.fillColour = _fillColour;
    this.strokeColour = _strokeColour;

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
    push();
    translate(this.pos.x, this.pos.y);
    this.angle = atan2(player.pos.y - this.pos.y, player.pos.x - this.pos.x);
    fill(this.fillColour);
    stroke(this.strokeColour);
    rotate(this.angle);
    circle(0, 0, this.radius * 2);
    pop();
  }

  movement(){
    this.pos.x += this.speed * cos(this.angle);
    this.pos.y += this.speed * sin(this.angle);
  }

  takeDamage(){
    for (let i = playerBulletsArray.length - 1; i >= 0; i--){
      if (dist(playerBulletsArray[i].pos.x, playerBulletsArray[i].pos.y, this.pos.x, this.pos.y) < this.radius * 1.1){
        this.health -= playerBulletsArray[i].damage;
        playerBulletsArray.splice(i, 1);
      }
    }
  }

  killZombie(){
    if (this.health <= 0){
      let index = zombiesArray.indexOf(this);
      zombiesArray.splice(index, 1);
    }
  }
}

class Normal extends Enemy {
  constructor(){
    super("normal", 15, 3, 3, 1, 15, color(100, 250, 100), "black");
  }
}

class Fast extends Enemy {
  constructor(){
    super("fast", 12, 5, 2, 2, 20, color(255, 0, 0), "black");
  }
}

class Strong extends Enemy {
  constructor(){
    super("strong", 20, 2, 10, 5, 40, color(109, 36, 191), "black");
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
  playerBulletsArray.splice(0);
  zombiesArray.splice(0);
  frameCount = 1;
}


function draw(){
  background(100);

  manageBulletFunctions();
  manageZombieFunctions();
  managePlayerFunctions();

  zombieWaveSpawner();
}


function managePlayerFunctions(){
  player.display();
  player.movement();
  player.shootBullets();
  player.takeDamage();

  if (player.isDead()){
    reset();
  }
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
  for (let i = zombiesArray.length - 1; i >= 0; i--){
    zombiesArray[i].display();
    zombiesArray[i].movement();
    zombiesArray[i].takeDamage();
    zombiesArray[i].killZombie();
  }
}

// when activated/pressed, starts the wave
function waveButton(){}

// testing
function zombieWave(_enemyType, _amount, _spawnInterval){ // spawnIntervals is in millis() 1sec = 1000
  let lastSpawnTime = 0;
  // spawn the amount, within the intervals
  for (let i = 0; i < _amount; i++){
    if (lastSpawnTime < millis() + _spawnInterval){



    }
  }
}

// experimental - could prolly be just put into zombieWave function
function zombieTypeForWaveSpawn(_enemyType){
  if (_enemyType === "normal"){
    zombiesArray.push(new Normal());
  }
}

function zombieWaveSpawner(){
  if (frameCount % 90 === 0){
    zombiesArray.push(new Normal());
  }
  if (frameCount % 270 === 0){
    zombiesArray.push(new Fast());
  }
  if (frameCount % 450 === 0 && frameCount > 1000){
    zombiesArray.push(new Strong());
  }
  console.log(frameCount);
}