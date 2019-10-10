const StaticServer = require('static-server');

const server = new StaticServer({
  rootPath: `${__dirname}/fixtures`,
  port: 8081,
});

server.start(() => {
  console.log('Server listening to', server.port);
});

