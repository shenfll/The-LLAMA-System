var isclicked = false;
// A geographic point of interest
class Point {
  // latLon: a string of the form '42.887775, -73.810880'
  // name: a short unique name
  // desc: a longer descriptive name for the point
  constructor(latLon, name, desc, waypoint) {

    let x = latLon.split(/\,\s?/);
    if (!x || x.length != 2) {
      throw new Error('Invalid lat/lon: ' + latLon);
    }
    this.lat = x[0];
    this.lon = x[1];
    this.name = name;
    this.desc = desc;
    this.waypoint = waypoint;
  }

  // returns a structure suitable for putting into plot.ly
  mapPoint() {
    return {
      type: "point",
      lat: [this.lat],
      lon: [this.lon],
      name: this.desc,
      waypoint: this.waypoint,
    };
  }

  // Returns the distance, in meters, to point b using the
  // haversine formulat for great circle distance
  metersTo(b) {
    // convert degrees to radians
    const toRad = (x) => { return x * Math.PI / 180.0; };
    var d = {
      lat: toRad(b.lat - this.lat),
      lon: toRad(b.lon - this.lon)
    };
    var f = Math.pow(Math.sin(d.lat / 2.0), 2) +
      Math.cos(toRad(this.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.pow(Math.sin(d.lon / 2.0), 2);

    var c = 2 * Math.atan2(Math.sqrt(f), Math.sqrt(1 - f));

    // approximate radius, in meters
    const earthRadius = 6378137;
    return earthRadius * c;
  }
}
class Edge {
  constructor(a, b, cost, color) {
    this.a = a;
    this.b = b;
    this.cost = cost;
    this.color = color;
    //console.log(this.custom);
    //console.log(this.mapPointNo());
  }
  static makeName(a, b) {
    a = ("string" == typeof (a)) ? a : a.name;
    b = ("string" == typeof (b)) ? b : b.name;
    return (a < b) ? `${a}/${b}` : `${b}/${a}`;
  }
  name() {
    return Edge.makeName(this.a, this.b);
  }
  meters() {
    return this.a.metersTo(this.b);
  }
  mapPoint() {
    var tea = false;
    if(this.cost != 0){
      tea = true;
    }
    return {
      type: "line",
      lon: [this.a.lon, this.b.lon],
      lat: [this.a.lat, this.b.lat],
      fromtea: tea,
      color: this.color,
    };
  }
  mapPointNo() {
    if (this.cost != 0) {
      return;
    }
    return {
      type: "line",
      lon: [this.a.lon, this.b.lon],
      lat: [this.a.lat, this.b.lat],
      fromtea: false,
      color: this.color,
    };
  }
}

class Graph {
  constructor() {
    this.points = {};
    this.edges = {};
  }
  allPoints() {
    return Object.values(this.points);
  }
  allEdges() {
    return Object.values(this.edges);
  }
  add(a, ...pointArgs) {
    if ('string' == typeof (a)) { a = new Point(a, ...pointArgs); }
    if (this.points[a.name]) { return; }
    this.points[a.name] = a;
    if (!mydata.points[a.name]) {
      mydata.points[a.name] = {
        name: a.desc,
        coords: a.lat + ", " + a.lon,
        intersection: false,
      }
    }
  }

  addPath(path, name, color) {
    for (let i = 0; i < path.length; ++i) {
      let pointName = `${name}_${i}`;
      this.add(path[i], pointName, name);
      if (i > 0) {
        this.connect(`${name}_${i - 1}`, pointName, 0, color);
      }
    }
  }

  createMesh() {
    // Create a new Graph 
    let mesh = new Graph;
    // add all existing edges 
    this.allEdges().map((e) => { mesh.connect(e.a, e.b, e.cost, e.color); });

    // Find new connections and compute their cost
    for (let a of this.allPoints()) {
      for (let b of this.allPoints()) {
        // no need to connect a to itself
        if (a === b) { continue; }
        // no need to connect if there is already an edge
        if (mesh.getEdge(a, b)) { continue; }

        console.log(`adding cost from ${a.name} to ${b.name}`)
        mesh.connect(a, b, a.metersTo(b));
      }
    }
    return mesh;
  }

  remove(a) {
    if ('string' == typeof (a)) {
      a = this.points[a];
      if (!a) { return; }
    }

    delete this.points[a.name];
    Object.values(this.edges).map((e) => {
      if ((e.a === a) || (e.b === a)) {
        delete this.edges[e.name()];
      }
    });
  }
  connect(a, b, cost = 0, color) {
    if ('string' == typeof (a)) {
      let pointA = this.points[a];
      if (!pointA) {
        throw new Error(`${a} is not a defined Point`);
      }
      a = pointA;
    }
    if ('string' == typeof (b)) {
      let pointB = this.points[b];
      if (!pointB) {
        throw new Error(`${b} is not a defined Point`);
      }
      b = pointB;
    }

    this.add(a);
    this.add(b);
    let edge;
    if ((edge = this.getEdge(a, b))) {
      edge.cost = cost;
      return;
    }
    edge = new Edge(a, b, cost, color);
    this.edges[edge.name()] = edge;
  }
  getEdge(a, b) {
    return this.edges[Edge.makeName(a, b)];
  }
  mapData() {
    let data = [];
    Object.values(this.edges).map((e) => {
      data.push(e.mapPoint());
    });
    Object.values(this.points).map((p) => {
      data.push(p.mapPoint());
    });

    return data;
  }
  mapDataNo() {
    let data = [];
    Object.values(this.edges).map((e) => {
      data.push(e.mapPointNo());
    });
    Object.values(this.points).map((p) => {
      data.push(p.mapPoint());
    });
    return data;
  }
}

let map = new Graph();

let intersectionMarker = true;

// To find latitude/longitude of a point, right-click "What's here" on Google Maps
// To find property ownership, see https://spatial.vhb.com/SaratogaMapViewer/ (click tools/parcel details/enable parcel details)
Object.entries(mydata.points).forEach(function (obj) {
  var point = obj[1];
  if (point.intersection) {
    map.add(point.coords, obj[0], point.name, intersectionMarker);
  } else {
    map.add(point.coords, obj[0], point.name);
  }
});

map.add('42.810647, -73.788074', 'boyack', 'Boyack Road Park');
map.add('42.862952, -73.820139', 'clifton_commons', 'Clifton Commons');
map.add('42.887775, -73.810880', 'kinns', 'Kinns Road Park');
map.add('42.880222, -73.810928', "kinns_canterbury", "Kinns Road Park at Canterbury");
map.add('42.895197, -73.787504', 'dwaas', 'Dwaas Kill');
map.add('42.894642, -73.794080', 'dwaas_trail_end', 'Dwaas Kill trail end');
map.add('42.868203, -73.871072', 'garnsey', "Garnsey Park");
map.add('42.899109, -73.818291', 'george_smith', "George T Smith Park")
map.add('42.917288, -73.821698', 'longkill', "Longkill Park");
map.add('42.917099, -73.818652', 'longkill_blue_spruce', "Longkill Park walking entrance");
map.add('42.918994, -73.820179', 'longkill_water_tower', "Longkill Park near water tower");
map.add('42.912530, -73.772139', 'ushers', "Usher's Road State Park Parking");
map.add('42.917542, -73.782060', 'ushers_zim', "Usher's Road State Park at Zim Smith Trail");
map.add('42.861632, -73.794722', 'shen_moe', "Shen at Moe Road", intersectionMarker);
map.add('42.868645, -73.808289', "shen_146", "Shen at Route 146", intersectionMarker);
map.add('42.861280, -73.811113', "skano", "Skano Elementary");
map.add('42.794335, -73.831102', "towpath_ferry", "Towpath at Ferry Road", intersectionMarker);
map.add('42.806818, -73.841494', "towpath_lock7", "Towpath at Lock 7", intersectionMarker);
map.add('42.802823, -73.842179', "towpath_powerlines", 'Towpath at power lines', intersectionMarker);
map.add('42.786197, -73.818623', "towpath_middle", "Towpath Middle", intersectionMarker);
map.add('42.792846, -73.796107', "towpath_van_vranken", "Towpath at Van Vranken Road", intersectionMarker);
map.add('42.861553, -73.794231', "new_park_west", "New Park West", intersectionMarker);
map.add('42.861458, -73.785935', "new_park_east", "New Park East", intersectionMarker);
map.add('42.834669, -73.793938', "balsam_moe", "Balsam Way moe entrance");
map.add('42.831302, -73.786138', "balsam_south", "Balsam Way South entrance");
map.add('42.826092, -73.781111', "hayes_liberty", "Hayes Nature Park at Liberty");
map.add('42.826060, -73.789512', "hayes_moe", "Hayes Nature Park at Moe");
map.add('42.922389, -73.810184', "northwoods_north", "North Woods Preserve at Shadow Wood Way");
map.add('42.918266, -73.818175', "northwoods_water_tower", "North Woods Preserve near water tower");
map.add('42.893169, -73.815529', "vanpatten_west", "Robert Van Patten Trail west end");
map.add('42.892763, -73.809982', "vanpatten_mid", "Robert Van Patten Trail at Carleton Rd");
map.add('42.895092, -73.798544', "vanpatten_mid2", "Robert Van Patten Trail at LaCosta Dr");
map.add('42.902282, -73.790786', "vanpatten_east", "Robert Van Patten Trail east end");
map.add('42.902923, -73.846200', 'veterans', "Veterans Memorial Park");
map.add('42.886517, -73.831001', 'woodcock', "Woodcock Preserve");
map.add('42.819471, -73.796058', 'west_sky', "West Sky Natural Area");
map.add('42.919411, -73.746441', 'zim_coons', "Zim Smith Trail at Coons Crossing");
map.add('42.917185, -73.780464', 'zim_english', 'Zim Smith Trail at English Road');
map.add('42.926756, -73.791336', 'zim_mill', "Zim Smith Trail at The Mill");
map.add('42.937063, -73.796844', 'zim_round_lake', 'Zim Smith Trail at Round Lake');
map.add('42.951131, -73.803946', 'zim_i87', 'Zim Smith Trail at I-87 Underpass');
map.add('42.858554, -73.820222', 'cp_center@VFerryRd', 'Clifton Park Center at Vischer Ferry Road', intersectionMarker);
map.add('42.878793, -73.820762', 'DawsLn@VFerryRd', 'Dawson Lane at Vischer Ferry Road', intersectionMarker);
map.add('42.905219, -73.778082', 'ushers_rt9', 'Ushers Road at Route 9', intersectionMarker);
map.add('42.910311, -73.818677', 'ushers_ridge', 'Ushers Road at Ridge Lane', intersectionMarker);
map.add('42.832847, -73.794143', 'moe_englemore', 'Moe Road at Vischer Ferry Fire District', intersectionMarker);
map.add('42.865644, -73.794052', 'moe_146', 'Moe Road at Route 146', intersectionMarker);
map.add('42.806330, -73.752250', 'towpath_beach', 'Towpath Road at Beach Road', intersectionMarker);
map.add('42.822922, -73.735610', 'oldCanal_ferry', 'Old Canal Road at Vischer Ferry Road', intersectionMarker);
map.add('42.863170, -73.769206', '146_9', 'Route 146 at Route 9', intersectionMarker);
map.add('42.870236, -73.820180', '146_146A', '146 at Cumberland Farms', intersectionMarker);
map.add('42.796804, -73.787810', 'towpath_riverview', 'Towpath at Riverview Road', intersectionMarker);
map.add('42.790951, -73.771779', 'towpath_end', 'Towpath End', intersectionMarker);

map.addPath([
  '42.885898, -73.842047',
  '42.880015, -73.840025',
  '42.869229, -73.844800',
  '42.862227, -73.840729',
  '42.858889, -73.844406',
  '42.858201, -73.853378',
  '42.850128, -73.851780',
  '42.840747, -73.854292',
  '42.840022, -73.860017',
  '42.837431, -73.860900',
  '42.837022, -73.865328',
  '42.834197, -73.865080',
  '42.808459, -73.833926',
  '42.802823, -73.842179',
], 'Niagara Mohawk power lines', "#ff4444");

mydata.connections.forEach(function(arr) {
  map.connect(arr[0],arr[1]);
});

// Create a new Graph with just the costs of interconnection
let costs = map.createMesh();

// Give impossible connections a high cost
costs.getEdge("ushers_zim", "vanpatten_east").cost = 100000;
costs.getEdge("zim_english", "vanpatten_east").cost = 100000;
// there are houses in the way of this short connection
costs.getEdge("longkill_blue_spruce", "northwoods_water_tower").cost = 100000;



let edges = Object.values(map.edges)

// Prim's algorithm:
// - add one point (doesn't matter which one) to the tree
// - find the least-cost point that isn't already in the tree and add it
// - repeat until all points are in the tree

// Start with an empty tree
let tree = new Graph();
let p = Object.values(map.points)[0];
tree.add(p);
map.remove(p);

while (Object.values(map.points).length) {
  let min;
  // Find the minimum cost edge from the tree to a disconnected node
  for (let a of Object.values(tree.points)) {
    for (let b of Object.values(map.points)) {
      let edge = costs.getEdge(a, b);
      if (!edge) {
        console.log(`no cost for ${a.name} to ${b.name}`)
        continue;
      }
      if (!min || edge.cost < min.cost) {
        min = edge;
      }
    }
  }
  if (!min) { throw new Error("No more edges can be connected"); }
  console.log(`connecting ${min.a.name} to ${min.b.name} for cost ${min.cost}`);
  tree.connect(min.a, min.b, min.cost, min.color);
  map.remove(min.a);
  map.remove(min.b);
}

edges.map((e) => { tree.connect(e.a, e.b, e.cost); });
//modaal
var modal = document.getElementById("myModal");

var modaltext = document.querySelector("#myModal > div:nth-child(1) > div:nth-child(2) > p:nth-child(2)");

var modaltitle = document.querySelector("#myModal > div:nth-child(1) > div:nth-child(2) > h1:nth-child(1)");

var modalimg = document.querySelector("#myModal > div:nth-child(1) > img:nth-child(3)");

var modaldir = document.querySelector("#myModal > div:nth-child(1) > div:nth-child(2) > a:nth-child(3)");

//aalert

var alerttext = document.querySelector("#myModal2 > div:nth-child(1) > div:nth-child(1) > h3:nth-child(1)");

var alertel = document.getElementById("myModal2");

//moodal

var modal2 = document.getElementById("myModal3");

var modaltext2 = document.querySelector("#myModal3 > div:nth-child(1) > div:nth-child(2) > p:nth-child(2)");

var modaltitle2 = document.querySelector("#myModal3 > div:nth-child(1) > div:nth-child(2) > h1:nth-child(1)");

//moodaal

var modal3 = document.getElementById("myModal4");

var modaltext3 = document.querySelector("#myModal4 > div:nth-child(1) > div:nth-child(2) > p:nth-child(2)");

var modaltitle3 = document.querySelector("#myModal4 > div:nth-child(1) > div:nth-child(2) > h1:nth-child(1)");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

var span2 = document.getElementsByClassName("close2")[0];

var span3 = document.getElementsByClassName("close3")[0];

var span4 = document.getElementsByClassName("close4")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = "none";
  isclicked = false;
}

span2.onclick = function () {
  alertel.style.display = "none";
  isclicked = false;
}

span3.onclick = function () {
  modal2.style.display = "none";
  isclicked = false;
}

span4.onclick = function () {
  modal3.style.display = "none";
  isclicked = false;
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
    isclicked = false;
  }
}

