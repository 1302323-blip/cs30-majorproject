// Array and Object Notation
// Steven Qiu
// March 5, 2026
//
// Extra for Experts:
// - 


let player;

let playerBulletsArray = [];
let zombiesArray = [];
let zombieProjectileArray = [];

let waveNum = 0;
let miniWave = 0;
let enemySpawnedCounter = 0;
let allZombiesDead = true;
let zombiesFinishedSpawning = true;
let canBeginNextWave = true;
let lastSpawnTime = 0;

let upgradesShop;
let playerCash;

// sound effects/music
let gameMusicLoop;

let shootBulletSFX;
let tookDmgSFX;

let enemyBulletShootSFX;
let hitEnemySFX;
let enemyDieSFX;

let openShopSFX;
let buyUpgradeSFX;


class Player {
  constructor(){
    this.pos = createVector(width/2, height / 2);
    this.dir = createVector(0, 0);
    this.angle;
    this.speed = 5.5; // 5.5
    this.size = 30;
    this.colour = color(255);
    this.currentColour = this.colour;

    this.maxHealth = 10;
    this.health = this.maxHealth;
    this.bulletFirerate = 300; // milli-seconds (300)
    this.lastTimeFiredBullet = 0;
    this.bulletDamage = 2; // 0.5
    
    this.iFramesLength = 1000; // milli-seconds
    this.isInIFrames = false;
    this.lastTookDamage = 0;
    this.knockBackSpd = 15;
    this.totalKnockBackIntervals = 0; // counts amount of times knockBack has been applied
    this.knockBackAngle;

    this.lastHitBy; // zombie/projectile

    // effects for when damaged
    this.flashingColour = color(0);
    this.lastTimeFlashed = 0;
    this.flashedLastInterval = false;

    this.healthUIPos = createVector(width/2, height/2);
    this.healthUISize = 100;
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
    if (!this.isInIFrames){
      this.currentColour = this.colour;
      this.totalKnockBackIntervals = 0;
    }
    
    push();
    translate(this.pos.x, this.pos.y);
    this.angle = atan2(mouseY - this.pos.y, mouseX - this.pos.x);
    fill(this.currentColour);
    stroke("black");
    rotate(this.angle);
    rectMode(CENTER);
    square(0, 0, this.size);
    pop();

  }

  shootBullets(){
    if (mouseIsPressed && this.lastTimeFiredBullet < millis()){
      this.lastTimeFiredBullet = millis() + this.bulletFirerate;
      playerBulletsArray.push(new Bullet(this.pos.x, this.pos.y, this.angle, this.bulletDamage));

      shootBulletSFX.setVolume(0.3);
      shootBulletSFX.play();
    }
  }

  collideWithZombie(){
    if (!this.isInIFrames){
      for (let i = zombiesArray.length - 1; i >= 0; i--){
        if (dist(zombiesArray[i].pos.x, zombiesArray[i].pos.y, this.pos.x, this.pos.y) < this.size * 0.9){
          this.lastHitBy = "zombie";
          this.takeDamage(zombiesArray[i].damage);
          this.knockBackAngle = zombiesArray[i].angle;
          zombiesArray.splice(i, 1);
        }
      }
    }
    else if (this.lastHitBy === "zombie"){
      this.knockBack();
      this.damageFlashingEffect();

      if (millis() >= this.lastTookDamage + this.iFramesLength){
        this.isInIFrames = false;
      }
    }
  }

  collideWithZombieBullet(){
    if (!this.isInIFrames){
      for (let i = zombieProjectileArray.length - 1; i >= 0; i--){
        if (dist(zombieProjectileArray[i].pos.x, zombieProjectileArray[i].pos.y, this.pos.x, this.pos.y) < this.size * 2/3){
          this.lastHitBy = "projectile";
          this.takeDamage(zombieProjectileArray[i].damage);
          zombieProjectileArray.splice(i, 1);
        }
      }
    }
    else if (this.lastHitBy === "projectile"){
      this.damageFlashingEffect();

      if (millis() >= this.lastTookDamage + this.iFramesLength){
        this.isInIFrames = false;
      }
    }
  }

  takeDamage(_damage){
    this.health -= _damage;

    this.isInIFrames = true;
    this.lastTookDamage = millis();

    tookDmgSFX.setVolume(0.7);
    tookDmgSFX.play();
    
    console.log(this.health);
  }

