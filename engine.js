const canvasDebug = document.querySelector('#canvasDebug');
const canvasMain = document.querySelector('#canvasMain');

let debuging = false;
let game;

const joystick	= new VirtualJoystick({container	: document.querySelector('body')});

class Game{
  constructor(fps, mainCanvas, debugCanvas){
    this.fps = fps;
    this.mainCanvas = mainCanvas;
    this.debugCanvas = debugCanvas;
    this.time = 0;
    this.keys = {};
    this.keyCodes = {'W': 87, "A": 65, "S": 83, "D": 68, "Q": 81, "E": 69, "F": 70, "SHIFT": 16, "CONTROL": 17, "SPACE": 32}
    this.codeKeys = {};
    Object.keys(this.keyCodes).forEach(key => {
      this.codeKeys[this.keyCodes[key]] = key;
    });
    this.walls = [];
    this.entities = [];
    this.locked = false;
    this.update

    // document.querySelector('body').innerHTML += '<div id="raycastingImageWrapper" class="hidden"></div>';
  }
  start(){
    const self = this;
    this.interval = setInterval(this.update, 1000/this.fps);
  }
  setPlayer(player){
    this.player = player;
  }
  addKey(key){
    if(this.keysDown.indexOf(key) == -1) this.keysDown.push(key);
  }
  removeKey(key){
    this.keysDown.pop(key);
  }
  addWalls(walls){
    this.walls = this.walls.concat(walls);
  }
  addEntities(entities){
    this.entities = this.entities.concat(entities);
  }
  lock(){
    if(!game.locked) this.mainCanvas.canvas.requestPointerLock();
    else document.exitPointerLock();
  }
  handlePlayerRays(player){
    player.update();
    let toDraw = [];
    player.rays.forEach((ray, index) => {
      game.walls.forEach(wall => {
        const intersect = ray.intersectsWall(wall)
        if(intersect){
          ray.color = 'rgb(0, 0, 255)';
          if(wall.transparent){
            ray.end = {x: intersect.x, y: intersect.y}
            if(debuging) ray.color = 'rgb(255, 0, 0)';
          }
          toDraw.push({
            distance: calcDistance(intersect.x, intersect.y, player.x, player.y, ray.angleFromCenter),
            wall: wall,
            ray: ray,
            index: index,
            intersect: intersect,
          });
        }
      });
      if(debuging) game.debugCanvas.drawLine(ray.start.x, ray.start.y, ray.end.x, ray.end.y, ray.color);
      game.entities.forEach(entity => {
        let intersect = ray.intersectsWall(entity.line);
        if(intersect){
          toDraw.push({
            distance: calcDistance(intersect.x, intersect.y, player.x, player.y, ray.angleFromCenter),
            entity: entity,
            ray: ray,
            index: index,
            intersect: intersect,
          })
        }
      });
    });
    toDraw.sort(function(a, b){
      if(a.distance < b.distance) return 1;
      if(a.distance > b.distance) return -1;
      return 0;
    });
    toDraw.forEach(obj => {
      let x = obj.index * game.mainCanvas.canvas.width / game.player.numRays;
      let height = game.mainCanvas.canvas.height - obj.distance;
      let width = game.mainCanvas.canvas.width / game.player.numRays;
      if(typeof obj.wall != 'undefined'){
        //  drawRay(x, height, color, width){
        let img = obj.wall.image;
        if(obj.wall.image){
          const percent = obj.wall.getPercent(obj.intersect)
          game.mainCanvas.drawImageRay(x, height, img, percent.x, percent.y, width);
        }
        else game.mainCanvas.drawRay(x, height, obj.wall.color, width);
      }
      else if(typeof obj.entity != 'undefined'){
        //   drawImageRay(x, height, img, column, width){
        let entity = obj.entity;
        // game.mainCanvas.drawImageRay(x, height, entity.image.image, entity.getColumn(obj.index), width)
        game.mainCanvas.drawImageRay(x, height, entity.image.image, entity.getPercent(obj.intersect), width)
      }
    });
    if(debuging){
      game.debugCanvas.drawPoint(game.player.x, game.player.y);
      game.debugCanvas.canvas.classList.remove('hidden');
    }
    else game.debugCanvas.canvas.classList.add('hidden');
    if(debuging)
    game.entities.forEach(entity => {
      game.debugCanvas.drawLine(entity.line.start.x, entity.line.start.y, entity.line.end.x, entity.line.end.y);
    });
    game.walls.forEach(wall => {
      if(debuging) game.debugCanvas.drawLine(wall.start.x, wall.start.y, wall.end.x, wall.end.y);
      if(wall.solid){
        if(wall.containsPoint(player)) player.revertPrev();
      }
    });
    game.time++;
  }
}

