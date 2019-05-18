main = new Engine.ScreenMain(canvasMain);
debug = new Engine.ScreenDebug(canvasDebug);

player = new Engine.Player(10, 10, 'images/woz.jpg');
player.numRays = main.canvas.width;
player.numRays = 1920;

// player.buffer = 5;

game = new Engine.Game(60, main, debug);
Engine.init(game);
game.update = function(){
  game.debugCanvas.clear();
  game.mainCanvas.clear();

  game.mainCanvas.skybox();
  game.mainCanvas.floorbox();

    game.handlePlayerRays(player);

  let speed = 3;
  if(game.keys.SHIFT) speed = 5;
  if(game.keys.W) player.forward(speed);
  if(game.keys.A) player.left(speed);
  if(game.keys.S) player.backward(speed);
  if(game.keys.D) player.right(speed);
  if(game.keys.Q) player.rotate(-2);
  if(game.keys.E) player.rotate(2);
  if(game.keys.F) // game.lock(); // F

  if(Math.abs(joystick.deltaX()) > Math.abs(joystick.deltaY())){
    if(Math.sign(joystick.deltaX()) < 0) player.left(2);
    else if(Math.sign(joystick.deltaX()) > 0) player.right(2);
  }
  else{
    if(Math.sign(joystick.deltaY()) < 0) player.forward(2);
    else if(Math.sign(joystick.deltaY()) > 0) player.backward(2);
  }





  game.mainCanvas.fps();
  if(debuging) game.debugCanvas.fps();
}
game.setPlayer(player);

const sprite = new SpriteSheet('images/spriteCorrect.png', 42, 35, 10, 10);
const boom = new SpriteSheet('images/boom.jpg', 256, 249, 15, 15);
const orb = new SpriteSheet('images/orb.png', 16, 16, 34, 34);
const link = new SpriteSheet('images/linksheet.png', 32, 32, 8, 8);
const roll = new SpriteSheet('images/rolling.png', 400, 400, 91, 30);
const rub = new SpriteSheet('images/rub.png', 100, 100, 31, 31);

game.addWalls([
  // new Wall(700, 100, 700, 500),
  new Wall(500, 20, 700, 100, 'rgba(0, 0, 255, .5)', false, false),
  new Wall(550, 20, 700, 50),
  new Wall(350, 550, 700, 500, 'rgba(155, 0, 0, .5)', false),
  new Wall(400, 575, 700, 550, 'rgb(0, 255, 0)'),
  new Wall(100, 500, 300, 550),
  new Wall(5, 5, 255, 5, '', true, true, 'images/woz.jpg'),
  new Wall(5, 6, 255, 6, '', false, true, 'images/vines.png'),
  new Wall(700, 100, 700, 500, '', false, false, 'images/doorway.png'),
  new Wall(699, 101, 699, 501, '', false, false, rub),


  new Wall(0, 0, 800, 0, 'rgba(0, 0, 0, .5)'),
  new Wall(800, 0, 800, 600, 'rgba(0, 0, 0, .5)'),
  new Wall(800, 600, 0, 600, 'rgba(0, 0, 0, .5)'),
  new Wall(0, 600, 0, 0, 'rgba(0, 0, 0, .5)'),
]);
game.addEntities([
  // new Entity(5, 5, 'images/woz.jpg'),
]);

game.start();
