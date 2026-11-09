const app = new Application();
const texture = await Assets.load('https://pixijs.com/assets/bunny.png');
const bunny = new Sprite(texture);
await app.init({ background: '#1099bb', resizeTo: window });
document.body.appendChild(app.canvas);

app.stage.addChild(bunny);
bunny.anchor.set(0.5);

bunny.x = app.screen.width / 2;
bunny.y = app.screen.height / 2;

