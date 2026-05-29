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

// for size stuff

class Player {
  constructor(){
    this.pos = createVector(width/2, height / 2);
    this.dir = createVector(0, 0);
    this.angle;
    this.speed = 5; // 5.5
    this.size = 30; // 30
    this.colour = color(255);
    this.currentColour = this.colour;

    this.maxHealth = 10;
    this.health = this.maxHealth;
    this.bulletFirerate = 400; // milli-seconds (300)
    this.lastTimeFiredBullet = 0;
    this.bulletDamage = 1; // 1
    
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
    this.healthUISize = 50;
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
        if (dist(zombiesArray[i].pos.x, zombiesArray[i].pos.y, this.pos.x, this.pos.y) < (zombiesArray[i].radius + this.size / 2) * 0.85){
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
    // background of it
    noStroke();
    fill(50);
    circle(this.healthUIPos.x, this.healthUIPos.y, this.healthUISize * 1.2);

    // meter
    noStroke();
    fill("green");
    arc(this.healthUIPos.x, this.healthUIPos.y, this.healthUISize, this.healthUISize, 0, 2 * PI * (this.health / this.maxHealth));

    fill("black");
    stroke("white");
    textAlign(CENTER);
    textSize(25);
    text(this.health, this.healthUIPos.x, this.healthUIPos.y + 25/4);
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
    this.maxHealth = _health;
    this.health = this.maxHealth;
    this.damage = _damage;
    this.bounty = _bounty;


    this.fillColour = _fillColour;
    this.strokeColour = _strokeColour;
    this.currentFillColour = this.fillColour;
    this.damagedFillColour = color(255);
    this.healedFillColour = color(199, 252, 206);
    this.lastTimeDamaged = 0;
    this.lastTimeHealed = 0;

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
    this.determineFillColour();
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
      }
    }
  }

  determineFillColour(){
    let flashTime = 100; // milliseconds
    // damage flash
    if (millis() < this.lastTimeDamaged + flashTime){
      this.currentFillColour = this.damagedFillColour;
    }
    // heal flash
    else if (millis() < this.lastTimeHealed + flashTime){
      this.currentFillColour = this.healedFillColour;
    }
    // stay normal colour
    else {
      this.currentFillColour = this.fillColour;
    }

    fill(this.currentFillColour);
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
    super(normal, 15, 3, 3, 1, 10, color(252, 144, 43), "black");
  }
}

class Guardian extends Enemy {
  constructor(){
    super("guardian", 20, 2.6, 6, 2, 25, color(252, 122, 0), "black");
  }
}

class Fast extends Enemy {
  constructor(){
    super(fast, 12, 5, 2, 2, 15, color(247, 221, 69), "black");
  }
}

class Strong extends Enemy {
  constructor(){
    super(strong, 35, 2, 10, 5, 50, color(245, 69, 66), "black");
  }
}

class Shooter extends Enemy {
  constructor(){
    super(shooter, 15, 1.2, 4, 1, 20, color(92, 66, 237), "black");
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
        zombieProjectileArray.push(new EnemyBullet(this.pos.x, this.pos.y, this.angle, this.bulletRadius, this.fillColour, this.bulletDamage, this.bulletSpd,)); // also use angle offset potentially
        
        enemyBulletShootSFX.setVolume(0.2);
        enemyBulletShootSFX.play();
      }
    }
  }
}

class Healer extends Enemy {
  constructor(){
    super(healer, 15, 1.7, 6, 1, 25, color(62, 214, 65), "black");
    this.pulseRate = 2000; // milliseconds
    this.lastTimePulsed = 0;
    this.pulseRadius = 200;
    this.healAmount = 2;

    this.currentPulseColour;
    this.pulseColour = this.fillColour;
    this.pulseColourIsHealing = this.healedFillColour;
  }

