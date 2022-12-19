// povList(POVの種類のリスト)を初期化する
export function initializePovList(povList) {
  povList.push({
    comment: "ゲームに点数を登録した人数", // 補足説明
    id: "0", // 現在どの指標を表示しているかの管理に使う
    system_title: "count2", // 値の呼び出しに使う
    title: "ゲームに得点を登録した人数", // UIに使う
  });
}

// modelList(機種のリスト)を初期化する
export function initializeModelList(modelList) {
  for (var i = 0; i < modelList.length; i++) {
    modelActive[modelList[i]["model"]] = true;
  }
}

// ブランドのリストを初期化
export function initializeBrandList(list) {
  for (var i = 0; i < list.length; i++) {
    brandList[list[i]["id"]] = list[i];
  }
}

// POVのIDとindexを対応づけるリストの作成
// (d3にdataとして渡せるのがオブジェクトでなく配列に限られるため、IDをキーとしてインデックスを引き出したい)
export function makePovIdToIndex(povList) {
  for (var i = 0; i < povList.length; i++) {
    povIdToIndex[povList[i]["id"]] = i;
    povWeight[povList[i]["id"]] = 0;
  }
}

// グラフ上の円の描画順を決める関数
export function pointOrder(a, b) {
  return b.povPoint - a.povPoint;
}

// tooltipにゲーム名を表示させる
export function applyTooltipGameInfoData(event, d) {
  d3.select("#tooltipGameName").text(d.gamename);
  d3.select("#tooltipBrandName").text(
    `(${brandList[d["brandname"]]["brandname"]})`
  );
  var r = parseInt(event.target.attributes.r.value);
  var x = parseInt(event.target.attributes.cx.value) + r + 20;
  var y = parseInt(event.target.attributes.cy.value) - r - 20;
  d3.select("#tooltipGameInfoWrapper")
    .style("top", `${y}px`)
    .style("left", `${x}px`)
    .style("display", "block");
}

// グラフ上の円にマウスオーバーされた時の処理(tooltipの表示切り替え等)
export function circleMouseover(event, d) {
  circleColorChange(d);
  applyTooltipGameInfoData(event, d);
}

// グラフ上の円からマウスが外れた時の処理(tooltipの display:none; 等)
export function circleMouseout(event, d) {
  //d3.select(".graph").selectAll("circle").attr("fill", "white");
  d3.select("#tooltipGameInfoWrapper").style("display", "none");
}

export function circleColorChange(data) {
  var brandname = data["brandname"];
  d3.select(".graph")
    .selectAll("circle")
    .attr("fill", (d) => {
      if (d["brandname"] == brandname) {
        return "orange";
      } else {
        return "white";
      }
    });
  d3.select(`#game${data.id}`).attr("fill", "red");
}
// グラフ上の円の位置と表示/非表示を決める
export function circlePosition(p) {
  p.attr("cx", (d) => {
    return yearScale(dateStrToInt(d.sellday)) + 40;
  });
  p.attr("cy", (d) => {
    return scoreScale(d.median) + 40;
  });
  p.attr("r", (d) => {
    return numberOfPlayerScale(games[d[""]]["povPoint"]);
  });
  p.style("display", (d, i, nodes) => {
    var cx = nodes[i].cx.baseVal.value;
    var cy = nodes[i].cy.baseVal.value;
    var r = nodes[i].r.baseVal.value;
    var modelName = d["model"];
    if (
      games[d[""]]["povPoint"] < minVisiblePoint ||
      games[d[""]]["povPoint"] > maxVisiblePoint ||
      cx - r <= 40 ||
      cx + r >= 840 ||
      cy - r <= 40 ||
      cy + r >= 540 ||
      !modelActive[modelName]
    ) {
      return "none";
    } else {
      return "initial";
    }
  });
}

// ゲームの個別データが持つ、POVごとの値からpointを算出
export function calcPovPoint(d) {
  var sumVal = 0;
  var sumWeight = 0;
  var numberValue = 0;
  var numberConst = maxNumberOfPlayer / 10;
  for (var id in povWeight) {
    var index = povIdToIndex[id];
    var weight = Number(povWeight[id]);
    var val = Number(d[povList[index]["system_title"]]);
    if (index == 0) {
      numberValue = val;
      sumVal += (numberValue * weight) / numberConst;
      sumWeight += weight;
      continue;
    }
    sumWeight += weight;
    sumVal += (val * weight) / numberValue;
  }
  if (sumWeight == 0) {
    return 0;
  }
  var ret = (sumVal / sumWeight) * numberConst;
  return ret;
}

