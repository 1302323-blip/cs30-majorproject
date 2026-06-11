// Array and Object Notation
// Steven Qiu
// March 5, 2026

// Extra for Experts:
// - Makes use of sound effects for multiple interactions
// - Uses classes to perform most of mechanics in game
// - Multiple new additions compared to older version
//  - Shop
//  - Knockback + flash effects
//  - Wave Spawn System
//  - Enemy Projectiles
//  - Etc.

let player;

// arrays
let playerBulletsArray = [];
let playerBombExplodeArray = [];
let zombiesArray = [];
let zombieProjectileArray = [];

// zombie wave variables (for spawning)
let waveNum = 0;
let miniWave = 0;
let enemySpawnedCounter = 0;
let allZombiesDead = true;
let zombiesFinishedSpawning = true;
let canBeginNextWave = true;
let lastSpawnTime = 0;

// shop related variables
let upgradesShop;
let playerCash;

// sound effects/music
let gameMusicLoop;

let shootBulletSFX;
let tookDmgSFX;

let enemyBulletShootSFX;
let enemyHealSFX;
let hitEnemySFX;
let enemyDieSFX;

let openShopSFX;
let buyUpgradeSFX;

// enemy types
let normal = "normal";
let guardian = "guardian";
let fast = "fast";
let bolt = "bolt";
let strong = "strong";
let brute = "brute";
let shooter = "shooter";
let sprayer = "sprayer";
let healer = "healer";

// classes ------------------------------------------------------------------------------------------------------------------------------------------

// player classes ---------------------------------------------------------------------------------
class Player {
  constructor(){
    this.pos = createVector(width/2, height / 2);
    this.dir = createVector(0, 0);
    this.angle;
    this.speed = 5;
    this.size = 30;
    this.colour = color(255, 255, 255, 255);
    this.currentColour = this.colour;

    this.maxHealth = 10;
    this.health = this.maxHealth;

    // bullets
    this.bulletFirerate = 400; // milli-seconds
    this.bulletDamage = 1;
    // bombs
    this.bombFirerate = 850;
    this.bombDamage = 1;
    this.bombExplosionRadius = 100;

    this.currentWeapon = "bullet"; // bullet, bomb
    this.lastTimeFiredBullet = 0;

    // for when taking damage
    this.iFramesLength = 1000; // milli-seconds
    this.isInIFrames = false;
    this.lastTookDamage = 0;
    this.knockBackSpd = 15;
    this.totalKnockBackIntervals = 0; // counts amount of times knockBack has been applied
    this.knockBackAngle;

    this.lastHitBy; // zombie/projectile

    // effects for when damaged
    this.flashingColour = color(0, 0, 0, 0);
    this.lastTimeFlashed = 0;

    // health bar/circle
    this.healthUIPos = createVector(width/2, height/2);
    this.healthUISize = 50;
  }

