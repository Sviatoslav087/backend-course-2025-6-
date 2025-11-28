const { program } = require('commander');
const fs = require('fs');
const http = require('http');

program
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <path>', 'cache directory');

program.parse();

const options = program.opts();

if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache);
}

const server = http.createServer((req, res) => {
  res.end("Server is working");
});

server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
});
