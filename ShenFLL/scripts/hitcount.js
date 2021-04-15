(function () {
  var url = "https://hitcount.jonahmorgan1.repl.co/";
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      console.log(xhr.status);
      console.log(xhr.responseText);
    }
  };
  xhr.send();
}());