/* variablen */
const search = document.getElementsByClassName('search')[0];
const clearButton = document.getElementsByClassName('btn')[0];
const searchButton = document.getElementsByClassName('search-button')[0];
const info = L.control();
const container = document.getElementsByClassName('search-container')[0];
const grades = [0, 100, 500, 1000, 3000, 5000, 50000, 100000];

/* funktionen um die Karte zu manipulieren */

// setzt die standart farben abhängig von der eigenschaft
const defaultColor = (feature) => {
  return {
    fillColor: getColor(feature.properties.avg_seven_day_cases),
    weight: 0.5,
    opacity: 1,
    color: '#000',
    fillOpacity: 0.7,
  };
};

//effekte werden aktiv
function mouseover(event) {
  const layer = event.target;

  layer.setStyle({
    fillColor: '#fff',
    weight: 1,
    fillOpacity: 1,
  });

  // popup öffnet sich über dem mauszeiger
  layer.openPopup(event.latlng);

  info.update(layer.feature.properties);
}

//effekte werden wieder aufgehoben
function mouseout(event) {
  const layer = event.target;

  layer.setStyle(defaultColor(event.target.feature));
  layer.closePopup();
  info.update();
}

// jeder layer bekommt seine eigenen events
function onEachFeature(feature, layer) {
  //popup setup
  const {
    name,
    total_cases,
    avg_seven_day_cases,
    population,
    iso_code,
  } = layer.feature.properties;
  const popup = `<h1>${name}</h1><hr/>
  <ul>
  <li><h6>Insgesamt Fälle</h6>${total_cases}</li>
  <li><h6>Infektionen der letzten Sieben Tage</h6> ${avg_seven_day_cases}</li>
  <li><h6>Bevölkerungszahl</h6> ${population}</li>
  <li><h6>ISO-Code</h6> ${iso_code}</li>
  </ul>
  `;

  //popup wird angebunden
  layer.bindPopup(popup, {
    closeButton: false,
    className: 'custom-popup',
    autoPan: false,
    offset: [-125, 125],
  });

  // events werden angebunden
  return layer.on({ mouseover, mouseout });
}

// definition von farben abhängig von den eigenschaften
function getColor(avg_seven_day_cases) {
  let color = '';

  //umwandlung zur zahl
  if (typeof avg_seven_day_cases === 'string') {
    avg_seven_day_cases = parseInt(avg_seven_day_cases.replace('.', ''));
  }
  color =
    avg_seven_day_cases > grades[7]
      ? '#800026'
      : avg_seven_day_cases > grades[6]
      ? '#BD0026'
      : avg_seven_day_cases > grades[5]
      ? '#E31A1C'
      : avg_seven_day_cases > grades[4]
      ? '#FC4E2A'
      : avg_seven_day_cases > grades[3]
      ? '#FD8D3C'
      : avg_seven_day_cases > grades[2]
      ? '#FEB24C'
      : avg_seven_day_cases > grades[1]
      ? '#FED976'
      : '#FFEDA0';
  return color;
}

//länder bekommen ihre farben
function style(feature) {
  return defaultColor(feature);
}

//sichtbarkeit des clear buttons im input
function inputClearButtonVisiblity() {
  if (search.value.length == 0) {
    clearButton.style.display = 'none';
  } else {
    clearButton.style.display = 'block';
  }
  search.setAttribute('value', '');
}

/* p5js setup */
async function setup() {
  noCanvas();

  //map setup
  const map = L.map('map', {
    center: [0, 0],
    zoom: 1,
    maxBounds: [
      [100, 250],
      [-80, -250],
    ],
    zoomControl: false,
  });

  //datei importieren
  const boundary = await fetch('./countries.geo.json')
    .then((res) => res.text())
    .then((jsonString) => JSON.parse(jsonString));

  //geoJSON verarbeiten und events anbinden
  const geoJson = L.geoJson(boundary, {
    onEachFeature,
    style,
  }).addTo(map);

  //zentriere Karte
  map.fitBounds(geoJson.getBounds());
  map.on('resize', () => map.fitBounds(geoJson.getBounds()));

  // info box wird der karte hinzugefügt
  info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'infobox'); // create a div with a class "info"
    this.update();
    return this._div;
  };

  info.update = function (props) {
    this._div.innerHTML =
      '<h4>Land</h4>' +
      (props ? '<b>' + props.name + '</b>' : 'Hover über ein Land');
  };

  info.addTo(map);

  //legende wird zur karte hinzugefügt
  const legend = L.control({ position: 'bottomleft' });

  legend.onAdd = function (map) {
    let div = L.DomUtil.create('div', 'info legend');

    for (let i = 0; i < grades.length; i++) {
      let str = `<i style="background:${getColor(grades[i] + 1)}"></i> `;

      if (grades[i + 1]) {
        str += grades[i] + ' &ndash; ' + grades[i + 1] + '<br>';
      } else {
        str += grades[i] + '+';
      }

      div.innerHTML += str;
    }

    return div;
  };

  legend.addTo(map);

  //input und clear button
  clearButton.addEventListener('click', () => {
    search.value = '';
    clearButton.style.display = 'none';
    container.classList.remove('active');
  });
  search.addEventListener('input', inputClearButtonVisiblity);

  //such funktion der suchbuttons
  searchButton.addEventListener('click', () => {
    const value = search.getAttribute('value') || search.value;
    let results = [];
    //json to array
    for (ele in geoJson['_layers']) results.push(geoJson['_layers'][ele]);

    //value in layer finden
    if (results.length > 0 && value.length > 0)
      for (ele of results) {
        if (
          value === ele['feature']['properties']['iso_code'] ||
          value.toLowerCase() ===
            ele['feature']['properties']['name'].toLowerCase()
        ) {
          map.fitBounds(ele.getBounds());
          ele.openPopup();

          //markiert land
          ele.setStyle({
            fillColor: '#fff',
            weight: 1,
            fillOpacity: 1,
          });

          //hebt wieder die markierung auf nach 5 sekunden
          setTimeout(function () {
            ele.setStyle({
              fillColor: getColor(
                ele['feature']['properties']['avg_seven_day_cases']
              ),
              weight: 1,
              fillOpacity: 1,
            });
          }, 5000);
          return;
        }
      }
  });

  // nimmt clicks außerhalb des search-containers auf und entfernt aktive klasse von der datalist
  document.addEventListener('click', (e) => {
    if (!search.contains(e.target)) container.classList.remove('active');
  });
}