  movement(){
    // vertical
    if (keyIsDown(87) || keyIsDown(38)){ // up
      this.dir.y = -1;
    }
    else if (keyIsDown(83) || keyIsDown(40)){ // down
      this.dir.y = 1;
    }
    else {
      this.dir.y = 0;
    }
    // horizontal
    if (keyIsDown(65) || keyIsDown(37)){ // left
      this.dir.x = -1;
    }
    else if (keyIsDown(68) || keyIsDown(39)){ // right
      this.dir.x = 1;
    }
    else {
      this.dir.x = 0;
    }

    // normalizing movement (no weird speed ups when moving diagonally)
    this.dir.normalize();
    this.dir.mult(this.speed);
    this.pos.add(this.dir);

    // contains on screen
    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);
  }

  display(){
    // determine fill colour
    this.damageFlashingEffect();
    if (!this.isInIFrames){
      stroke("black");
      this.currentColour = this.colour;
      this.totalKnockBackIntervals = 0;
    }
    
    // display (angling)
    push();
    translate(this.pos.x, this.pos.y);
    this.angle = atan2(mouseY - this.pos.y, mouseX - this.pos.x);
    fill(this.currentColour);
    rotate(this.angle);
    rectMode(CENTER);
    square(0, 0, this.size);
    pop();
  }

  shootBullets(){
    if (this.currentWeapon === "bullet"){
      if (mouseIsPressed && this.lastTimeFiredBullet < millis()){
        this.lastTimeFiredBullet = millis() + this.bulletFirerate;
        playerBulletsArray.push(new Bullet(this.pos.x, this.pos.y, this.angle, this.bulletDamage));

        // play SFX
        shootBulletSFX.setVolume(0.3);
        if (!shootBulletSFX.isPlaying()){
          shootBulletSFX.play();
        }
      }
    }
  }

  shootBombs(){
    if (this.currentWeapon === "bomb"){
      if (mouseIsPressed && this.lastTimeFiredBullet < millis()){
        this.lastTimeFiredBullet = millis() + this.bombFirerate;
        playerBulletsArray.push(new Bomb(this.pos.x, this.pos.y, this.angle, this.bombDamage, this.bombExplosionRadius));

        // play SFX
        shootBulletSFX.setVolume(0.5);
        if (!shootBulletSFX.isPlaying()){
          shootBulletSFX.play();
        }
      }
    }
  }

  
  collideWithZombie(){ // when damaged by zombie
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
    // applies knockback if they were hit by a zombie
    else if (this.lastHitBy === "zombie"){
      this.knockBack();
    }
  }

  collideWithZombieBullet(){ // when damaged by bullet
    if (!this.isInIFrames){
      for (let i = zombieProjectileArray.length - 1; i >= 0; i--){
        if (dist(zombieProjectileArray[i].pos.x, zombieProjectileArray[i].pos.y, this.pos.x, this.pos.y) < this.size * 2/3){
          this.lastHitBy = "projectile";
          this.takeDamage(zombieProjectileArray[i].damage);
          zombieProjectileArray.splice(i, 1);
        }
      }
    }
  }

  takeDamage(_damage){
    this.health -= _damage;

    this.isInIFrames = true;
    this.lastTookDamage = millis();

    // play SFX
    tookDmgSFX.setVolume(0.7);
    if (!tookDmgSFX.isPlaying()){
      tookDmgSFX.play();  
    }
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
    if (this.isInIFrames){
      noStroke();
      let flashingInterval = this.iFramesLength * 0.1;

      // flashing between colours
      if (millis() > this.lastTimeFlashed + flashingInterval){
        if (this.currentColour === this.flashingColour){
          
          this.currentColour = this.colour;
        }
        else if (this.currentColour === this.colour){
          this.currentColour = this.flashingColour;
        }

        this.lastTimeFlashed = millis();
      }

      // sets isInIFrames to false when duration is up
      if (millis() >= this.lastTookDamage + this.iFramesLength){
        this.isInIFrames = false;
      }
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

    // text
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
    this.speed = 12;
    this.radius = 3;
    this.damage = _damage;

    this.colour = color("yellow");
    this.type = "bullet";
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
    if (this.pos.x < -this.radius || this.pos.x > width + this.radius || this.pos.y < -this.radius || this.pos.y > height + this.radius){
      isOffscreen = true;
    }
    else {
      isOffscreen = false;
    }
    return isOffscreen;
  }
}

class Bomb {
  constructor(_x, _y, _angle, _damage, _explosionRadius){
    this.pos = createVector(_x, _y);
    this.angle = _angle;
    this.speed = 8;
    this.radius = 11;
    this.damage = _damage;
    this.explosionRadius = _explosionRadius;

    this.colour = color(245, 114, 7);
    this.type = "bomb";

    this.indicatorR = 255;
    this.indicatorG = 0;
    this.indicatorB = 0;
    this.indicatorAlp = 70;
    this.indicatorColour;
  }

  display(){
    // explosion indicator
    noStroke();
    this.indicatorColour = color(this.indicatorR, this.indicatorG, this.indicatorB, this.indicatorAlp);
    fill(this.indicatorColour);
    circle(this.pos.x, this.pos.y, this.explosionRadius * 2);
    this.indicatorAlp -= 1.5;

    // actual bomb
    stroke("black");
    fill(this.colour);
    circle(this.pos.x, this.pos.y, this.radius * 2);
  }

  movement(){
    this.pos.x += this.speed * cos(this.angle);
    this.pos.y += this.speed * sin(this.angle);
  }

  isOffScreen(){
    let isOffscreen = false;
    if (this.pos.x < -this.radius || this.pos.x > width + this.radius || this.pos.y < -this.radius || this.pos.y > height + this.radius){
      isOffscreen = true;
    }
    else {
      isOffscreen = false;
    }
    return isOffscreen;
  }

  explode(){
    // creates explosion class to damage enemies with
    playerBombExplodeArray.push(new PlayerExplosion(this.damage, this.explosionRadius, this.pos.x, this.pos.y, this.colour));
  }
}

class PlayerExplosion {
  constructor(_damage, _radius, _x, _y, _colour){
    this.pos = createVector(_x, _y);
    this.damage = _damage;
    this.radius = _radius;
    this.r = _colour.levels[0];
    this.g = _colour.levels[1];
    this.b = _colour.levels[2];
    this.alp = 200;
    this.colour;

    // triggers damaging effects when created (only done once when created)
    this.damageEnemy();
    this.damagePlayer();
  }

  display(){ // effects
    noStroke();
    this.colour = color(this.r, this.g, this.b, this.alp);
    fill(this.colour);
    circle(this.pos.x, this.pos.y, this.radius * 2);
    this.alp -= 5;

    // become transparent over time
    if (this.alp <= 0){
      let index = playerBombExplodeArray.indexOf(this);
      playerBombExplodeArray.splice(index, 1);
    }
  }