class Screen{
  constructor(canvas){
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
  }
  clear(){
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  fps(){
    this.ctx.fillStyle = 'rgb(22, 224, 153)';
    this.ctx.font = '15px Lucida Console';
    this.ctx.fillText(fps, this.canvas.width -20, this.canvas.height - 20);
  }
}

class ScreenDebug extends Screen{
  constructor(canvas){
    super(canvas);
  }
  drawLine(x, y, a, b, color){
    this.ctx.strokeStyle = typeof color == 'undefined'? 'rgb(0, 0, 0)': color;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(a, b);
    this.ctx.stroke();
  }
  drawPoint(x, y, r, color){
    r = typeof r == 'undefined'? 5: r;
    this.ctx.strokeStyle = typeof color == 'undefined'? 'rgb(0, 0, 0)': color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI*2)
    this.ctx.stroke();
  }
}

class ScreenMain extends Screen{
  constructor(canvas){
    super(canvas);
    this.skyboxColor = 'rgb(174, 195, 229)';
    this.floorboxColor = 'rgb(118, 121, 124)';
  }
  skybox(){
    this.ctx.fillStyle = this.skyboxColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height/2);
  }
  floorbox(){
    this.ctx.fillStyle = this.floorboxColor;
    this.ctx.fillRect(0, this.canvas.height/2, this.canvas.width, this.canvas.height/2);
  }
  drawRay(x, height, color, width){
    width = typeof width == 'undefined'? 1: width;
    this.ctx.fillStyle = typeof color == 'undefined'? 'rgb(0, 0, 0)': color;
    this.ctx.fillRect(x, this.canvas.height/2 - height/2, width, height);
  }
  drawImageRay(x, height, img, column, yMask, width){
    // console.log(arguments);
    // console.log(x, height, img, column, width);
    width = typeof width == 'undefined'? 1: width;
    this.ctx.drawImage(img.image, column, yMask, 1, img.getHeight(), x, this.canvas.height/2 - height/2, width, height);
  }
}

class Image{
  constructor(src){
    this.src = src
    this.wrapper = document.querySelector('#raycastingImageWrapper');
    if(src.indexOf('.mp4') == -1) this.wrapper.innerHTML += `<img src="${src}" id="${src}" />`;
    else this.wrapper.innerHTML += `
    <video id="${src}" autoplay="autoplay" loop="true" muted>
      <source src="${src}" type="video/mp4">
    </video>`;
    this.image = document.getElementById(src);
    if(src.indexOf('.mp4') == -1) {
      this.width = this.image.width;
      this.height = this.image.height;
    }
    else{
      this.width = this.image.videoWidth;
      this.height = this.image.videoHeight;
    }
  }
  getWidth(){
    if(this.src.indexOf('.mp4') == -1) {
      return this.image.width;
    }
    else{
      return this.image.videoWidth;
    }
  }
  getHeight(){
    if(this.src.indexOf('.mp4') == -1) {
      return this.image.height;
    }
    else{
      return this.image.videoHeight;
    }
  }
  getPercent(intersect, wall){
    let d = calcDistance(wall.start.x, wall.start.y, intersect.x, intersect.y);
    return {x: scale(d, 0, wall.length, 0, this.getWidth()), y: 0};
  }
}