  // for some reason, the line goes over the enemies, which isn't what's wanted
  pulseRangeDisplay(){
    let flashTime = 100;

    for (let i = zombiesArray.length - 1; i >= 0; i--){
      if (this !== zombiesArray[i] && zombiesArray[i].type !== healer){
        if (dist(this.pos.x, this.pos.y, zombiesArray[i].pos.x, zombiesArray[i].pos.y) < this.pulseRadius){
          // normal colour
          if (millis() >= this.lastTimeHealed + flashTime){
            this.currentPulseColour = this.pulseColour;
          }
          // heal flash
          else {
            this.currentPulseColour = this.pulseColourIsHealing;
          }
          stroke(this.currentPulseColour);

          strokeWeight(2);
          line(this.pos.x, this.pos.y, zombiesArray[i].pos.x, zombiesArray[i].pos.y);
          strokeWeight(1);
        }
      }
    }
  }

  pulse(){
    if (this.pos.x > 0 && this.pos.x < width && this.pos.y > 0 && this.pos.y < height){
      if (this.lastTimePulsed + this.pulseRate < millis()){
        this.lastTimePulsed = millis();
        this.lastTimeHealed = millis();
        this.healAllies();
      }
    }
  }

  healAllies(){
    for (let i = zombiesArray.length - 1; i >= 0; i--){
      if (this !== zombiesArray[i] && zombiesArray[i].type !== healer){
        if (dist(this.pos.x, this.pos.y, zombiesArray[i].pos.x, zombiesArray[i].pos.y) < this.pulseRadius){
          zombiesArray[i].health += this.healAmount;

          if (zombiesArray[i].health > zombiesArray[i].maxHealth){
            zombiesArray[i].health = zombiesArray[i].maxHealth;
          }

          zombiesArray[i].lastTimeHealed = millis();
        }
      }
    }
  }
}

// unsure if this enemy can be made
class Bouncer extends Enemy{
  constructor(){
    super("bouncer", 15, 1.5, );
  }
}

class EnemyBullet {
  constructor(_x, _y, _angle, _radius, _colour, _damage, _spd,){
    this.pos = createVector(_x, _y);
    this.angle = _angle;
    this.spd = _spd;
    this.radius = _radius;
    this.damage = _damage;

    this.type = "bullet";
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
    this.healthCost = 150;
    this.healthIncreaseAmount = 1;
    
    this.bulletDmgLv = 0;
    this.bulletDmgCost = 300;
    this.bulletDmgIncreaseAmount = 1.25; // 0.5

    this.movementSpdLv = 0;
    this.movementSpdCost = 100;
    this.movementSpdIncreaseAmount = 0.5;

    this.bulletFirerateLv = 0;
    this.bulletFirerateCost = 250;
    this.bulletFirerateIncreaseAmount = 0.8; // 30
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
      textStyle(BOLD);
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
    let shopTextSize = 15;
    textSize(shopTextSize);
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
    text("COST: " + this.healthCost + "   LV: " + this.healthLv, textX1, textY1 + shopTextSize);

    // bullet damage increase
    text("INCREASE BULLET DAMAGE (2)", textX1, textY2);
    text("COST: " + this.bulletDmgCost + "   LV: " + this.bulletDmgLv, textX1, textY2 + shopTextSize);

    // text("INCREASE MAX HEALTH (Y)", textX1, textY3);
    // text("COST: " + this.healthCost + "   LV: " + this.healthLv, textX1, textY3 + 12);


    text("INCREASE MOVEMENT SPEED(3)", textX2, textY1);
    text("COST: " + this.movementSpdCost + "   LV: " + this.movementSpdLv, textX2, textY1 + shopTextSize);

    text("INCREASE BULLET FIRE RATE (4)", textX2, textY2);
    text("COST: " + this.bulletFirerateCost + "   LV: " + this.bulletFirerateLv, textX2, textY2 + shopTextSize);

    // text("INCREASE MAX HEALTH (Y)", textX2, textY3);
    // text("COST: " + this.healthCost + "   LV: " + this.healthLv, textX2, textY3 + 12);

    // cash text

    textAlign(LEFT);
    textSize(24);
    text("CASH: " + playerCash, width / 4.6, height / 3.2);
  }

  maxHealthUpgrade(){
    if (playerCash >= this.healthCost){
      player.maxHealth += this.healthIncreaseAmount;
      player.health = player.maxHealth;

      playerCash -= this.healthCost;
      this.healthCost += 100 * (this.healthLv + 1);
      this.healthLv += 1;

      this.playUpgradeSFX();
    }
  }

