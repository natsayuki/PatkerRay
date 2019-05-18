const canvasDebug = document.querySelector('#canvasDebug');
const canvasMain = document.querySelector('#canvasMain');

let debuging = false;

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
          if(wall.solid){
            ray.end = {x: intersect.x, y: intersect.y}
            if(debuging) ray.color = 'rgb(255, 0, 0)';
          }
          toDraw.push({
            distance: calcDistance(intersect.x, intersect.y, player.x, player.y, ray.angleFromCenter),
            wall: wall,
            ray: ray,
            index: index,
          });
        }
      });
      if(debuging) game.debugCanvas.drawLine(ray.start.x, ray.start.y, ray.end.x, ray.end.y, ray.color);
    });
    toDraw.sort(function(a, b){
      if(a.distance < b.distance) return 1;
      if(a.distance > b.distance) return -1;
      return 0;
    });
    toDraw.forEach(obj => {
      game.mainCanvas.drawRay(obj.index * game.mainCanvas.canvas.width / game.player.numRays, game.mainCanvas.canvas.height - obj.distance, obj.wall.color, game.mainCanvas.canvas.width / game.player.numRays);
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
    if(debuging)
    game.walls.forEach(wall => {
      game.debugCanvas.drawLine(wall.start.x, wall.start.y, wall.end.x, wall.end.y);
    });
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
  drawDataRay(x, height, data, width){
    width = typeof width == 'undefined'? 1: width;
    height = height / data.length;
    let y = this.canvas.height/2 - height/2;
    data.forEach((rgb, i) => {
      this.ctx.fillStyle = rgb;
      this.ctx.fillRect(x, y + height*2, width, height);
    });
  }
}

class Image{
  constructor(src){
    this.wrapper = document.querySelector('#raycastingImageWrapper');
    this.wrapper.innerHTML += `<img src="${src}" id="${src}" />`;
    this.image = document.getElementById(src);
    this.wrapper.innerHTML += `
    <canvas id="canvas${src}" width="${this.image.width}" height="${this.image.height}"></canvas>
    `;
    this.canvas = document.getElementById(`canvas${src}`);
    this.ctx = this.canvas.getContext('2d');
    self = this;
    this.image.onload = function(){
      self.ctx.drawImage(self.image, 0, 0);
    }
  }
  init(){
    this.ctx.drawImage(this.image, 0, 0);
  }
}

class Entity{
  constructor(x, y, image){
    this.x = x;
    this.y = y;
    this.image = new Image(image);
    this.angle = 0
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
}

class Player extends Entity{
  constructor(x, y, image){
    super(x, y, image);
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
  constructor(x, y, a, b, color, solid){
    this.color = typeof color == 'undefined'? 'rgb(0, 0, 0)': color;
    this.solid = typeof solid == 'undefined'? true: solid;
    this.start = {x: x, y: y};
    this.end = {x: a, y: b};
  }
}

function calcDistance(x, y, a, b, angle){
  const distance = Math.sqrt((a-x)**2 + (b-y)**2);
  return distance * Math.cos(angle * (Math.PI / 180));
  // return distance
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
