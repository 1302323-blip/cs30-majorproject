// Array and Object Notation
// Steven Qiu
// March 5, 2026
//
// Extra for Experts:
// - 


let player;

let playerBulletsArray = [];
let zombiesArray = [];
// let zombieProjectileArray = [];

let waveNum = 0;
let miniWave = 0;
let enemySpawnedCounter = 0;
let allZombiesDead = true;
let zombiesFinishedSpawning = true;
let canBeginNextWave = true;
let lastSpawnTime = 0;

let upgradesShop;
// let isShopOpen = false;
let playerCash;



class Player {
  constructor(){
    this.pos = createVector(width/2, height / 2);
    this.dir = createVector(0, 0);
    this.angle;
    this.speed = 7;
    this.size = 30;
    this.colour = color(255);

    this.maxHealth = 10;
    this.health = this.maxHealth;
    this.firingSpd = 150; // milli-seconds
    this.lastTimeFiredBullet = 0;
    this.bulletDamage = 1;
    
    this.iFramesLength = 1000; // milli-seconds
    this.isInIFrames = false;
    this.lastTookDamage = 0;
    this.knockBackSpd = 15;
    this.knockBackAngle;
  }

  movement(){
    if (keyIsDown(87)){ // up || keyIsDown(38)
      this.dir.y = -1;
    }
    else if (keyIsDown(83)){ // down || keyIsDown(40)
      this.dir.y = 1;
    }
    else {
      this.dir.y = 0;
    }

    if (keyIsDown(65)){ // left || keyIsDown(37)
      this.dir.x = -1;
    }
    else if (keyIsDown(68)){ // right || keyIsDown(39)
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
      playerBulletsArray.push(new Bullet(this.pos.x, this.pos.y, this.angle, this.bulletDamage));
    }
  }

  takeDamage(){
    if (!this.isInIFrames){
      for (let i = zombiesArray.length - 1; i >= 0; i--){
        if (dist(zombiesArray[i].pos.x, zombiesArray[i].pos.y, this.pos.x, this.pos.y) < this.size * 0.9){
          this.health -= zombiesArray[i].damage;
          
          this.knockBackAngle = zombiesArray[i].angle;
          this.isInIFrames = true;
          this.lastTookDamage = millis();
          
          zombiesArray.splice(i, 1);
          console.log(this.health);
        }
      }
    }
    else {
      this.knockBack(this.knockBackAngle);

      if (millis() >= this.lastTookDamage + this.iFramesLength){
        this.isInIFrames = false;
      }
    }
  }

  // knocks player back when they get hit by an enemy
  knockBack(_angle){
    let knockBackDuration = this.iFramesLength * 0.1;

    if (millis() <= this.lastTookDamage + knockBackDuration){
      this.pos.x += this.knockBackSpd * cos(this.knockBackAngle);
      this.pos.y += this.knockBackSpd * sin(this.knockBackAngle);
    }
  }