class SpriteSheet extends Image{
  constructor(image, width, height, amnt, fps){
    super(image);
    this.frame = 0;
    this.rows = Math.round(this.image.height / height);
    this.columns = Math.round(this.image.width / width);
    this.cellWidth = width;
    this.cellHeight = height;
    this.fps = fps;
    this.frames = amnt;
  }
  getPercent(intersect, wall){
    let p = super.getPercent(intersect, wall);
    return {x: p.x + this.cellWidth * this.getColumn(), y: p.y * this.cellHeight * this.getRow()};
  }
  getColumn(){
    return Math.ceil(this.getFrame() / this.rows);
  }
  getRow(){
    return Math.ceil(this.getFrame() / this.columns);
  }
  getFrame(){
     let elapsed = game.time / game.fps;
     return Math.ceil(elapsed * this.fps) % this.frames;
  }
  getWidth(){
    return this.cellWidth;
  }
  getHeight(){
    return this.cellHeight;
  }
}

class Entity{
  constructor(x, y, image, buffer){
    this.x = x;
    this.y = y;
    this.image = new Image(image);
    this.buffer = typeof buffer == 'undefined'? 1: buffer;
    this.angle = 0
    this.prevX = x;
    this.prevY = y;
    this.line = new Ray(x, y, this.angle, 0, this.image.image.width);
  }
  moveX(amnt){
    this.x += amnt;
  }
  moveY(amnt){
    this.y += amnt;
  }
  dirFromAngle(angle, amnt){
    return [amnt*Math.cos(angle*(Math.PI/180)), amnt*Math.sin(angle*(Math.PI/180))];
  }
  moveToAngle(angle, amnt){
    let dir = this.dirFromAngle(angle, amnt);
    this.updatePrev(this.x, this.y);
    this.x += dir[0];
    this.y += dir[1];
  }
  forward(amnt){
    this.moveToAngle(this.angle + this.fov/2, amnt);
  }
  backward(amnt){
    this.moveToAngle(this.angle + this.fov/2 + 180, amnt);
  }
  left(amnt){
    this.moveToAngle(this.angle + this.fov/2 - 90, amnt);
  }
  right(amnt){
    this.moveToAngle(this.angle + this.fov/2 + 90, amnt);
  }
  rotate(ang){
    this.angle += ang;
  }
  updatePrev(x, y){
    this.prevX = x;
    this.prevY = y;
  }
  revertPrev(){
    this.x = this.prevX;
    this.y = this.prevY;
  }
  getColumn(index){
    // console.log(this.image.width);
    return scale(index, 0, game.player.numRays, 0, this.image.width);
  }
  getPercent(intersect){
    return this.image.getPercent(intersect, this.line);
  }
}

class Player extends Entity{
  constructor(x, y, image, buffer){
    super(x, y, image, buffer);
    this.fov = 110;
    this.numRays = 800;
    this.rays = [];
  }
  update(){
    this.rays = [];
    this.angle %= 360;
    const inc = this.fov/this.numRays;
    for(let i = 0; i < this.numRays; i++){
      const indexFromCenter = Math.abs(this.numRays/2 - i)
      const angleFromCenter = this.fov / (this.numRays / indexFromCenter);
      this.rays.push(new Ray(this.x, this.y, this.angle + i*inc, angleFromCenter));
    }
    // let distToProj = (this.numRays/2) / Math.tan((this.fov/2) * (Math.PI / 180));
    // for(let i = 0; i < this.numRays; i++){
    //   let ang = Math.atan((i-(this.numRays/2)) / distToProj);
    //   ang += this.angle * (Math.PI / 180);
    //   ang *= (180 / Math.PI);
    //   const indexFromCenter = Math.abs(this.numRays/2 - i)
    //   const angleFromCenter = this.fov / (this.numRays / indexFromCenter);
    //   this.rays.push(new Ray(this.x, this.y, ang, angleFromCenter));
    // }
  }
}