  damageEnemy(){ // damages enemies when within explosion
    for (let i = zombiesArray.length - 1; i >=0; i--){
      if (dist(this.pos.x, this.pos.y, zombiesArray[i].pos.x, zombiesArray[i].pos.y) <= this.radius * 0.95){
        zombiesArray[i].health -= this.damage;
        zombiesArray[i].lastTimeDamaged = millis();

        // play SFX
        hitEnemySFX.setVolume(0.8);
        if (!hitEnemySFX.isPlaying()){
          hitEnemySFX.play();
        }
      }
    }
  }

  damagePlayer(){ // damages player if too close
    if (!player.isInIFrames){
      if (dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y) < this.radius * 0.95){
        player.lastHitBy = "projectile";
        player.takeDamage(1);
      }
    }
  }
}

// enemy classes ----------------------------------------------------------------------------------
class Enemy {
  constructor(_enemyType, _radius, _spd, _health, _damage, _bounty, _fillColour){
    this.pos = createVector();
    this.angle;
    this.radius = _radius;

    this.type = _enemyType;
    this.speed = _spd;
    this.maxHealth = _health;
    this.health = this.maxHealth;
    this.damage = _damage;
    this.bounty = _bounty;

    // colouring
    this.fillColour = _fillColour;
    this.currentFillColour = this.fillColour;
    this.damagedFillColour = color(255);
    this.healedFillColour = color(199, 252, 206);
    this.lastTimeDamaged = 0;
    this.lastTimeHealed = 0;

    this.spawnInZombie();
  }
  
  spawnInZombie(){ // spawn enemy in random location
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
    stroke("black");
    rotate(this.angle);
    circle(0, 0, this.radius * 2);
    pop();
  }

  movement(){
    this.pos.x += this.speed * cos(this.angle);
    this.pos.y += this.speed * sin(this.angle);
  }

  takeDamage(){ // taking damage from bullets; triggering bomb explosions
    for (let i = playerBulletsArray.length - 1; i >= 0; i--){
      if (dist(playerBulletsArray[i].pos.x, playerBulletsArray[i].pos.y, this.pos.x, this.pos.y) < this.radius * 1.1){
        // when hit by bullet, take damage
        if (playerBulletsArray[i].type === "bullet"){
          this.health -= playerBulletsArray[i].damage;
          this.lastTimeDamaged = millis();
        }
        // when hit by bomb, cause them to explode
        else if (playerBulletsArray[i].type === "bomb"){
          playerBulletsArray[i].explode();
        }

        // removes bullet/bomb that hit them
        playerBulletsArray.splice(i, 1);

        // play SFX
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

      // play SFX
      enemyDieSFX.setVolume(0.3);
      enemyDieSFX.play();

      // remove from list
      zombiesArray.splice(index, 1);
    }
  }
}

class Normal extends Enemy {
  constructor(){
    super(normal, 15, 3, 3, 1, 10, color(252, 144, 43));
  }
}

class Guardian extends Enemy {
  constructor(){
    super(guardian, 20, 2.6, 6, 2, 25, color(252, 86, 3));
  }
}

class Fast extends Enemy {
  constructor(){
    super(fast, 12, 4.5, 2, 2, 15, color(247, 221, 69));
  }
}

class Bolt extends Enemy {
  constructor(){
    super(bolt, 12, 7.5, 2, 2, 35, color(36, 207, 255));
  }
}

class Strong extends Enemy {
  constructor(){
    super(strong, 35, 2, 12, 5, 50, color(245, 69, 66));
  }
}

class Brute extends Enemy {
  constructor(){
    super(brute, 42, 1.4, 25, 8, 150, color(173, 0, 0));
  }
}

class Shooter extends Enemy {
  constructor(){
    super(shooter, 15, 1.2, 4, 1, 20, color(92, 66, 237));

    // stats for shooting/bullets
    this.firerate = 4000; // milliseconds
    this.lastTimeFiredBullet = 0;
    this.bulletRadius = 5;
    this.bulletDamage = 2;
    this.bulletSpd = 12;
  }

  shoot(){ // shoots bullets based on timer
    if (this.pos.x > 0 && this.pos.x < width && this.pos.y > 0 && this.pos.y < height){
      if (this.lastTimeFiredBullet + this.firerate < millis()){
        this.lastTimeFiredBullet = millis();
        zombieProjectileArray.push(new EnemyBullet(this.pos.x, this.pos.y, this.angle, this.bulletRadius, this.fillColour, this.bulletDamage, this.bulletSpd,)); // also use angle offset potentially
        
        // play SFX
        enemyBulletShootSFX.setVolume(0.2);
        enemyBulletShootSFX.play();
      }
    }
  }
}

class Sprayer extends Enemy{
  constructor(){
    super(sprayer, 20, 0.8, 8, 1, 50, color(66, 19, 186));

    // stats for shooting/bullets
    this.firerate = 250; // milliseconds
    this.lastTimeFiredBullet = 0;
    this.bulletRadius = 3.5;
    this.bulletDamage = 1;
    this.bulletSpd = 10;
  }