  // check if player has no health left
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
  constructor(_x, _y, _angle, _damage){
    this.pos = createVector(_x, _y);
    this.angle = _angle;
    this.speed = 10; // 10
    this.radius = 3;
    this.damage = _damage;

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
    this.bounty = _bounty;

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
      playerCash += this.bounty;
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

// class Shooter extends Enemy {
//   constructor(){
//     super("shooter", 15, 2, 3, 1, 15, "blue", "black");
//   }

//   shoot(){

//   }
// }

// class EnemyProjectile {
//   constructor(_x, _y){

//   }
// }



class UpgradesShop {
  constructor(){
    this.isOpened = false;

    // display shop stuff for when it isn't opened
    this.currentRadius;
    this.intermissionRadius = width / 8;
    this.duringWaveRadius = width / 8;
  }

  display(){
    if (!this.isOpened){
      stroke("black");
      fill(170);
      circle(width/2, 0, this.currentRadius);
    }
    else if (this.isOpened){

    }
  }

  update(){
    if (canBeginNextWave){
      this.currentRadius = this.intermissionRadius;
    }
    else{
      this.currentRadius = this.duringWaveRadius;
    }
  }

  increaseMaxHealth(_increaseAmount, _cost){
    if (playerCash >= _cost){
      player.maxHealth += _increaseAmount;
      player.health = player.maxHealth;
      console.log("maxHealth: " + player.maxHealth);
      console.log("health: " + player.health);

      playerCash -= _cost;
    }
  }

  increaseBulletDamage(_increaseAmount, _cost){
    if (playerCash >= _cost){
      player.bulletDamage += _increaseAmount;
      console.log("bulletDamage: " + player.bulletDamage);

      playerCash -= _cost;
    }
  }
}


function setup(){
  if (windowWidth > windowHeight){
    createCanvas(windowHeight, windowHeight);
  }
  else if (windowWidth < windowHeight){
    createCanvas(windowWidth, windowWidth);
  }
  reset();
}

function reset(){
  player = new Player();
  playerBulletsArray.splice(0);
  zombiesArray.splice(0);

  upgradesShop = new UpgradesShop();
  playerCash = 0;

  waveNum = 0;
  miniWave = 0;
  enemySpawnedCounter = 0;
}


function draw(){
  background(100);

  // class management
  manageBulletFunctions();
  manageZombieFunctions();
  managePlayerFunctions();
  manageShopFunctions();

  // zombie wave management
  zombieWaveManager();
  zombieWaveButton();
  isAllZombiesDead();

  // debug; delete once project finished
  debugText();
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



function zombieWaveManager(){
  // intervals are written in seconds
  if (waveNum === 1){
    spawnZombies("normal", 5, 1, 1);
    spawnZombies("fast", 5, 1, 2);
    areAllZombiesSpawned(2);
  }
  if (waveNum === 2){
    spawnZombies("fast", 7, 0.5, 1);
    spawnZombies("strong", 3, 2, 2);
    areAllZombiesSpawned(2);
  }
}


// spawns zombies in each miniWave, determining amount and intervals between each spawn
function spawnZombies(_enemyType, _amount, _spawnInterval, _miniWaveNum){
  // sets _spawnInterval to millis() to make if statements work
  _spawnInterval *= 1000;
  if (miniWave === _miniWaveNum){
    if (millis() > lastSpawnTime + _spawnInterval){
      zombieTypeToSpawn(_enemyType);
      lastSpawnTime = millis();
      enemySpawnedCounter += 1;
    }
    if (enemySpawnedCounter === _amount){
      miniWave += 1;
      enemySpawnedCounter = 0;
      console.log("miniWave: " + miniWave);
    }
  }
}

// organization function - used to spawn specific type of enemy called in spawnZomibes()
function zombieTypeToSpawn(_enemyType){
  if (_enemyType === "normal"){
    zombiesArray.push(new Normal());
  }
  if (_enemyType === "fast"){
    zombiesArray.push(new Fast());
  }
  if (_enemyType === "strong"){
    zombiesArray.push(new Strong());
  }
  
  // template for new enemy spawns for function
  // if (_enemyType === "_"){
  //   zombiesArray.push(new _());
  // }
}

// tracks if all zombies part of a whole wave have been spawned
// organization function
function areAllZombiesSpawned(_finalMiniWave){
  if (miniWave === _finalMiniWave + 1){
    zombiesFinishedSpawning = true;
  }
}

// tracks if all zombies are dead, to see if a new wave can be started
function isAllZombiesDead(){
  if (zombiesArray.length === 0){
    allZombiesDead = true;
  }
  else {
    allZombiesDead = false;
  }
}

// this function can be removed and moved to the button class
function newWave(){
  canBeginNextWave = false;
  zombiesFinishedSpawning = false;
  waveNum += 1;
  miniWave = 1;
  console.log("new wave");
  console.log("wave: " + waveNum);
  console.log("miniWave: " + miniWave);

  upgradesShop.isOpened = false;
}


// when keybind pressed, start the wave
function zombieWaveButton(){
  if (canBeginNextWave){
    if (keyIsDown(32)){ // space key pressed
      newWave();
    }
  }
  else if (zombiesFinishedSpawning && allZombiesDead){
    canBeginNextWave = true;
    miniWave = 0;
    console.log("finished wave");
  }
}


function manageShopFunctions(){
  upgradesShop.display();
  upgradesShop.update();
}

// controls ability to buy shop upgrades using keybinds
function keyReleased(){
  // pressing tab opens the shop
  if (key === "t" && canBeginNextWave){
    upgradesShop.isOpened = !upgradesShop.isOpened;
    console.log("shopOpened?: " + upgradesShop.isOpened);
  }

  if (upgradesShop.isOpened){
    if (key === "y"){
      upgradesShop.increaseMaxHealth(1, 100);
      console.log("Cash: " + playerCash);
    }
    else if (key === "u"){
      upgradesShop.increaseBulletDamage(1, 100);
      console.log("Cash: " + playerCash);
    }
  }
}



// used purely for debugging; delete once project is finished
function debugText(){
  if (player.isInIFrames){
    fill("yellow");
  }
  else{
    fill("white");
  }
  text("Iframes: " + player.isInIFrames, 50, 50);
}