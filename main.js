var map = new maplibregl.Map({
  container: 'map',
  style: 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json',
  center: [-60.9897593, 14.0110434],
  zoom: 16,
});

let pixelRatio = window.devicePixelRatio || 1; 
if (pixelRatio > 1) { 
  map.setPixelRatio(3); 
} else {
  map.setPixelRatio(1); 
}

var scale = new maplibregl.ScaleControl({
  maxWidth: 160,
  unit: 'metric'
}); 
map.addControl(scale, 'bottom-right'); 

var nav = new maplibregl.NavigationControl({
  visualizePitch: true,
  zoomInText: '+',
  zoomOutText: '-'
}); 
map.addControl(nav, 'top-left');

if (navigator.geolocation) { 
  navigator.geolocation.getCurrentPosition(function(position) {
    var userLocation = [position.coords.longitude, position.coords.latitude]; 
    map.setCenter(userLocation); 
  }, function(error) { 
    console.error("現在地の取得に失敗しました。", error); 
  }); 
} else { 
  console.error("ブラウザがGeolocation APIをサポートしていません。"); 
}

var popup = new maplibregl.Popup({
  offset: 25,
  closeButton: false,
}).setHTML('<div style="font-size: 2em;">George F. L. Charles Airport</div>');

var marker = new maplibregl.Marker().setLngLat([-60.9946090, 14.0203937]).setPopup(popup).addTo(map);

// Adjust icon size and popup font size for small screens in both orientations
if (Math.min(window.innerWidth, window.innerHeight) <= 768) { 
  map.setLayoutProperty('facility_point', 'icon-size', 0.5); // Increase to 5x size for small screens
}

map.on('load', async () => {
  const iconIDs = [
    '1A', '1B', '1D', '1E', '1F', '2A', '2B',
    '2C', '2H', '3A', '3B', '3C', '3D', '3E',
    '3F', '5A', '5B', '5C', '5D', '5E', '5F'
  ];

  for (let iconID of iconIDs) {
    await loadImage(`./img/${iconID}.png`).then((image) => {
      map.addImage(iconID, image);
    }).catch((error) => {
      console.error(`アイコンのロードに失敗しました: ${iconID}`, error);
    });
  }

  map.addSource('facility_point', {
    type: 'geojson',
    data: './data/point.geojson',
  });

  map.addLayer({
    id: 'facility_point',
    type: 'symbol',
    source: 'facility_point',
    layout: {
      'icon-image': ['get', 'ID'],
      'icon-size': 0.15 // Default size for larger screens
    }
  });

  console.log('GeoJSONデータのロードに成功しました');
});

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

map.on('click', 'facility_point', (e) => {
  var coordinates = e.features[0].geometry.coordinates.slice();
  var name = e.features[0].properties.Name;

  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  var popupContent = `<div style="font-size: ${Math.min(window.innerWidth, window.innerHeight) <= 768 ? '6em' : '1.5em'}; width: 600px;"><strong></strong> ${name} Bus Stop<br>
                      <img src="./tagedphoto/${name}.jpg" alt="${name}" style="width:100%;height:auto;"></div>`;

  new maplibregl.Popup({
    offset: 10,
    closeButton: false,
  })
    .setLngLat(coordinates)
    .setHTML(popupContent)
    .addTo(map);
});

map.on('load', () => {
  map.addSource('castries_bus', {
    type: 'geojson',
    data: './data/line.geojson',
  });

  map.addLayer({
    id: 'castries_bus',
    type: 'line',
    source: 'castries_bus',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: { 
      'line-color': [ 
        'match', 
        ['get', 'Name'], 
        ['1A', '1B', '1D', '1E', '1F'], '#dcbf1b',
        ['2A', '2B', '2C', '2H'], '#08b584',
        ['3A', '3B', '3C', '3D', '3E', '3F'], '#ff601a',
        ['5A', '5B', '5C', '5D', '5E', '5F'], '#c83939',
        '#0067c0'
      ],
      'line-width': 12, // Increase line width for better touch interaction
    },
  });

  map.addLayer({
    id: 'castries_bus_highlight',
    type: 'line',
    source: 'castries_bus',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#ffff00',
      'line-width': 14, // Highlight line width
    },
    filter: ['==', 'Name', ''],
  });

  map.on('mousemove', 'castries_bus', (e) => {
    if (e.features.length > 0) {
      map.setFilter('castries_bus_highlight', ['==', 'Name', e.features[0].properties.Name]);
    }
  });

  map.on('mouseleave', 'castries_bus', () => {
    map.setFilter('castries_bus_highlight', ['==', 'Name', '']);
  });

  map.on('click', 'castries_bus', (e) => {
    if (e.features.length > 0) {
      const feature = e.features[0];
      const coordinates = e.lngLat;
      const routeNumber = feature.properties.Name;
      const destination = feature.properties.description;

      const popupContent = `<div style="font-size: 2em;"><strong>Route number:</strong> ${routeNumber}<br>
                            <strong>Destination:</strong> ${destination}</div>`;

      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);
    }
  });
});

