main = new Engine.ScreenMain(canvasMain);
debug = new Engine.ScreenDebug(canvasDebug);

player = new Engine.Player(0, 0, 'images/woz.jpg');
player.numRays = main.canvas.width;

game = new Engine.Game(60, main, debug);
game.update = function(){
  game.debugCanvas.clear();
  game.mainCanvas.clear();

  game.mainCanvas.skybox();
  game.mainCanvas.floorbox();

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


  game.handlePlayerRays(player);


  game.mainCanvas.fps();
  if(debuging) game.debugCanvas.fps();
}
game.setPlayer(player);
game.addWalls([
  new Wall(700, 100, 700, 500),
  new Wall(500, 20, 700, 100, 'rgba(0, 0, 255, .5)', false),
  new Wall(550, 20, 700, 50),
  new Wall(350, 550, 700, 500, 'rgba(155, 0, 0, .5)', false),
  new Wall(400, 575, 700, 550, 'rgb(0, 255, 0)'),
  new Wall(100, 500, 300, 550)
]);
game.addEntities([
  new Entity(0, 0, 'images/woz.jpg'),
]);
Engine.init(game);
game.start();
