const Database = require("@replit/database")
const db = new Database()
var http = require('http');

function reset(){
  db.set("hits",0).then(()=>{console.log("reset")});
}

//reset();

http.createServer(function(req, res){
  if(req.method == "POST"){
    res.writeHead(200, {"Access-Control-Allow-Origin": "*","Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT","Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"});
    db.get("hits").then(hits => {
      hits = hits || 0;
      db.set("hits",hits+1).then(()=>{console.log("new hit")});
    });
    res.end("hit recorded");
  }
  if(req.method == "GET"){
    res.writeHead(200, {"Access-Control-Allow-Origin": "*","Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT","Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"});
    db.get("hits").then(hits => {
      hits = hits || 0;
      console.log("hits: "+hits.toString());
      res.end("hits: "+hits.toString());
    });
  }
  if (req.method === "OPTIONS") {
    res.writeHead(200, {"Access-Control-Allow-Origin": "*","Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT","Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"});
    res.end("ok");
  }
}).listen(8080);