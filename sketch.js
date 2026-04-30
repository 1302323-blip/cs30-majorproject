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

class Player {
  constructor(){
    this.pos = createVector(width/2, height / 2);
    this.dir = createVector(0, 0);
    this.angle;
    this.speed = 7;
    this.size = 30;

    this.health = 10;
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

  // takeDamage()
}

class Bullet {
  constructor(_x, _y, _angle){
    this.pos = createVector(_x, _y);
    this.angle = _angle;
    this.speed = 1;
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

  hasHitZombie(zombie){
    if (dist(this.pos.x, this.pos.y, zombie.pos.x, zombie.pos.y) < zombie.radius){
      return true;
    }
    return false;
  }
}
// function hasShotZombie(zombieHit){
// for (let i = 0; i < playerBullets.length; i++){
//   if (dist(playerBullets[i].x, playerBullets[i].y, zombieHit.x, zombieHit.y) < zombieHit.size * 0.8){
//     playerBullets.splice(i, 1);
//     return true;
//   }
// }
// return false;

class Enemy {
  constructor(_enemyType, _radius, _spd, _health, _damage, _bounty, _fillColour, _strokeColour){
    this.pos = createVector();
    this.angle;
    this.radius = _radius;

    this.type = _enemyType;
    this.speed = _spd;
    this.health = _health;

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
    // experimental, idk if tracking player position will work
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

  // takeDamage(){
  //   // for (let bullet of playerBulletsArray){
  //   for (let bi = playerBulletsArray.length - 1; bi >= 0; bi--){
  //     if (dist(playerBulletsArray[bi].pos.x, playerBulletsArray[bi].pos.y, this.pos.x, this.pos.y) < this.radius * 2){
  //       playerBulletsArray.splice(bi, 1);
  //       this.health -= playerBulletsArray[bi].damage;
  //     }
  //   }
  // }

  killZombie(){
    if (this.health <= 0){
      console.log("kill");
      // zombiesArray.splice(this, 1);
      return true;
    }
    else{
      return false;
    }
  }

  

}


//     if (hasShotZombie(zombies[i])){
//       zombies[i].health -= 1;
//       if (zombies[i].health <= 0){
//         score += zombies[i].givenScore;
//         zombies.splice(i, 1);
//       }
//     }

class Normal extends Enemy {
  constructor(){
    super("normal", 15, 3, 3, 1, 15, color(100, 250, 100), "black");
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
  manageZombieFunctions();
  managePlayerFunctions();

  zombieWaveSpawner();
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
  for (let i = zombiesArray.length - 1; i >= 0; i--){
    zombiesArray[i].display();
    zombiesArray[i].movement();
    zombiesArray[i].takeDamage();
    zombiesArray[i].killZombie();

    if (zombiesArray[i].killZombie()){
      zombiesArray.splice(i, 1);
    }
  }
}



function zombieWaveSpawner(){
  if (frameCount % 90 === 0){
    zombiesArray.push(new Normal());
  }
}