  // knocks player back when they get hit by an enemy
  knockBack(){
    let maxKnockBackIntervals = 10;

    if (this.totalKnockBackIntervals < maxKnockBackIntervals){
      this.pos.x += this.knockBackSpd * cos(this.knockBackAngle);
      this.pos.y += this.knockBackSpd * sin(this.knockBackAngle);

      this.totalKnockBackIntervals += 1;
    }
  }

  // when damaged, flash from base colour to flashing colour for iFrames duration
  damageFlashingEffect(){
    let flashingInterval = this.iFramesLength * 0.1;

    if (millis() > this.lastTimeFlashed + flashingInterval){
      if (this.flashedLastInterval){
        this.currentColour = this.colour;
      }
      else if (!this.flashedLastInterval){
        this.currentColour = this.flashingColour;
      }

      this.flashedLastInterval = !this.flashedLastInterval;
      this.lastTimeFlashed = millis();
    }
  }

  // shows the healthBar of the player
  displayHealthUI(){
    
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

    this.currentFillColour = this.fillColour;
    this.damagedFillColour = color(255);

    this.lastTimeDamaged = 0;

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
        this.lastTimeDamaged = millis();

        hitEnemySFX.setVolume(0.8);
        hitEnemySFX.play();

        this.dmgFlash();
      }
    }
  }

  // when damaged, flash quickly to white
  dmgFlash(){
    let flashTime = 0.1;
    // flash
    if (millis() < flashTime + this.lastTimeDamaged){
      this.currentFillColour = this.damagedFillColour;
    }
    // revert to normal colour
    else {
      this.currentFillColour = this.fillColour;
    }
  }

  killZombie(){
    if (this.health <= 0){
      let index = zombiesArray.indexOf(this);
      playerCash += this.bounty;

      enemyDieSFX.setVolume(0.3);
      enemyDieSFX.play();

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

class Shooter extends Enemy {
  constructor(){
    super("shooter", 15, 1.2, 3, 1, 15, "blue", "black");
    this.firerate = 4000; // milliseconds
    this.lastTimeFiredBullet = 0;
    this.bulletRadius = 5;
    this.bulletDamage = 2;
    this.bulletSpd = 10;
  }

  shoot(){
    if (this.pos.x > 0 && this.pos.x < width && this.pos.y > 0 && this.pos.y < height){
      if (this.lastTimeFiredBullet < millis()){
        this.lastTimeFiredBullet = millis() + this.firerate;
        zombieProjectileArray.push(new EnemyBullet(this.pos.x, this.pos.y, this.angle, this.bulletRadius, "blue", this.bulletDamage, this.bulletSpd,)); // also use angle offset potentially
        
        enemyBulletShootSFX.setVolume(0.2);
        enemyBulletShootSFX.play();
      }
    }
  }
}

class EnemyBullet {
  constructor(_x, _y, _angle, _radius, _colour, _damage, _spd,){
    this.pos = createVector(_x, _y);
    this.angle = _angle;
    this.spd = _spd;
    this.radius = _radius;
    this.damage = _damage;

    this.colour = _colour;
  }

  display(){
    stroke("black");
    fill(this.colour);
    circle(this.pos.x, this.pos.y, this.radius * 2);
  }

  movement(){
    this.pos.x += this.spd * cos(this.angle);
    this.pos.y += this.spd * sin(this.angle);
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


class UpgradesShop {
  constructor(){
    this.isOpened = false;

    // display shop stuff for when it isn't opened
    this.openShopButtonPos = createVector(width / 2, 0);
    this.openShopButtonColour = color(170, 170, 170, 255);

    this.currentRadius;
    this.intermissionRadius = width / 16;
    this.duringWaveRadius = width / 24;

    // display stuff for ui when the shop IS opened
    this.shopBGPos = createVector(width / 2, this.openShopButtonPos.y / 2);
    this.shopBGColour = color(170, 170, 170, 50);

    // may not be needed
    this.page = 1;
    this.maxPage = 1;

    // shop costs, upgrade lvs, increase values
    this.maxLvs = 8; // can be used later

    this.healthLv = 0;
    this.healthCost = 100;
    this.healthIncreaseAmount = 1;
    
    this.bulletDmgLv = 0;
    this.bulletDmgCost = 100;
    this.bulletDmgIncreaseAmount = 0.5;

    this.movementSpdLv = 0;
    this.movementSpdCost = 100;
    this.movementSpdIncreaseAmount = 0.5;

    this.bulletFirerateLv = 0;
    this.bulletFirerateCost = 100;
    this.bulletFirerateIncreaseAmount = 25;
  }

  display(){
    stroke("black");
    fill(this.openShopButtonColour);
    arc(this.openShopButtonPos.x, this.openShopButtonPos.y, this.currentRadius * 2, this.currentRadius * 2, 0, PI);

    if (canBeginNextWave){
      // displays "T" to indicate how to open shop
      noStroke();
      textAlign(CENTER);
      fill("black");
      textSize(30);
      text("T", this.openShopButtonPos.x, this.openShopButtonPos.y + 30);
      if (!this.isOpened){
        this.currentRadius = this.intermissionRadius;
        this.openShopButtonPos.y = 0;
      }
      else if (this.isOpened){
        this.currentRadius = this.intermissionRadius;
        this.openShopButtonPos.y = height / 3;

        // draws BG of shop
        let cornerRadius = 20;
        fill(this.shopBGColour);
        stroke("black");
        rectMode(CENTER);
        rect(this.shopBGPos.x, this.shopBGPos.y, width * 3/5, height / 1.5, cornerRadius);

        this.displayTextUI();
      }
    }
    else{
      this.currentRadius = this.duringWaveRadius;
      this.openShopButtonPos.y = -this.currentRadius / 4;
    }
  }

  displayTextUI(){
    noStroke();
    textSize(12);
    textStyle(BOLD);
    textAlign(CENTER);
    fill("white");
    // let textPos1 = createVector(width / 4, this.shopBGPos.y + height / 18);

    let textX1 = width * 0.36;
    let textX2 = width * 0.64;

    let textY1 = height/12;
    let textY2 = 2 * height/12;
    let textY3 = 3 * height/12;

    // max health increase
    text("INCREASE MAX HEALTH (1)", textX1, textY1);
    text("COST: " + this.healthCost + "   LV: " + this.healthLv, textX1, textY1 + 12);

    // bullet damage increase
    text("INCREASE BULLET DAMAGE (2)", textX1, textY2);
    text("COST: " + this.bulletDmgCost + "   LV: " + this.bulletDmgLv, textX1, textY2 + 12);

    // text("INCREASE MAX HEALTH (Y)", textX1, textY3);
    // text("COST: " + this.healthCost + "   LV: " + this.healthLv, textX1, textY3 + 12);


    text("INCREASE MOVEMENT SPEED(3)", textX2, textY1);
    text("COST: " + this.movementSpdCost + "   LV: " + this.movementSpdLv, textX2, textY1 + 12);

    text("INCREASE BULLET FIRE RATE (4)", textX2, textY2);
    text("COST: " + this.bulletFirerateCost + "   LV: " + this.bulletFirerateLv, textX2, textY2 + 12);

    // text("INCREASE MAX HEALTH (Y)", textX2, textY3);
    // text("COST: " + this.healthCost + "   LV: " + this.healthLv, textX2, textY3 + 12);

    // increase movement spd

  }

  maxHealthUpgrade(){
    if (playerCash >= this.healthCost){
      player.maxHealth += this.healthIncreaseAmount;
      player.health = player.maxHealth;
      console.log("maxHealth: " + player.maxHealth);
      console.log("health: " + player.health);

      this.healthLv += 1;
      playerCash -= this.healthCost;
      this.healthCost += 100;

      this.playUpgradeSFX();
    }
  }

  bulletDamageUpgrade(){
    if (playerCash >= this.bulletDmgCost){
      player.bulletDamage += this.bulletDmgIncreaseAmount;
      console.log("bulletDamage: " + player.bulletDamage);

      this.bulletDmgLv += 1;
      playerCash -= this.bulletDmgCost;
      this.bulletDmgCost += 100;

      this.playUpgradeSFX();
    }
  }

  movementSpdUpgrade(){
    if (playerCash >= this.movementSpdCost){
      player.speed += this.movementSpdIncreaseAmount;
      console.log("movementSpd: " + player.speed);

      this.movementSpdLv += 1;
      playerCash -= this.movementSpdCost;
      this.movementSpdCost += 100;

      this.playUpgradeSFX();
    }
  }

  bulletFirerateUpgrade(){
    if (playerCash >= this.bulletFirerateCost){
      player.bulletFirerate -= this.bulletFirerateIncreaseAmount;
      console.log("bulletFiringSpd: " + player.bulletFirerate);

      this.bulletFirerateLv += 1;
      playerCash -= this.bulletFirerateCost;
      this.bulletFirerateCost += 150;

      this.playUpgradeSFX();
    }
  }

  // updates costs + increase values of upgrades depending which level your at
  updateUpgradeValues(){
    // max health

  }

  playUpgradeSFX(){
    buyUpgradeSFX.setVolume(0.2);
    buyUpgradeSFX.play();
  }
}





function preload(){
  gameMusicLoop = loadSound("Assets/n-Dimensions (Main Theme - Retro Ver.mp3");

  shootBulletSFX = loadSound("Assets/SFX/synth_laser_03.ogg"); //
  tookDmgSFX = loadSound("Assets/SFX/retro_die_01.ogg"); //

  enemyBulletShootSFX = loadSound("Assets/SFX/synth_laser_04.ogg"); //
  hitEnemySFX = loadSound("Assets/SFX/shot_01.ogg"); //
  enemyDieSFX = loadSound("Assets/SFX/retro_die_02.ogg"); //

  openShopSFX = loadSound("Assets/SFX/click.wav"); //
  buyUpgradeSFX = loadSound("Assets/SFX/power_up_04.ogg"); //
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
  zombieProjectileArray.splice(0);

  upgradesShop = new UpgradesShop();
  playerCash = 100000;

  waveNum = 0;
  miniWave = 0;
  enemySpawnedCounter = 0;

  canBeginNextWave = true;
  zombiesFinishedSpawning = true;

  // music
  gameMusicLoop.stop();
  gameMusicLoop.setVolume(0.5);
  gameMusicLoop.loop();
}


function draw(){
  background(0);

  // class management
  manageShopFunctions();
  manageZombieProjectileFunctions();
  manageBulletFunctions();
  manageZombieFunctions();
  managePlayerFunctions();
  

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
  // player.takeDamage();
  player.collideWithZombie();
  player.collideWithZombieBullet();

  player.displayHealthUI();

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

    specialZombieFunctions(zombiesArray[i]);

    zombiesArray[i].killZombie();
  }
}

function specialZombieFunctions(zombie){
  if (zombie.type === "shooter"){
    zombie.shoot();
  }
}

function manageZombieProjectileFunctions(){
  for (let i = zombieProjectileArray.length - 1; i >= 0; i--){
    zombieProjectileArray[i].display();
    zombieProjectileArray[i].movement();

    if (zombieProjectileArray[i].isOffScreen()){
      zombieProjectileArray.splice(i, 1);
    }
  }
}



function zombieWaveManager(){
  // intervals are written in seconds
  if (waveNum === 1){
    // spawnZombies("normal", 5, 1, 1);
    // spawnZombies("fast", 5, 1, 2);
    // areAllZombiesSpawned(2);
    spawnZombies("shooter", 10, 1, 1);
    spawnZombies("normal", 5, 1, 2);
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
  if (_enemyType === "shooter"){
    zombiesArray.push(new Shooter());
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

// when called, starts the next wave
function newWave(){
  canBeginNextWave = false;
  zombiesFinishedSpawning = false;
  waveNum += 1;
  miniWave = 1;

  upgradesShop.isOpened = false;
  openShopSFX.play();
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
  }
}


function manageShopFunctions(){
  upgradesShop.display();
}

// controls navigation + purchases in shop using keybinds
function keyReleased(){
  // pressing t opens the shop
  if (key === "t" && canBeginNextWave){
    upgradesShop.isOpened = !upgradesShop.isOpened;
    upgradesShop.page = 1;
    
    openShopSFX.setVolume(1);
    openShopSFX.play();
  }

  // allows you to purchase upgrades when the shop is opened
  if (upgradesShop.isOpened){
    if (key === "1"){
      upgradesShop.maxHealthUpgrade();
      console.log("Cash: " + playerCash);
    }
    else if (key === "2"){
      upgradesShop.bulletDamageUpgrade();
      console.log("Cash: " + playerCash);
    }
    else if(key === "3"){
      upgradesShop.movementSpdUpgrade();
      console.log("Cash: " + playerCash);
    }
    else if (key === "4"){
      upgradesShop.bulletFirerateUpgrade();
      console.log("Cash: " + playerCash);
    }
  }
}



// used purely for debugging; delete once project is finished
function debugText(){
  textSize(10);
  textStyle(NORMAL);
  if (player.isInIFrames){
    fill("yellow");
  }
  else{
    fill("white");
  }
  text("Iframes: " + player.isInIFrames, 50, 50);
}