window.onclick = function (event) {
  if (event.target == modal2) {
    modal2.style.display = "none";
    isclicked = false;
  }
}

window.onclick = function (event) {
  if (event.target == modal3) {
    modal3.style.display = "none";
    isclicked = false;
  }
}

window.onclick = function (event) {
  if (event.target == alertel) {
    alertel.style.display = "none";
    isclicked = false;
  }
}

function findit(name) {
  var rtrn;
  Object.entries(mydata.points).forEach(function (the) {
    if (the[1].name == name) {
      rtrn = the[0];
    }
  });
  return rtrn;
}

if (window.location.search.indexOf("place") > -1) {
  comli = mydata.points[window.location.search.replace("?place=", "")];
  modaltitle.innerHTML = comli.popup.title;
  modaltext.innerHTML = comli.popup.text;
  modalimg.src = comli.popup.image;
  modaldir.href = "https://directions-api.jonahmorgan1.repl.co/?place=" + comli.coords + "";
  modal.style.display = "block";
  markitdownform(window.location.search.replace("?place=", ""));
}
if (window.location.search.indexOf("point") > -1) {
  comli = mydata.points[window.location.search.replace("?point=", "")];
  modaltitle.innerHTML = comli.popup.title;
  modaltext.innerHTML = comli.popup.text;
  modalimg.src = comli.popup.image;
  modaldir.href = "https://directions-api.jonahmorgan1.repl.co/?point=" + comli.coords + "";
  modal.style.display = "block";
}
function sendit(initials, email, park) {
  var url = "https://llamasystem.org:4040";
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url);
  xhr.setRequestHeader("Content-Type", "application/xml");
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      console.log(xhr.status);
      console.log(xhr.responseText);
    }
  };
  var data = "<user><initials>" + initials + "</initials><email>" + email + "</email><park>" + park + "</park></user>";
  xhr.send(data);
}
function markitdownform(place) {
  modaltitle3.innerHTML = "Would you like today's visit to count towards the LLAMA Challenge? If so, please put your email address below.";
  modaltext3.innerHTML = "<p>The LLAMA Challenge provides a fun way to motivate residents to visit at least 20 of the 24 locations listed on the challenge page.  Once completed, you receive a llama patch designed by us! Email addresses are used to verify that you have visited the park. (note: all email addresses are kept in a secure location called Replit.com) For more information on the LLAMA Challenge, click <a href='http://www.shenfll.com/challenge.html' target='_blank'>here.</a> Click the X on the top right of this to learn more about the location you're at!</p><input type='email' id='subinput' size='40' placeholder='provide your email here'><input type='email' id='subinput2' size='20' placeholder='and your initials here'><button id='sub'>Submit</button>";
  modal3.style.display = "block";
  var sub = document.getElementById("sub");
  var subinput = document.getElementById("subinput");
  var subinput2 = document.getElementById("subinput2");
  sub.onclick = function () {
    if (subinput.value) {
      sendit(subinput2.value, subinput.value, place);
      modal3.style.display = "none";
    }
  }
}

plot();