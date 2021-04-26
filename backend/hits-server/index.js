var fs = require("fs");
var http = require('http');

function reset(){
  fs.writeFile('hits.txt', "0", function (err) {
    console.log('reset');
  });
}

//reset();

http.createServer(function(req, res){
  if(req.method == "POST"){
    res.writeHead(200, {"Access-Control-Allow-Origin": "*","Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT","Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"});
    fs.readFile("hits.txt", function(err, data){
      data = parseInt(data) || 0;
      data += 1;
      fs.writeFile('hits.txt', data.toString(), function (err) {
        console.log('new hit');
      });
    });
    res.end("hit recorded");
  }
  if(req.method == "GET"){
    res.writeHead(200, {"Access-Control-Allow-Origin": "*","Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT","Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"});
    fs.readFile("hits.txt", function(err, data){
      data = data || "0";
      console.log("hits: "+data);
      res.end("hits: "+data);
    });
  }
  if (req.method === "OPTIONS") {
    res.writeHead(200, {"Access-Control-Allow-Origin": "*","Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT","Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"});
    res.end("ok");
  }
}).listen(8080);