// 日付の文字列yyyy-mm-ddを数値データに変換
export function dateStrToInt(date) {
  var year = date.slice(0, 4);
  var month = date.slice(5, 7);
  var day = date.slice(8, 10);
  month = Number(month) - 1 + Number(day) / 32;
  var ret = Number(year) + Number(month) / 13;
  return ret;
}

// ゲームの持つpointの数値を更新
export function updateGamesPoint() {
  var maxim = 0;
  var mini = 9000000;
  for (var i = 0; i < games.length; i++) {
    games[i]["povPoint"] = calcPovPoint(games[i]);
    maxim = Math.max(maxim, games[i]["povPoint"]);
    mini = Math.min(mini, games[i]["povPoint"]);
  }
  // console.log({maxim});
  // console.log({mini});
}

// 見えるpoint範囲の変更
export function changeVisiblePointSlider(val) {
  val[0] = parseInt(val[0]);
  val[1] = parseInt(val[1]);
  minVisiblePoint = maxNumberOfPlayer ** (val[0] / maxNumberOfPlayer);
  maxVisiblePoint = maxNumberOfPlayer ** (val[1] / maxNumberOfPlayer);
  d3.select("#visiblePointSliderValue").text(
    `表示する嗜好合致度の範囲: ${parseInt(minVisiblePoint)} - ${parseInt(
      maxVisiblePoint
    )}`
  );
  updateCircle();
}

// 発売年の範囲の変更
export function changeYearRangeSlider(val) {
  if (val[0] == val[1]) {
    val[0] -= 0.1;
    val[1] += 0.1;
  }
  yearScale.domain([val[0], val[1]]);
  yearAxis = d3.axisBottom(yearScale).ticks(5, d3.format(",d"));
  d3.select(".yearAxis").call(yearAxis);
  updateCircle();
  minYear = val[0];
  maxYear = val[1];
  d3.select("#yearRangeSliderValue").text(
    `発売年の範囲: ${parseInt(minYear)} - ${parseInt(maxYear)}`
  );
}

// 得点中央値の範囲の変更
export function changeScoreRangeSlider(val) {
  val[0] = parseInt(val[0]);
  val[1] = parseInt(val[1]);
  if (val[0] == val[1]) {
    val[0] -= 1;
    if (val[0] < 0) {
      val[0] = 0;
      val[1] = 1;
    }
  }
  scoreScale.domain([val[0], val[1]]);
  scoreAxis = d3.axisLeft(scoreScale).ticks(5, d3.format(",d"));
  d3.select(".scoreAxis").call(scoreAxis);
  updateCircle();
  minScore = val[0];
  maxScore = val[1];
  d3.select("#scoreRangeSliderValue").text(
    `得点中央値の範囲: ${minScore} - ${maxScore}`
  );
}

// 円の大きさを任意で調整する
export function changeCircleSizeRangeSlider(val) {
  if (val[0] == val[1]) {
    val[0] -= 0.1;
    val[1] += 0.1;
  }
  val[0] = parseInt(val[0]);
  val[1] = parseInt(val[1]);
  numberOfPlayerScale.range([val[0], val[1]]);
  updateCircle();
  minCircleSize = val[0];
  maxCircleSize = val[1];
  d3.select("#circleSizeRangeSliderValue").text(
    `円の大きさ調整: ${parseInt(minCircleSize)} - ${parseInt(maxCircleSize)}`
  );
}

// POVを重視する度合いを調整するスライダー作成
export function makePovSlider(id, width) {
  var adjustPovSlider = d3
    .sliderBottom()
    .min(0.0)
    .max(1.0)
    .width(width)
    .ticks(-1)
    .default(id == 0 ? 1 : 0)
    .fill(activeBarColor)
    .on("onchange", function (val) {
      povWeight[id] = val;
      updateGamesPoint();
      updateCircle();
    });
  return adjustPovSlider;
}

// 機種選択ボタンの一括選択
export function modelSelectButtonClickAll(judge) {
  var buttons = d3.selectAll(".oneModelSelectButton");
  if (judge) {
    buttons.style("background", activeButtonColor);
  } else {
    buttons.style("background", "gray");
  }
  for (var model in modelActive) {
    modelActive[model] = judge;
  }
  updateCircle();
}

// 機種選択ボタンの個別選択
export function modelSelectButtonClick(event, d) {
  var modelName = d["model"];
  var index = d["index"];
  var button = d3.select(`#oneModelSelectButton${index}`);
  if (modelActive[modelName]) {
    modelActive[modelName] = false;
    button.style("background", "gray");
  } else {
    modelActive[modelName] = true;
    button.style("background", activeButtonColor);
  }
  updateCircle();
}