class Ray{
  constructor(x, y, angle, angleFromCenter, length, color){
    this.angle = typeof angle == 'undefined'? 0: angle;
    this.length = typeof length == 'undefined'? 1050: length;
    this.color = typeof color == 'undefined'? 'rgb(0, 255, 0)': color;
    this.angleFromCenter = angleFromCenter;
    this.start = {x: x, y: y};
    this.end = {x: x + this.length*Math.cos(this.angle*(Math.PI/180)), y: y + this.length*Math.sin(this.angle*(Math.PI/180))};
  }
  intersectsWall(wall){
    const s1_x = wall.end.x - wall.start.x;
    const s1_y = wall.end.y - wall.start.y;
    const s2_x = this.end.x - this.start.x;
    const s2_y = this.end.y - this.start.y;

    const s =(-s1_y * (wall.start.x - this.start.x) + s1_x * (wall.start.y - this.start.y)) / (-s2_x * s1_y + s1_x * s2_y);
    const t = ( s2_x * (wall.start.y - this.start.y) - s2_y * (wall.start.x - this.start.x)) / (-s2_x * s1_y + s1_x * s2_y);

    if(s >= 0 && s <= 1 && t >= 0 && t <= 1){
      return {x: wall.start.x + (t*s1_x), y : wall.start.y + (t*s1_y)};
    }
    return undefined;
  }
}

class Wall{
  constructor(x, y, a, b, color, transparent, solid, image){
    this.color = typeof color == 'undefined'? 'rgb(0, 0, 0)': color;
    this.transparent = typeof transparent == 'undefined'? true: transparent;
    this.solid = typeof solid == 'undefined'? true: solid;
    this.start = {x: x, y: y};
    this.end = {x: a, y: b};
    this.length = calcDistance(this.start.x, this.start.y, this.end.x, this.end.y);
    if(image instanceof Image) this.image = image;
    else if(typeof image == 'undefined') this.image = false;
    else this.image = new Image(image);
  }
  containsPoint(a){
    const dl = calcDistance(a.x, a.y, this.start.x, this.start.y);
    const dr = calcDistance(a.x, a.y, this.end.x, this.end.y);

    const buffer = typeof a.buffer == 'undefined'? 1: a.buffer;

    return dl + dr >= this.length-buffer && dl + dr <= this.length + buffer;
  }
  getPercent(intersect){
    return this.image.getPercent(intersect, this);
  }
}

function calcDistance(x, y, a, b, angle){
  const distance = Math.sqrt((a-x)**2 + (b-y)**2);
  if(typeof angle != 'undefined'){
    return distance * Math.cos(angle * (Math.PI / 180));
  }
  return distance
}

function scale(num, inMin, inMax, outMin, outMax){
  return (num - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

const times = [];
let fps;

function refreshLoop() {
  window.requestAnimationFrame(() => {
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift();
    }
    times.push(now);
    fps = times.length;
    refreshLoop();
  });
}

refreshLoop();

function init(game){
  game = game;
  document.addEventListener('keydown', e => {
    // console.log(e.keyCode);
    game.keys[e.keyCode] = true;
    game.keys[game.codeKeys[e.keyCode]] = true
    if(e.keyCode == 70) game.lock();
  });
  document.addEventListener('keyup', e => {
    // console.log(e.keyCode);
    game.keys[e.keyCode] = false;
    game.keys[game.codeKeys[e.keyCode]] = false
  });

  document.addEventListener('pointerlockchange', e => {
    game.locked = !game.locked;
  });

  document.addEventListener('mousemove', e => {
    if(VirtualJoystick.touchScreenAvailable()){
      if(e.movementX > 0) player.rotate(e.movementX/5);
      if(e.movementX < 0) player.rotate(e.movementX/5);
    }
  });
}

Engine = {
  ScreenMain: ScreenMain,
  ScreenDebug: ScreenDebug,
  Player: Player,
  Game: Game,
  init: init,
}