  shoot(){ // shoots bullets based on timer
    if (this.pos.x > 0 && this.pos.x < width && this.pos.y > 0 && this.pos.y < height){
      if (this.lastTimeFiredBullet < millis()){
        this.lastTimeFiredBullet = millis() + this.firerate;
        zombieProjectileArray.push(new EnemyBullet(this.pos.x, this.pos.y, this.angle, this.bulletRadius, this.fillColour, this.bulletDamage, this.bulletSpd,)); // also use angle offset potentially
        
        // play SFX
        enemyBulletShootSFX.setVolume(0.1);
        enemyBulletShootSFX.play();
      }
    }
  }
}

class Healer extends Enemy {
  constructor(){
    super(healer, 15, 1.7, 6, 1, 25, color(62, 214, 65));
    
    // stats for healing ability
    this.pulseRate = 2000; // milliseconds
    this.lastTimePulsed = 0;
    this.pulseRadius = 200;
    this.healAmount = 2;

    // effects of heal ability
    this.currentPulseColour;
    this.pulseColour = this.fillColour;
    this.pulseColourIsHealing = this.healedFillColour;

    this.currentLineSize;
    this.maxLineSize;
    this.minLineSize = 1;
  }

  pulseRangeDisplay(){ // displays if enemies are within its healing range
    let flashTime = 100;

    for (let i = zombiesArray.length - 1; i >= 0; i--){ // isn't the same enemy/a healer
      
      if (this !== zombiesArray[i] && zombiesArray[i].type !== healer){
        // check distance between
        let distanceApart = dist(this.pos.x, this.pos.y, zombiesArray[i].pos.x, zombiesArray[i].pos.y);
        
        if (distanceApart < this.pulseRadius){
          if (millis() >= this.lastTimeHealed + flashTime){ // normal colour
            this.currentPulseColour = this.pulseColour;
          }
          else { // heal flash
            this.currentPulseColour = this.pulseColourIsHealing;
          }

          // dynamic stroke weight
          this.maxLineSize = zombiesArray[i].radius * 0.6;
          let lineSize = map(distanceApart, 0, this.pulseRadius, this.maxLineSize, this.minLineSize);
          this.currentLineSize = lineSize;
          
          stroke(this.currentPulseColour);
          strokeWeight(this.currentLineSize);
          line(this.pos.x, this.pos.y, zombiesArray[i].pos.x, zombiesArray[i].pos.y);
          strokeWeight(1);
        }
      }
    }
  }

  pulse(){ // actual healing pulse
    if (this.pos.x > 0 && this.pos.x < width && this.pos.y > 0 && this.pos.y < height){
      if (this.lastTimePulsed + this.pulseRate < millis()){
        this.lastTimePulsed = millis();
        this.lastTimeHealed = millis();
        this.healAllies();
      }
    }
  }