// スライダー等の変更に伴う円の更新
export function updateCircle() {
  d3.select(".graph").selectAll("circle").call(circlePosition).sort(pointOrder);
}

// ゲーム詳細情報のポップアップを開く
export function openPopup(event, d) {
  makePopup(event, d);
  d3.select(".gameInfoDetailPopup").style("display", "block");
}

// ゲーム詳細情報のポップアップを閉じる
export function closePopup() {
  d3.select(".gameInfoDetailPopup").style("display", "none");
}

// 個別のゲームデータの持つ情報からPOV部分のみを配列として取り出す
export function pullOutPovData(data) {
  var povData = [];
  for (var i = 1; i < povList.length; i++) {
    var systemTitle = povList[i]["system_title"];
    var val = data[systemTitle];
    var povId = povList[i]["id"];
    var obj = {
      id: povId,
      system_title: systemTitle,
      value: Number(val),
    };
    povData.push(obj);
  }
  return povData;
}

// ゲーム詳細情報画面にPOVの量を表すチャートを作成
export function makePopupPovChart(data) {
  var povData = pullOutPovData(data);
  var xOffset = 250;
  var yOffset = 20;
  var margin = 4;
  var barHeight = 20;
  var lengthRate = 5;
  d3.select(".povChart").selectAll("rect").remove();
  var rects = d3
    .select(".povChart")
    .selectAll("rect")
    .data(povData)
    .enter()
    .append("rect")
    .attr("x", 1)
    .attr("y", (d, i) => i * (barHeight + margin) + yOffset)
    .attr("height", 20)
    .attr("width", (d) => d.value / lengthRate);

  d3.select(".povChartValueWrapper")
    .style("margin-top", `${yOffset - margin / 2}px`)
    .selectAll("div")
    .remove();
  var rectVals = d3
    .select(".povChartValueWrapper")
    .selectAll("div")
    .data(povData)
    .enter()
    .append("div")
    .attr("class", "povChartValue")
    .style("top", (d, i) => `${i * (barHeight + margin)}px`)
    .style("left", (d) => `${d.value / lengthRate + xOffset + 10}px`)
    .text((d) => d.value);

  var povLabels = d3
    .select(".povChartLabelWrapper")
    .style("padding-top", `${yOffset - margin / 2}px`)
    .selectAll("div")
    .data(povData)
    .enter()
    .append("div")
    .text((d, i) => d.system_title)
    .style("line-height", `${barHeight + margin}px`)
    .style("font-size", `${barHeight}px`)
    .attr("class", "povChartLabel");
}

// ポップアップを作成
export function makePopup(event, d) {
  makePopupPovChart(d);
  var title = d.gamename;
  var score = d.median;
  var numberOfPlayer = d.count2;
  var model = d.model;
  var sellday = d.sellday;
  var dmmUrl =
    d.dmm && d.dmm.match(".*_.*")
      ? `https://dlsoft.dmm.co.jp/detail/${d.dmm}/`
      : "";
  var getchuUrl = d.comike
    ? `https://www.getchu.com/soft.phtml?id=${d.comike}`
    : "";
  var erogamescapeUrl = `https://erogamescape.dyndns.org/~ap2/ero/toukei_kaiseki/game.php?game=${d.id}`;
  var ohpUrl = d.shoukai;
  var gameWebsiteUrl =
    ohpUrl || getchuUrl || dmmUrl || `https://www.google.com/search?q=${title}`;

  var maxTextLength = 50;
  var popup = d3.select(".gameInfoDetailPopup");
  popup.select(".title").text(title);
  popup.select("#rowValueScore").text(score);
  popup.select("#rowValueSellday").text(sellday);
  popup.select("#rowValueNumberOfPlayer").text(numberOfPlayer);
  popup.select("#rowValueModel").text(model);
  popup.select("#rowValueDmmUrl").select("a").attr("href", dmmUrl).text(dmmUrl);
  popup
    .select("#rowValueGetchuUrl")
    .select("a")
    .attr("href", getchuUrl)
    .text(getchuUrl.substring(0, maxTextLength));
  popup
    .select("#rowValueErogamescapeUrl")
    .select("a")
    .attr("href", erogamescapeUrl)
    .text(`game.php?game=${d.id}`);
  popup
    .select("#rowValueGameOhpUrl")
    .select("a")
    .attr("href", ohpUrl)
    .text(ohpUrl.substring(0, maxTextLength));
  popup.select(".gameWebsiteWindow").attr("src", gameWebsiteUrl);
}

// helpを閉じる
export function closeHelp() {
  d3.select(".help").style("display", "none");
}

// helpを開く
export function openHelp() {
  d3.select(".help").style("display", "initial");
}
