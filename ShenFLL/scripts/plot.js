function plot(){
  var data;
  if(window.location.toString().indexOf("all") > -1){
    data = tree.mapData();
  }else{
    data = tree.mapDataNo();
  }
  mapboxgl.accessToken = 'pk.eyJ1Ijoid2NmdGVhIiwiYSI6ImNrbWlicXUzYzBmcGUyb3M3NGJiemk2Y3YifQ.bEZHzGCOSoCanXcE-Kvy4w';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v11',
    center: [-73.8107,42.8610],
    zoom: 10.75,
    attributionControl: false
  });
  map.addControl(new mapboxgl.NavigationControl());
  map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true
  }));
  map.addControl(new mapboxgl.AttributionControl({
    compact: true
  }));
  var scale = new mapboxgl.ScaleControl({
    maxWidth: 80,
    unit: 'imperial'
  });
  map.addControl(scale);
  scale.setUnit('metric');
  map.addControl(new mapboxgl.FullscreenControl({container: document.querySelector('myDiv')}));
  //pitchtoggle class from https://github.com/tobinbradley/mapbox-gl-pitch-toggle-control
  class PitchToggle {
    constructor(){
      this._pitch = 70;
    }
  
    onAdd(map){
      this._map = map;
  
      this._btn = document.createElement("button");
      this._btn.className = "mapboxgl-ctrl-icon mapboxgl-ctrl-pitchtoggle-3d";
      this._btn.type = "button";
      this._btn["aria-label"] = "Toggle 3d View";
      this._btn.onclick = () => {
        if (map.getPitch() === 0) {
          let options = { pitch: this._pitch };
          map.easeTo(options);
          this._btn.className =
            "mapboxgl-ctrl-icon mapboxgl-ctrl-pitchtoggle-2d";
        } else {
          map.easeTo({ pitch: 0 });
          this._btn.className =
            "mapboxgl-ctrl-icon mapboxgl-ctrl-pitchtoggle-3d";
        }
      };
  
      this._container = document.createElement("div");
      this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl";
      this._container.appendChild(this._btn);
  
      return this._container;
    }
  
    onRemove(){
      this._container.parentNode.removeChild(this._container);
      this._map = undefined;
    }
  }
  class SearchBar {
    onAdd(map){
      this._map = map;

      this._inputState = "unfocused";

      this._btn = document.createElement("button");
      this._btn.className = "mapboxgl-ctrl-icon mapboxgl-ctrl-search";
      this._btn.type = "button";
      this._btn["aria-label"] = "Search Bar";

      this._input = document.createElement("input");
      this._input.type = "text";
      this._input.className = "mapboxgl-ctrl-search-input";
      this._input.placeholder = "Search for parks";
      this._input["aria-hidden"] = "true";
      this._btn.appendChild(this._input);

      this._container = document.createElement("div");
      this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl mapboxgl-ctrl-group-search";

      this._container.appendChild(this._btn);

      this._input.onkeyup = () => {
        this.clearList();
        this.addAllPlaces(this._input.value);
      }

      this._input.onblur = (e) => {
        this.clearList();
        this._input.value = "";
        this._inputState = "unfocused";
      }

      this._input.onclick = () => {
        if(this._inputState == "unfocused"){
          this._inputState = "focused";
          this.clearList();
          this.addAllPlaces("");
        }
      }

      return this._container;
    }
  
    onRemove(){
      this._container.parentNode.removeChild(this._container);
      this._map = undefined;
    }

    addAllPlaces(filter){
      Object.entries(mydata.points).forEach(obj => {
        var point = obj[1];
        var filtertext = point.name.toUpperCase().split(" ").join("");
        var newfilter = filter.toUpperCase().split(" ").join("");
        if(point.popup && filtertext.indexOf(newfilter) > -1){
          this.addToList(point.name);
        }
      });
    }

    addToList(text){
      this._list = document.createElement("button");
      this._list.className = "mapboxgl-ctrl-icon mapboxgl-ctrl-list";
      this._txt = document.createTextNode(text);
      this._list.appendChild(this._txt);
      this._list.onmousedown = () => {
        var comli = mydata.points[findit(text)];
        modaltitle.innerHTML = comli.popup.title;
        modaltext.innerHTML = comli.popup.text;
        modalimg.src = comli.popup.image;
        modaldir.href = "https://directions-api.jonahmorgan1.repl.co/?place=" + comli.coords + "";
        modal.style.display = "block";
        this._input.value = "";
      }
      this._container.appendChild(this._list);
    }
    clearList(){
      while(this._container.childNodes.length > 1){
        this._container.childNodes.forEach(item => {
          if(item != this._container.firstChild){
            this._container.removeChild(item);
          }
        });
      }
    }
  }
  class TerrainButton {
    onAdd(map){
      this._map = map;

      this._btn = document.createElement("button");
      this._btn.className = "mapboxgl-ctrl-icon mapboxgl-ctrl-terrain";
      this._btn.type = "button";
      this._btn["aria-label"] = "Enable Terrain";

      this._btn.onclick = () => {
        terrain();
      }

      this._container = document.createElement("div");
      this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl";

      this._container.appendChild(this._btn);

      return this._container;
    }
  
    onRemove(){
      this._container.parentNode.removeChild(this._container);
      this._map = undefined;
    }
  }
  class StyleToggle {
    constructor() {
      this._style = "outdoors-v11";
    }
  
    onAdd(map){
      this._map = map;
  
      this._btn = document.createElement("button");
      this._btn.className = "mapboxgl-ctrl-icon mapboxgl-ctrl-styletoggle-satellite";
      this._btn.type = "button";
      this._btn["aria-label"] = "Toggle Map Style";
      this._btn.onclick = () => {
        if(this._style == "outdoors-v11"){
          map.setStyle("mapbox://styles/mapbox/satellite-v9");
          this._style = "satellite-v9";
          this._btn.className = "mapboxgl-ctrl-icon mapboxgl-ctrl-styletoggle-outdoors";
        }else if(this._style == "satellite-v9"){
          map.setStyle("mapbox://styles/mapbox/outdoors-v11");
          this._style = "outdoors-v11";
          this._btn.className = "mapboxgl-ctrl-icon mapboxgl-ctrl-styletoggle-satellite";
        }
      };
  
      this._container = document.createElement("div");
      this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl";
      this._container.appendChild(this._btn);
  
      return this._container;
    }
  
    onRemove(){
      this._container.parentNode.removeChild(this._container);
      this._map = undefined;
    }
  }
  map.addControl(new PitchToggle(), "top-right");
  map.addControl(new SearchBar(), "top-left");
  map.addControl(new TerrainButton(), "top-right");
  map.addControl(new StyleToggle(), "top-right");
  function addthedata(){
    buildings();
    sky();
    data.forEach(function(obj){
      if(obj){
        console.log(obj)
        if(obj.type == "point"){
          if(obj.waypoint){
            //point(obj.lon[0],obj.lat[0],obj.name,true);
          }else{
            point(obj.lon[0],obj.lat[0],obj.name,false);
          }
        }
        if(obj.type == "line"){
          if(obj.color){
            line(obj.lon[0],obj.lat[0],obj.lon[1],obj.lat[1],obj.color,5);
          }else if(obj.fromtea == true){
            line(obj.lon[0],obj.lat[0],obj.lon[1],obj.lat[1],"#ff44ff",5);
          }else{
            line(obj.lon[0],obj.lat[0],obj.lon[1],obj.lat[1],"#4444ff",5);
          }
        }
      }
    });
  }
  map.on('style.load', function(){
    map.loadImage('images/place2.png', function (error, image) {
      if (error) throw error;
      map.addImage('custom-marker', image);
      map.loadImage('images/place3.png', function (error, image) {
        if (error) throw error;
        map.addImage('custom-marker-2', image);
        addthedata();
      });
    });
  });
  function terrain(){
    map.addSource('mapbox-dem', {
      'type': 'raster-dem',
      'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
      'tileSize': 512,
      'maxzoom': 14
    });
    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 3 });
  }
  function buildings(){
    var layers = map.getStyle().layers;
    var labelLayerId;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
        labelLayerId = layers[i].id;
        break;
      }
    }
    map.addLayer({
      'id': '3d-buildings',
      'source': 'composite',
      'source-layer': 'building',
      'filter': ['==', 'extrude', 'true'],
      'type': 'fill-extrusion',
      'minzoom': 10,
      'paint': {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.6
      }
    },labelLayerId);
  } 
  function sky(){
    map.addLayer({
      'id': 'sky',
      'type': 'sky',
      'paint': {
        'sky-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0,
          0,
          5,
          0.3,
          8,
          1
        ],
        'sky-type': 'atmosphere',
        'sky-atmosphere-sun-intensity': 10
      }
    });
  }
  function point(x,y,name,waypoint){
    var id = Math.random().toString();
    var newdata = {
      'type': 'FeatureCollection',
      'features': [
        {
          'type': 'Feature',
          'geometry': {
            'type': 'Point',
            'coordinates': [x,y],
          },
          'properties': {
            title: name,
          }
        }
      ]
    }
    map.addSource(id, {
      'type': 'geojson',
      'data': newdata,
    });
    if(waypoint){
      map.addLayer({
        'id': id,
        'type': 'symbol',
        'source': id,
        'layout': {
          'icon-image': 'custom-marker-2',
          'icon-size': 0,
          'text-field': ['get', 'title'],
          'text-font': [
            'Open Sans Regular',
            'Arial Unicode MS Regular'
          ],
          'text-size': 10,
          'text-offset': [0, 0.25],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        }
      });
      map.addLayer({
        'id': id+"text",
        'type': 'symbol',
        'source': id,
        'layout': {
          'icon-image': 'custom-marker-2',
          'icon-size': 0.5,
          'text-allow-overlap': true,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        }
      });
    }else{
      map.addLayer({
        'id': id,
        'type': 'symbol',
        'source': id,
        'layout': {
          'icon-image': 'custom-marker',
          'icon-size': 0,
          'text-field': ['get', 'title'],
          'text-font': [
            'Open Sans Regular',
            'Arial Unicode MS Regular'
          ],
          'text-size': 10,
          'text-offset': [0, 0.25],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        }
      });
      map.addLayer({
        'id': id+"text",
        'type': 'symbol',
        'source': id,
        'layout': {
          'icon-image': 'custom-marker',
          'icon-size': 0.5,
          'text-allow-overlap': true,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        }
      });
    }
    map.on('click', id, function (e) {
      if(isclicked == false){
        isclicked = true;
        try {
          comli = mydata.points[findit(name)];
          modaltitle.innerHTML = comli.popup.title;
          modaltext.innerHTML = comli.popup.text;
          modalimg.src = comli.popup.image;
          modaldir.href = "https://directions-api.jonahmorgan1.repl.co/?place=" + comli.coords + "";
          modal.style.display = "block";
        } catch{
          if(comli.intersection == false){
            alerttext.innerHTML = "Sorry, but we are still working on providing info for this location.";
            alertel.style.display = "block";
          }
        }
      }
    });
    map.on('click', id+"text", function (e) {
      if(isclicked == false){
        isclicked = true;
        try {
          comli = mydata.points[findit(name)];
          modaltitle.innerHTML = comli.popup.title;
          modaltext.innerHTML = comli.popup.text;
          modalimg.src = comli.popup.image;
          modaldir.href = "https://directions-api.jonahmorgan1.repl.co/?place=" + comli.coords + "";
          modal.style.display = "block";
        } catch{
          if(comli.intersection == false){
            alerttext.innerHTML = "Sorry, but we are still working on providing info for this location.";
            alertel.style.display = "block";
          }
        }
      }
    });
  }
  function line(x1,y1,x2,y2,color,width){
    var id = Math.random().toString();
    var newdata = {
      'type': 'FeatureCollection',
      'features': [
        {
          'type': 'Feature',
          'geometry': {
            'type': 'LineString',
            'coordinates': [
              [x1, y1],
              [x2, y2],
            ]
          },
        },
      ]
    }
    map.addSource(id, {
      'type': 'geojson',
      'data': newdata,
    });
    map.addLayer({
      'id': id,
      'type': 'line',
      'source': id,
      'layout': {
        'line-join': 'round',
        'line-cap': 'round'
      },
      'paint': {
        'line-color': color,
        'line-width': width
      }
    });
  }
}