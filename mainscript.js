import * as lib from "./lib.js";

(async () => {
  // データ取得・整形
  lib.initializePovList(povList);
  var read_povList = d3.csv("data/povlist_safe.csv");
  var read_games = d3.csv("data/gamelist_safe_added_pov.csv");
  var read_modelList = d3.csv("data/model_list.csv");
  var read_brandList = d3.csv("data/brandlist.csv");
  Array.prototype.push.apply(povList, await read_povList);
  lib.makePovIdToIndex(povList);
  lib.initializeBrandList(await read_brandList);
  games = await read_games;
  modelList = await read_modelList;
  lib.initializeModelList(modelList);

  // 絞り込みのスライダーの設定(4種)
  visiblePointSlider.on("onchange", lib.changeVisiblePointSlider);
  gVisiblePoint.call(visiblePointSlider);
  yearRangeSlider.on("onchange", lib.changeYearRangeSlider);
  gYearRange.call(yearRangeSlider);
  scoreRangeSlider.on("onchange", lib.changeScoreRangeSlider);
  gScoreRange.call(scoreRangeSlider);
  circleSizeRangeSlider.on("onchange", lib.changeCircleSizeRangeSlider);
  gCircleSizeRange.call(circleSizeRangeSlider);

  // POV調整機能
  var adjustPov = d3
    .select(".adjustPovWrapper")
    .selectAll("div")
    .data(povList)
    .enter()
    .append("div")
    .attr("id", (d) => `adjustPov${d.id}`)
    .attr("class", "adjustPov");
  adjustPov
    .append("div")
    .attr("class", "povTitle")
    .html((d) => d.title);
  adjustPov.append("div").attr("class", "adjustPovSlider");
  var width = 200;
  for (var use_id in povWeight) {
    var gAdjustPov = d3
      .select(`#adjustPov${use_id}`)
      .select(".adjustPovSlider")
      .append("svg")
      .attr("class", "adjustPovSliderSvg")
      .attr("id", `adjustPovSliderSvg${use_id}`)
      .attr("width", width + 50)
      .attr("height", 45)
      .append("g")
      .attr("transform", "translate(30,10)");
    gAdjustPov.call(lib.makePovSlider(use_id, width));
  }
  povWeight["0"] = 1;

  // ゲームを表す円
  var circle = d3
    .select(".graph")
    .selectAll("circle")
    .data(games)
    .enter()
    .append("circle")
    .attr("class", "circle")
    .attr("fill", "white")
    .attr("stroke", "black")
    .attr("id", (d) => {
      return `game${d.id}`;
    })
    .on("mouseover", (event, d) => {
      lib.circleMouseover(event, d);
    })
    .on("mouseout", (event, d) => {
      lib.circleMouseout(event, d);
    })
    .on("click", (event, d) => {
      lib.openPopup(event, d);
    })
    .call(lib.updateGamesPoint)
    .call(lib.circlePosition)
    .sort(lib.pointOrder);

  // ゲームハードの絞り込み
  var gameModelSelect = d3
    .select(".oneModelSelectWrapper")
    .selectAll("button")
    .data(modelList)
    .enter()
    .append("button")
    .attr("class", "oneModelSelectButton")
    .attr("id", (d) => `oneModelSelectButton${d.index}`)
    .text((d) => d.model)
    .on("click", (event, d) => {
      lib.modelSelectButtonClick(event, d);
    });
  d3.select("#selectAllModel").on("click", () => {
    lib.modelSelectButtonClickAll(true);
  });
  d3.select("#unselectAllModel").on("click", () => {
    lib.modelSelectButtonClickAll(false);
  });

  // ゲームハード選択ボタンをアクティブで初期化
  lib.modelSelectButtonClickAll(true);

  // popupの設定
  d3.select(".gameInfoDetailPopup")
    .select(".closeButton")
    .on("click", lib.closePopup);

  // helpの設定
  d3.select(".help").select(".closeButton").on("click", lib.closeHelp);
  d3.select(".helpButton").on("click", lib.openHelp);
})();