  bulletDamageUpgrade(){
    if (playerCash >= this.bulletDmgCost){
      // player.bulletDamage += this.bulletDmgIncreaseAmount;
      player.bulletDamage *= this.bulletDmgIncreaseAmount;

      playerCash -= this.bulletDmgCost;
      this.bulletDmgCost += 200 * (this.bulletDmgLv + 1);
      this.bulletDmgLv += 1;

      this.playUpgradeSFX();
    }
  }

  movementSpdUpgrade(){
    if (playerCash >= this.movementSpdCost){
      player.speed += this.movementSpdIncreaseAmount;

      playerCash -= this.movementSpdCost;
      this.movementSpdCost += 225 * (this.movementSpdLv + 1);
      this.movementSpdLv += 1;

      this.playUpgradeSFX();
    }
  }

  bulletFirerateUpgrade(){
    if (playerCash >= this.bulletFirerateCost && player.bulletFirerate > 50){
      // player.bulletFirerate -= this.bulletFirerateIncreaseAmount;
      player.bulletFirerate *= this.bulletFirerateIncreaseAmount;

      playerCash -= this.bulletFirerateCost;
      this.bulletFirerateCost += 175 * (this.bulletFirerateLv + 1);
      this.bulletFirerateLv += 1;

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
  playerCash = 0;

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
  player.displayHealthUI();
  tutorialText();
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
  player.movement();
  player.shootBullets();
  player.collideWithZombie();
  player.collideWithZombieBullet();
  player.display();
  
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
    specialZombieFunctions(zombiesArray[i]);
  }

  for (let i = zombiesArray.length - 1; i >= 0; i--){
    zombiesArray[i].display();
    zombiesArray[i].movement();
    zombiesArray[i].takeDamage();

    zombiesArray[i].killZombie();
  }
}

function specialZombieFunctions(zombie){
  if (zombie.type === shooter){
    zombie.shoot();
  }
  if (zombie.type === healer){
    zombie.pulse();
    zombie.pulseRangeDisplay();
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


let normal = "normal";
let fast = "fast";
let strong = "strong";
let shooter = "shooter";
let healer = "healer";
// let bouncer = "bouncer";

function zombieWaveManager(){
  // intervals are written in seconds
  if (waveNum === 1){
    spawnZombies(normal, 4, 1.3, 1);
    spawnZombies(normal, 4, 0.3, 2);

    areAllZombiesSpawned(2);
  }
  if (waveNum === 2){
    spawnZombies(fast, 4, 0.6, 1);
    spawnZombies(normal, 6, 0.7, 2);
    spawnZombies(fast, 3, 0.4, 3);

    areAllZombiesSpawned(3);
  }
  if (waveNum === 3){
    spawnZombies(fast, 10, 0.8, 1);
    waitToSpawn(2.5, 2);
    spawnZombies(fast, 5, 0.1, 3);

    areAllZombiesSpawned(3);
  }
  if (waveNum === 4){
    spawnZombies(strong, 1, 1, 1);
    spawnZombies(fast, 4, 0.6, 2);
    spawnZombies(normal, 6, 0.5, 3);
    spawnZombies(strong, 2, 1, 4);

    areAllZombiesSpawned(4);
  }
  if (waveNum === 5){
    spawnZombies(normal, 8, 0.4, 1);
    spawnZombies(fast, 4, 0.3, 2);
    spawnZombies(strong, 2, 1, 3);

    spawnZombies(normal, 10, 0.6, 4);
    spawnZombies(fast, 6, 0.5, 5);
    spawnZombies(strong, 2, 0.8, 6);

    areAllZombiesSpawned(6);
  }
  if (waveNum === 6){
    spawnZombies(normal, 6, 0.5, 1);
    spawnZombies(shooter, 3, 0.8, 2);
    spawnZombies(normal, 8, 0.7, 3);
    spawnZombies(shooter, 5, 0.8, 4);

    areAllZombiesSpawned(4);
  }
  if (waveNum === 7){
    spawnZombies(strong, 1, 0.3, 1);
    spawnZombies(shooter, 5, 0.5, 2);
    spawnZombies(fast, 5, 0.5, 3);

    spawnZombies(strong, 1, 0.3, 4);
    spawnZombies(shooter, 7, 0.4, 5);
    spawnZombies(fast, 8, 0.5, 6);

    areAllZombiesSpawned(6);
  }
  if (waveNum === 8){
    spawnZombies(normal, 20, 0.1, 1);
    spawnZombies("guardian", 5, 0.9, 2);
    spawnZombies(shooter, 6, 0.4, 3);

    areAllZombiesSpawned(3);
  }
  if (waveNum === 9){
    spawnZombies(strong, 2, 0.3, 1);
    spawnZombies(normal, 8, 0.2, 2);
    spawnZombies(healer, 3, 1, 3);
    spawnZombies(strong, 1, 0.2, 4);
    spawnZombies(shooter, 6, 0.9, 5);

    areAllZombiesSpawned(5);
  }
  if (waveNum === 10){
    spawnZombies();

    spawnZombies(strong, 2, 0.5, 1);
    spawnZombies(healer, 3, 0.5, 2);
    spawnZombies("guardian", 8, 1, 3);
    spawnZombies(shooter, 5, 0.3, 4);

    wTSpawnUnderEnemyCount(7, 5);

    spawnZombies(fast, 18, 0.3, 6);
    spawnZombies("guardian", 6, 0.9, 7);

    wTSpawnUnderEnemyCount(10, 8);

    spawnZombies(shooter, 10, 0.3, 9);
    spawnZombies("guardian", 8, 0.5, 10);
    spawnZombies(strong, 3, 0.5, 11);
    spawnZombies(healer, 3, 0.1, 12);

    areAllZombiesSpawned(12);
  }
}

// organization function - used to spawn specific type of enemy called in spawnZomibes()
function zombieTypeToSpawn(_enemyType){
  if (_enemyType === normal){
    zombiesArray.push(new Normal());
  }
  if (_enemyType === "guardian"){
    zombiesArray.push(new Guardian());
  }
  if (_enemyType === fast){
    zombiesArray.push(new Fast());
  }
  if (_enemyType === strong){
    zombiesArray.push(new Strong());
  }
  if (_enemyType === shooter){
    zombiesArray.push(new Shooter());
  }
  if (_enemyType === healer){
    zombiesArray.push(new Healer());
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

function waitToSpawn(_seconds, _miniWaveNum){
  _seconds *= 1000;
  if (miniWave === _miniWaveNum){
    if (millis() > lastSpawnTime + _seconds){
      miniWave += 1;
      enemySpawnedCounter = 0;
    }
  }
}

function wTSpawnUnderEnemyCount(_enemyCountReq, _miniWaveNum){
  if (miniWave === _miniWaveNum){
    if (zombiesArray.length <= _enemyCountReq){
      miniWave += 1;
      enemySpawnedCounter = 0;
    }
  }
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
    }
    else if (key === "2"){
      upgradesShop.bulletDamageUpgrade();
    }
    else if(key === "3"){
      upgradesShop.movementSpdUpgrade();
    }
    else if (key === "4"){
      upgradesShop.bulletFirerateUpgrade();
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

function tutorialText(){
  let textPos = createVector(width / 2, height * 0.65);
  let tutorialTextSize = 22;
  fill("white");
  textSize(tutorialTextSize);
  textAlign(CENTER);
  textStyle(NORMAL);

  if (canBeginNextWave){
    if (waveNum === 0){
      text("Use WASD to move around", textPos.x, textPos.y);
      text("Hold the mouse button to shoot bullets", textPos.x, textPos.y + tutorialTextSize * 2);
      text("Shoot the approaching blobs", textPos.x, textPos.y + tutorialTextSize * 4);

      text("Press the space bar to begin", textPos.x, textPos.y - tutorialTextSize * 12);
    }
    if (waveNum === 2){
      text("Press ' T ' to open up the shop", textPos.x, textPos.y);
      text("Use the number keys to purchase specific upgrades", textPos.x, textPos.y + tutorialTextSize * 2);
    }
    if (waveNum === 5){
      text("Some enemies can shoot bullets of their own", textPos.x, textPos.y);
      text("Make sure to avoid their shots", textPos.x, textPos.y + tutorialTextSize * 2);
    }
    if (waveNum === 8){
      text("If you haven't already, get some damage or fire rate upgrades", textPos.x, textPos.y);
      text("You'll need it to outdamage their healing", textPos.x, textPos.y + tutorialTextSize * 2);
    }
  }
}