var fs = require("fs");
var http = require('http');
var parseString = require('xml2js').parseString;

function markitdown(initials,email,park){
  fs.readFile("database.json", function(err, data2){
    var data = JSON.parse(data2.toString());
    if(data.users.places[email]){
      data.users.places[email].push(park);
    }else{
      data.users.places[email] = [];
      data.users.places[email].push(park);
      data.users.initials[email] = initials;
    }
    console.log(data);
    fs.writeFile('database.json', JSON.stringify(data), function (err) {
      console.log('saved');
    });
  });
}

http.createServer(function(req, res){
  if(req.method == "POST"){
    res.writeHead(200, {"Access-Control-Allow-Origin": "*","Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT","Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"});
    let body = "";
    req.on("data", function(chunk){
        body += chunk.toString();
    });
    req.on("end", function(){
      var user;
      parseString(body, function (err, result) {
        user = result;
      });
      markitdown(user.user.initials[0],user.user.email[0],user.user.park[0]);
      res.end("ok");
    });
  }
  if(req.method == "GET"){
    res.writeHead(200, {"Access-Control-Allow-Origin": "*","Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT","Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"});
    res.end("ok");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(200, {"Access-Control-Allow-Origin": "*","Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT","Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"});
    res.end("ok");
  }
}).listen(8080);