  healAllies(){ // heals allies when hit by pulse
    for (let i = zombiesArray.length - 1; i >= 0; i--){
      if (this !== zombiesArray[i] && zombiesArray[i].type !== healer){ // isn't the same enemy/a healer
        if (dist(this.pos.x, this.pos.y, zombiesArray[i].pos.x, zombiesArray[i].pos.y) < this.pulseRadius){ // is in range
          zombiesArray[i].health += this.healAmount;

          // sets health back to max if overheals
          if (zombiesArray[i].health > zombiesArray[i].maxHealth){
            zombiesArray[i].health = zombiesArray[i].maxHealth;
          }

          // play SFX
          enemyHealSFX.setVolume(0.8);
          enemyHealSFX.play();
          zombiesArray[i].lastTimeHealed = millis();
        }
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

// shop class
class UpgradesShop {
  constructor(){
    this.isOpened = false;

    // Shop UI; Tab/Button thing
    this.openShopButtonPos = createVector(width / 2, 0);
    this.openShopButtonColour = color(170, 170, 170, 255);

    this.currentRadius;
    this.intermissionRadius = width * 0.03;
    this.duringWaveRadius = width * 0.02;

    // Shop UI; Background
    this.shopBGPos = createVector(width / 2, this.openShopButtonPos.y / 2);
    this.shopBGColour = color(170, 170, 170, 50);

    // shop costs, upgrade lvs, increase values
    // max health
    this.healthLv = 0;
    this.healthCost = 150;
    this.healthCostIncrease = 250;
    this.healthIncreaseAmount = 1;

    // movement speed
    this.movementSpdLv = 0;
    this.movementSpdCost = 100;
    this.movementSpdCostIncrease = 250;
    this.movementSpdIncreaseAmount = 0.5;
    
    // bullet damage
    this.bulletDmgLv = 0;
    this.bulletDmgCost = 300;
    this.bulletDmgCostIncrease = 200;
    this.bulletDmgIncreaseAmount = 1.25;

    // bullet firerate
    this.bulletFirerateLv = 0;
    this.bulletFirerateCost = 250;
    this.bulletFirerateCostIncrease = 200;
    this.bulletFirerateIncreaseAmount = 0.8;

    // bomb damage
    this.bombDmgLv = 0;
    this.bombDmgCost = 300;
    this.bombDmgCostIncrease = 200;
    this.bombDmgIncreaseAmount = 1.25;

    // bomb AOE
    this.bombAreaLv = 0;
    this.bombAreaCost = 250;
    this.bombAreaCostIncrease = 150;
    this.bombAreaIncreaseAmount = 1.045;
  }

  display(){
    // Tab/Button UI
    stroke("black");
    fill(this.openShopButtonColour);
    arc(this.openShopButtonPos.x, this.openShopButtonPos.y, this.currentRadius * 2, this.currentRadius * 2, 0, PI);

    if (canBeginNextWave){
      // displays "T" to indicate how to open shop; on top of button
      let textSizeOfKeyBind = 40;

      noStroke();
      textAlign(CENTER);
      fill("black");
      textSize(textSizeOfKeyBind);
      textStyle(BOLD);
      text("T", this.openShopButtonPos.x, this.openShopButtonPos.y + textSizeOfKeyBind);

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
        rect(this.shopBGPos.x, this.shopBGPos.y, width * 0.35, height / 1.5, cornerRadius);

        this.displayTextUI();
      }
    }
    else{
      this.currentRadius = this.duringWaveRadius;
      this.openShopButtonPos.y = -this.currentRadius / 4;
    }
  }

  displayTextUI(){ // draws all text related to upgrades + cash
    noStroke();
    let shopTextSize = 15;
    textSize(shopTextSize);
    textStyle(BOLD);
    textAlign(CENTER);
    fill("white");

    // positions sorting
    let textX1 = width * 0.42;
    let textX2 = width * 0.58;

    let textY1 = height/13;
    let textY2 = 2 * height/13;
    let textY3 = 3 * height/13;

    // max health
    text("INCREASE MAX HEALTH (1)", textX1, textY1);
    text("COST: " + this.healthCost + "   LV: " + this.healthLv, textX1, textY1 + shopTextSize);

    // bullet damage
    text("INCREASE BULLET DAMAGE (3)", textX1, textY2);
    text("COST: " + this.bulletDmgCost + "   LV: " + this.bulletDmgLv, textX1, textY2 + shopTextSize);

    // bomb damage
    text("INCREASE BOMB DAMAGE (5)", textX1, textY3);
    text("COST: " + this.bombDmgCost + "   LV: " + this.bombDmgLv, textX1, textY3 + shopTextSize);

    // movement speed
    text("INCREASE MOVEMENT SPEED (2)", textX2, textY1);
    text("COST: " + this.movementSpdCost + "   LV: " + this.movementSpdLv, textX2, textY1 + shopTextSize);

    // bullet firerate
    text("INCREASE BULLET FIRE RATE (4)", textX2, textY2);
    text("COST: " + this.bulletFirerateCost + "   LV: " + this.bulletFirerateLv, textX2, textY2 + shopTextSize);

    // bomb AOE
    text("INCREASE EXPLOSION RADIUS (6)", textX2, textY3);
    text("COST: " + this.bombAreaCost + "   LV: " + this.bombAreaLv, textX2, textY3 + shopTextSize);

    // cash text
    textAlign(LEFT);
    textSize(24);
    text("CASH: " + playerCash, width / 3, height / 3.2);
  }

  // upgrades
  maxHealthUpgrade(){
    if (playerCash >= this.healthCost){
      player.maxHealth += this.healthIncreaseAmount;
      player.health = player.maxHealth;

      playerCash -= this.healthCost;
      this.healthCost += this.healthCostIncrease * (this.healthLv + 1);
      this.healthLv += 1;

      this.playUpgradeSFX();
    }
  }

  movementSpdUpgrade(){
    if (playerCash >= this.movementSpdCost && player.speed < 9){
      player.speed += this.movementSpdIncreaseAmount;

      playerCash -= this.movementSpdCost;
      this.movementSpdCost += this.movementSpdCostIncrease * (this.movementSpdLv + 1);
      this.movementSpdLv += 1;

      this.playUpgradeSFX();
    }
  }

  bulletDamageUpgrade(){
    if (playerCash >= this.bulletDmgCost){
      player.bulletDamage *= this.bulletDmgIncreaseAmount;

      playerCash -= this.bulletDmgCost;
      this.bulletDmgCost += this.bulletDmgCostIncrease * (this.bulletDmgLv + 1);
      this.bulletDmgLv += 1;

      this.playUpgradeSFX();
    }
  }

  bulletFirerateUpgrade(){
    if (playerCash >= this.bulletFirerateCost && player.bulletFirerate > 50){
      player.bulletFirerate *= this.bulletFirerateIncreaseAmount;

      playerCash -= this.bulletFirerateCost;
      this.bulletFirerateCost += this.bulletFirerateCostIncrease * (this.bulletFirerateLv + 1);
      this.bulletFirerateLv += 1;

      this.playUpgradeSFX();
    }
  }

  bombDamageUpgrade(){
    if (playerCash >= this.bombDmgCost){
      player.bombDamage *= this.bombDmgIncreaseAmount;

      playerCash -= this.bombDmgCost;
      this.bombDmgCost += this.bombDmgCostIncrease * (this.bombDmgLv + 1);
      this.bombDmgLv += 1;

      this.playUpgradeSFX();
    }
  }

  bombAreaUpgrade(){
    if (playerCash >= this.bombAreaCost && player.bombExplosionRadius < 150){
      player.bombExplosionRadius *= this.bombAreaIncreaseAmount;

      playerCash -= this.bombAreaCost;
      this.bombAreaCost += this.bombAreaCostIncrease * (this.bombAreaLv + 1);
      this.bombAreaLv += 1;

      this.playUpgradeSFX();
    }
  }

  // SFX
  playUpgradeSFX(){
    buyUpgradeSFX.setVolume(0.2);
    if (!buyUpgradeSFX.isPlaying()){
      buyUpgradeSFX.play();
    }
  }
}

// set up + running of the game ---------------------------------------------------------------------------------------------------------------------

function preload(){ // for SFX
  gameMusicLoop = loadSound("Assets/n-Dimensions (Main Theme - Retro Ver.mp3");

  shootBulletSFX = loadSound("Assets/SFX/synth_laser_03.ogg");
  tookDmgSFX = loadSound("Assets/SFX/retro_die_01.ogg");

  enemyBulletShootSFX = loadSound("Assets/SFX/synth_laser_04.ogg");
  enemyHealSFX = loadSound("Assets/SFX/heal.wav");
  hitEnemySFX = loadSound("Assets/SFX/shot_01.ogg");
  enemyDieSFX = loadSound("Assets/SFX/retro_die_02.ogg");

  openShopSFX = loadSound("Assets/SFX/click.wav");
  buyUpgradeSFX = loadSound("Assets/SFX/power_up_04.ogg");
}

function setup(){
  createCanvas(windowWidth, windowHeight);
  reset();
}

function reset(){ // sets up/resets everything when games starts/restarts
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
}

// class management ---------------------------------------------------------------------------------------------------------------------------------

function managePlayerFunctions(){
  player.movement();
  player.shootBullets();
  player.shootBombs();
  player.collideWithZombie();
  player.collideWithZombieBullet();
  player.display();
  
  if (player.isDead()){ // resets game when all player health is lost
    reset();
  }
}

function manageBulletFunctions(){
  for (let i = playerBombExplodeArray.length - 1; i >= 0; i--){ // bomb explosion display (makes it on lower layer)
    playerBombExplodeArray[i].display();
  }

  for (let i = playerBulletsArray.length - 1; i >= 0; i--){
    playerBulletsArray[i].display();
    playerBulletsArray[i].movement();

    if (playerBulletsArray[i].isOffScreen()){ // delete when offscreen
      playerBulletsArray.splice(i, 1);
    }
  }
}

function manageZombieFunctions(){
  for (let i = zombiesArray.length - 1; i >= 0; i--){ // for special abilities
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
  if (zombie.type === shooter || zombie.type === sprayer){
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

    if (zombieProjectileArray[i].isOffScreen()){ // delete when offscreen
      zombieProjectileArray.splice(i, 1);
    }
  }
}

// wave related functions ---------------------------------------------------------------------------------------------------------------------------

function zombieWaveManager(){ // determines what each wave will be spawning
  // intervals are written in seconds
  if (waveNum === 1){ // normal
    spawnZombies(normal, 4, 1.3, 1);
    spawnZombies(normal, 4, 0.3, 2);

    areAllZombiesSpawned(2);
  }
  if (waveNum === 2){ // fast
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
  if (waveNum === 4){ // strong
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
  if (waveNum === 6){ // shooter
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
  if (waveNum === 8){ // guardian
    spawnZombies(normal, 20, 0.1, 1);
    spawnZombies(guardian, 5, 0.9, 2);
    spawnZombies(shooter, 6, 0.4, 3);

    areAllZombiesSpawned(3);
  }
  if (waveNum === 9){ // healer
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
    spawnZombies(guardian, 8, 1, 3);
    spawnZombies(shooter, 5, 0.3, 4);

    wTSpawnUnderEnemyCount(7, 5);

    spawnZombies(fast, 18, 0.3, 6);
    spawnZombies(guardian, 6, 0.9, 7);

    wTSpawnUnderEnemyCount(10, 8);

    spawnZombies(shooter, 10, 0.3, 9);
    spawnZombies(guardian, 8, 0.5, 10);
    spawnZombies(strong, 3, 0.5, 11);
    spawnZombies(healer, 3, 0.1, 12);

    areAllZombiesSpawned(12);
  }
  if (waveNum === 11){ // bolt
    spawnZombies(fast, 12, 0.3, 1);
    spawnZombies(bolt, 4, 1, 2);
    spawnZombies(guardian, 7, 0.5, 3);
    spawnZombies(bolt, 2, 0.3, 4);

    areAllZombiesSpawned(4);
  }
  if (waveNum === 12){
    spawnZombies(bolt, 5, 1, 1);
    spawnZombies(guardian, 5, 0.6, 2);
    spawnZombies(bolt, 3, 0.8, 3);
    spawnZombies(strong, 7, 0.1, 4);
    spawnZombies(healer, 5, 0.8, 5);
    spawnZombies(bolt, 5, 1.5, 6);

    areAllZombiesSpawned(6);
  }
  if (waveNum === 13){ // sprayer
    spawnZombies(shooter, 15, 1.2, 1);
    spawnZombies(guardian, 5, 0.3, 2);
    spawnZombies(sprayer, 1, 1, 3);

    wTSpawnUnderEnemyCount(5, 4);

    spawnZombies(bolt, 3, 0.1, 5);
    spawnZombies(shooter, 8, 0.3, 6);
    spawnZombies(sprayer, 1, 3, 7);
    spawnZombies(healer, 4, 0.3, 8);

    areAllZombiesSpawned(8);
  }
  if (waveNum === 14){
    spawnZombies(sprayer, 3, 0.2, 1);
    spawnZombies(guardian, 4, 0.5, 2);
    spawnZombies(shooter, 8, 0.8, 3);
    spawnZombies(healer, 2, 0.3, 4);

    spawnZombies(guardian, 10, 0.9, 5);
    spawnZombies(shooter, 5, 0.2, 6);
    spawnZombies(bolt, 5, 2, 7);

    areAllZombiesSpawned(7);
  }
  if (waveNum === 15){ // brute
    spawnZombies(brute, 1, 0.1, 1);
    waitToSpawn(3, 2);
    spawnZombies(normal, 30, 0.1, 3);
    spawnZombies(guardian, 10, 0.2, 4);

    wTSpawnUnderEnemyCount(5, 5);

    spawnZombies(brute, 1, 0.1, 6);
    spawnZombies(fast, 18, 0.3, 7);
    spawnZombies(shooter, 5, 0.8, 8);
    spawnZombies(brute, 2, 0.5, 9);
    spawnZombies(healer, 5, 1, 10);
    spawnZombies(bolt, 4, 0.8, 11);

    wTSpawnUnderEnemyCount(5, 12);

    spawnZombies(brute, 5, 0.3, 13);
    spawnZombies(shooter, 8, 0.4, 14);
    spawnZombies(sprayer, 1, 0.1, 15);
    spawnZombies(guardian, 10, 1, 16);
    spawnZombies(sprayer, 2, 5, 17);

    areAllZombiesSpawned(17);
  }
}

function zombieTypeToSpawn(_enemyType){ // organization function - used to spawn specific type of enemy called in spawnZomibes()
  if (_enemyType === normal){
    zombiesArray.push(new Normal());
  }
  if (_enemyType === guardian){
    zombiesArray.push(new Guardian());
  }
  if (_enemyType === fast){
    zombiesArray.push(new Fast());
  }
  if (_enemyType === bolt){
    zombiesArray.push(new Bolt());
  }
  if (_enemyType === strong){
    zombiesArray.push(new Strong());
  }
  if (_enemyType === brute){
    zombiesArray.push(new Brute());
  }
  if (_enemyType === shooter){
    zombiesArray.push(new Shooter());
  }
  if (_enemyType === sprayer){
    zombiesArray.push(new Sprayer());
  }
  if (_enemyType === healer){
    zombiesArray.push(new Healer());
  }
}

function spawnZombies(_enemyType, _amount, _spawnInterval, _miniWaveNum){ // spawns zombies in each miniWave, determining amount and intervals between each spawn
  _spawnInterval *= 1000; // sets _spawnInterval to millis() to make if statements work

  if (miniWave === _miniWaveNum){
    if (millis() > lastSpawnTime + _spawnInterval){ // spawns during miniwave
      zombieTypeToSpawn(_enemyType);
      lastSpawnTime = millis();
      enemySpawnedCounter += 1;
    }
    
    if (enemySpawnedCounter === _amount){ // changes out of miniwave
      miniWave += 1;
      enemySpawnedCounter = 0;
    }
  }
}

function waitToSpawn(_seconds, _miniWaveNum){ // waits for a certain amount of time before spawning a new miniwave
  _seconds *= 1000;
  if (miniWave === _miniWaveNum){
    if (millis() > lastSpawnTime + _seconds){
      miniWave += 1;
      enemySpawnedCounter = 0;
    }
  }
}

function wTSpawnUnderEnemyCount(_enemyCountReq, _miniWaveNum){ // waits until the enemy count is below a certain threshold before spawning a new miniwave
  if (miniWave === _miniWaveNum){
    if (zombiesArray.length <= _enemyCountReq){
      miniWave += 1;
      enemySpawnedCounter = 0;
    }
  }
}

function areAllZombiesSpawned(_finalMiniWave){ // tracks if all zombies part of a whole wave have been spawned
  if (miniWave === _finalMiniWave + 1){
    zombiesFinishedSpawning = true;
  }
}

function isAllZombiesDead(){ // tracks if all zombies are dead, to see if a new wave can be started
  if (zombiesArray.length === 0){
    allZombiesDead = true;
  }
  else {
    allZombiesDead = false;
  }
}

function zombieWaveButton(){ // when keybind pressed, start the wave
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

function newWave(){ // when called, starts the next wave
  canBeginNextWave = false;
  zombiesFinishedSpawning = false;
  waveNum += 1;
  miniWave = 1;

  upgradesShop.isOpened = false;
  openShopSFX.play();
}

// shop related functions ---------------------------------------------------------------------------------------------------------------------------

function manageShopFunctions(){
  upgradesShop.display();
}

function keyReleased(){ // controls navigation + purchases in shop using keybinds; also controls weapon switching
  if (key === "e") {// presing e switches between weapons
    if (player.currentWeapon === "bullet"){
      player.currentWeapon = "bomb";
    }
    else if (player.currentWeapon === "bomb"){
      player.currentWeapon = "bullet";
    }

    openShopSFX.setVolume(1);
    openShopSFX.play();
  }

  
  if (key === "t" && canBeginNextWave){ // pressing t opens the shop
    upgradesShop.isOpened = !upgradesShop.isOpened;
    upgradesShop.page = 1;
    
    openShopSFX.setVolume(1);
    openShopSFX.play();
  }

  
  if (upgradesShop.isOpened){ // allows you to purchase upgrades when the shop is opened using number keys
    if (key === "1"){
      upgradesShop.maxHealthUpgrade();
    }
    else if(key === "2"){
      upgradesShop.movementSpdUpgrade();
    }
    else if (key === "3"){
      upgradesShop.bulletDamageUpgrade();
    }
    else if (key === "4"){
      upgradesShop.bulletFirerateUpgrade();
    }
    else if (key === "5"){
      upgradesShop.bombDamageUpgrade();
    }
    else if (key === "6"){
      upgradesShop.bombAreaUpgrade();
    }
  }
}



function tutorialText(){ // displays text inbetween waves to give tips and advice
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
    if (waveNum === 1){
      text("Press wave to start the next wave", textPos.x, textPos.y);
      text("You can tell when you can start the next wave when enemies stop approaching you", textPos.x, textPos.y + tutorialTextSize * 2);
    }
    if (waveNum === 2){
      text("Press ' T ' to open up the shop", textPos.x, textPos.y);
      text("Use the number keys to purchase specific upgrades", textPos.x, textPos.y + tutorialTextSize * 2);
    }
    if (waveNum === 4){
      text("Purchasing the max health upgrade also fully heals you", textPos.x, textPos.y);
      text("Use this to your advantage", textPos.x, textPos.y + tutorialTextSize * 2);
    }

    if (waveNum === 5){
      text("Some enemies can shoot bullets of their own", textPos.x, textPos.y);
      text("Make sure to avoid their shots", textPos.x, textPos.y + tutorialTextSize * 2);
    }
    if (waveNum === 6){
      text("Pressing E switches your weapons around, between bullets and bombs", textPos.x, textPos.y);
      text("Careful when using the bombs", textPos.x, textPos.y + tutorialTextSize * 2);
      text("They can damage yourself if you're not careful", textPos.x, textPos.y + tutorialTextSize * 4);
    }
    if (waveNum === 8){
      text("If you haven't already, get some damage or fire rate upgrades", textPos.x, textPos.y);
      text("You'll need it to outdamage their healing", textPos.x, textPos.y + tutorialTextSize * 2);
    }

    if (waveNum === 10){
      text("Their speed is superior", textPos.x, textPos.y);
      text("Keep your distance and shut them down as soon as possible", textPos.x, textPos.y + tutorialTextSize * 2);
    }
    if (waveNum === 12){
      text("Stay on the move", textPos.x, textPos.y);
      text("They'll be constantly shooting at you", textPos.x, textPos.y + tutorialTextSize * 2);
    }
    if (waveNum === 14){
      text("You're in the final stretch now", textPos.x, textPos.y);
      text("You got this", textPos.x, textPos.y + tutorialTextSize * 2);
      text("Their size is intimidating, but it only means a bigger target to shoot", textPos.x, textPos.y + tutorialTextSize * 4);
    }

    if (waveNum === 15){
      text("That was the final wave so far", textPos.x, textPos.y);
      text("Good Job!", textPos.x, textPos.y + tutorialTextSize * 2);
      text("Refresh if you wanna try again", textPos.x, textPos.y + tutorialTextSize * 4);
    }
  }
}