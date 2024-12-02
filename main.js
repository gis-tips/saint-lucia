var map = new maplibregl.Map({
  container: 'map',
  style: 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json', // 地図のスタイル
  center: [-60.9897593, 14.0110434], // 中心座標
  zoom: 16, // ズームレベル
});

// スケールコントロールを追加 
var scale = new maplibregl.ScaleControl({
  maxWidth: 80, // スケールの幅 
  unit: 'metric' // メートル表記 
}); 
map.addControl(scale, 'bottom-right'); // 右下に配置 

// 方位記号を追加 
var nav = new maplibregl.NavigationControl({ 
  visualizePitch: true // ピッチ（傾き）の表示を有効化 
}); 
map.addControl(nav, 'top-left'); // 左上に配置  

// 現在地を取得し、地図の中心に設定
if (navigator.geolocation) { 
  navigator.geolocation.getCurrentPosition(function(position) {
    var userLocation = [position.coords.longitude, position.coords.latitude]; 
    map.setCenter(userLocation); // 地図の中心座標を現在地に設定 
  }, function(error) { 
    console.error("現在地の取得に失敗しました。", error); 
  }); 
} else { 
  console.error("ブラウザがGeolocation APIをサポートしていません。"); 
}

var popup = new maplibregl.Popup({
  offset: 25, // ポップアップの位置
  closeButton: false, // 閉じるボタンの表示
}).setHTML('<div style="font-size: 1.5em;">George F. L. Charles Airport</div>');

var marker = new maplibregl.Marker().setLngLat([-60.9946090, 14.0203937]).setPopup(popup).addTo(map);

map.on('load', async () => {
  // 使用するアイコンのIDをリストに追加
  const iconIDs = [
    '1A', '1B', '1D', '1E', '1F', '2A', '2B',
    '2C', '2H', '3A', '3B', '3C', '3D', '3E',
    '3F', '5A', '5B', '5C', '5D', '5E', '5F'
  ];

  // 各アイコンをロードし、地図に追加
  for (let iconID of iconIDs) {
    // 画像を非同期にロード
    await loadImage(`./img/${iconID}.png`).then((image) => {
      map.addImage(iconID, image);
    }).catch((error) => {
      console.error(`アイコンのロードに失敗しました: ${iconID}`, error);
    });
  }

  // GeoJSONデータをソースとして追加
  map.addSource('facility_point', {
    type: 'geojson',
    data: './data/point.geojson',
  });

  // ポイントレイヤーを追加し、各ポイントにアイコンを設定
  map.addLayer({
    id: 'facility_point',
    type: 'symbol',
    source: 'facility_point',
    layout: {
      'icon-image': ['get', 'ID'],  // 各ポイントのIDフィールドをアイコン名として使用
      'icon-size': 0.1
    }
  });

  console.log('GeoJSONデータのロードに成功しました');
});

// 画像をロードする関数
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

// 地物クリック時にポップアップを表示する
map.on('click', 'facility_point', (e) => {
  var coordinates = e.features[0].geometry.coordinates.slice();
  var name = e.features[0].properties.Name;
  var id = e.features[0].properties.ID; // IDプロパティを取得

  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  // ポップアップの内容に画像を追加
  var popupContent = `<div style="font-size: 1.5em;"><strong></strong> ${name} Bus Stop<br>
                      <img src="./tagedphoto/${name}.jpg" alt="${name}" style="width:200px;height:auto;"></div>`;

  // ポップアップを表示する
  new maplibregl.Popup({
    offset: 10, // ポップアップの位置
    closeButton: false, // 閉じるボタンの表示
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

  // 通常のラインレイヤー
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
        // 条件に基づいて色を指定 
        ['1A', '1B', '1D', '1E', '1F'], '#dcbf1b', // 黄色 
        ['2A', '2B', '2C', '2H'], '#08b584', // 緑 
        ['3A', '3B', '3C', '3D', '3E', '3F'], '#ff601a', // オレンジ 
        ['5A', '5B', '5C', '5D', '5E', '5F'], '#c83939', // 赤 
        /* デフォルトの色 */ 
        '#0067c0'
      ], 
      'line-width': 5,
    },
  });

  // ハイライト用のラインレイヤー
  map.addLayer({
    id: 'castries_bus_highlight',
    type: 'line',
    source: 'castries_bus',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#ffff00', // ホバー時の黄色
      'line-width': 7,
    },
    filter: ['==', 'Name', ''], // 初期状態ではフィルタが適用されており、何も表示しない
  });

  // マウスオーバー時にハイライト
  map.on('mousemove', 'castries_bus', (e) => {
    if (e.features.length > 0) {
      map.setFilter('castries_bus_highlight', ['==', 'Name', e.features[0].properties.Name]);
    }
  });

  // マウスが外れた時にハイライトを解除
  map.on('mouseleave', 'castries_bus', () => {
    map.setFilter('castries_bus_highlight', ['==', 'Name', '']);
  });

  // クリックイベントでポップアップを表示
  map.on('click', 'castries_bus', (e) => {
    if (e.features.length > 0) {
      const feature = e.features[0];
      const coordinates = e.lngLat;
      const routeNumber = feature.properties.Name;
      const destination = feature.properties.description;

      // ポップアップの内容を設定
      const popupContent = `<div style="font-size: 1.5em;"><strong>Route number:</strong> ${routeNumber}<br>
                            <strong>Destination:</strong> ${destination}</div>`;

      // ポップアップを表示
      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);
    }
  });
});
