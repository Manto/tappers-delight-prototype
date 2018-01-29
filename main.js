// level related render //
function renderLevel() {
  LEVEL_BOXES.forEach(function(box) {
    renderBox(box);
  });
}

function renderBox(box) {
  switch (box.type) {
    case "yard":
      renderYard(box);
      break;
    case "shop":
      renderShop(box);
      break;
  }
}

function renderBoxBase(box) {
  var div = $("#box_" + box.name);

  if (box.level_exit) {
    div.addClass("box-level-exit");
  } else {
    div.removeClass("box-level-exit");
  }

  if (box.defeated) {
    div.addClass("box-completed");
  } else {
    div.removeClass("box-completed");
    if (box.active) {
      div.addClass("box-active");
      div.removeClass("box-inactive");
    } else {
      div.addClass("box-inactive");
      div.removeClass("box-active");
    }
  }
}

function renderShop(shop) {
  renderBoxBase(shop);
  var div = $("#box_" + shop.name);
  var fill = $("#box_fill_" + shop.name);
  var span = $("#box_span_" + shop.name);

  var content = "";
  _.each(_.keys(shop.boost), function(key) {
    switch (key) {
      case "stamina_max":
        content += "+" + shop.boost[key] + " STA<br />";
        break;
      case "health_max":
        content += "+" + shop.boost[key] + " HP<br />";
        break;
      case "power":
        content += "+" + shop.boost[key] + " POW<br />";
        break;
    }
  });

  content += "for " + shop.cost_current + " coins";

  span.html(content);

  var fillRatio = shop.purchase_count / shop.purchase_max;
  var divWidth = div.width() | 0;
  fill.css("width", fillRatio * divWidth);
}

function renderYard(yard) {
  renderBoxBase(yard);

  var div = $("#box_" + yard.name);
  var fill = $("#box_fill_" + yard.name);
  var span = $("#box_span_" + yard.name);
  var currentHealth = Math.floor(yard.health_max - yard.health_current);

  content = "<b>" + currentHealth + "/" + yard.health_max + "</b><br />";
  if (yard.damage) {
    content += "<b>" + yard.damage + "</b>dmg" + "<br />";
  }

  span.html(content);

  var fillRatio = 1 - yard.health_current / yard.health_max;
  var divWidth = div.width() | 0;
  fill.css("width", fillRatio * divWidth);
}

function setupLevel() {
  var board = $("#content");
  board.css("width", UNIT * BOARD.box_width);
  board.css("height", UNIT * BOARD.box_height);
  LEVEL_BOXES.forEach(function(box) {
    createBoxIfNotThere(board, box);
  });
}

function setupListeners() {
  $("#max_stamina_boost_btn").click(function() {
    if (PLAYER.stamina_current < PLAYER.stamina_max) {
      PLAYER.stamina_current = PLAYER.stamina_max;
    }
    PLAYER.stamina_current = PLAYER.stamina_current * 1.2;
    PLAYER.boosts.max_stamina -= 1;
    renderPlayer();
  });

  $("#max_health_boost_btn").click(function() {
    if (PLAYER.health_current < PLAYER.health_max) {
      PLAYER.health_current = PLAYER.health_max;
    }
    PLAYER.health_current = PLAYER.health_current * 1.2;
    PLAYER.boosts.max_health -= 1;
    renderPlayer();
  });
}

function createBoxIfNotThere(div, box) {
  var boxDiv = $("#box_" + box.name);
  if (!boxDiv.length) {
    var html =
      '<div id="box_' +
      box.name +
      '" class="box ' +
      (box.active ? " box-active " : " box-inactive ") +
      '" onclick="onBoxClicked(\'' +
      box.name +
      "')\">";
    html += '<div id="box_fill_' + box.name + '" class="box-fill"></div>';
    html +=
      '<div id="box_text_container_' +
      box.name +
      '" class="box-text-container">';
    /*
    html +=
      '<div id="box_name_' +
      box.name +
      '" class="box-name">' +
      box.name +
      "</div>";
      */
    html +=
      '<span id="box_span_' + box.name + '" class="box-text">--/--</span>';
    html += "</div>";
    html += "</div>";
    div.html(div.html() + html);

    boxDiv = $("#box_" + box.name);
    boxDiv.css("width", box.box_width * UNIT - 4);
    boxDiv.css("height", box.box_height * UNIT - 4);
    boxDiv.css("left", box.box_x * UNIT + 2 + 5);
    boxDiv.css("top", box.box_y * UNIT + 2 + 5);
    fillDiv = $("#box_fill_" + box.name);
    fillDiv.css("height", box.box_height * UNIT - 4);
    textContainerDiv = $("box_text_container_" + box.name);
    textContainerDiv.css("height", box.box_height * UNIT);
    textContainerDiv.css("width", box.box_width * UNIT);
  }
}

// player related render //
function renderPlayer() {
  for (var key in PLAYER) {
    var div = $("#player_" + key);
    if (div) {
      var value = Math.floor(PLAYER[key]);
      var content = value;

      if (!isNaN(value)) {
        // if it's a "current" vaue and it's at 0, show a warning
        if (key.endsWith("_current")) {
          // TODO: hacky stuff
          var maxValue = PLAYER[key.replace("_current", "_max")];

          if (value <= 0) {
            content = ' <span class="label-warning">0!!!</span>';
          } else if (value > maxValue) {
            content = ' <span class="label-awesome">' + value + "</span>";
          }
        }
      }
      div.html(content);
    }
  }

  $("#max_stamina_boost_btn").prop("disabled", PLAYER.boosts.max_stamina <= 0);
  $("#max_health_boost_btn").prop("disabled", PLAYER.boosts.max_health <= 0);
  $("#max_stamina_boosts").text(PLAYER.boosts.max_stamina);
  $("#max_health_boosts").text(PLAYER.boosts.max_health);
}

function updateData(ticks) {
  updateHealth(PLAYER);
  updateStamina(PLAYER);
  LEVEL_BOXES.forEach(function(box) {
    if (!isDefeated(box)) {
      updateHealth(box);
    }
  });
}

function updateHealth(entity, ticks) {
  if (!isInjured(entity)) {
    return;
  }

  var now = new Date().getTime();
  if (entity.lastAttack && now - entity.lastAttack < 1000) {
    return;
  }

  if (!entity.health_regen_current) {
    entity.health_regen_current = entity.health_regen;
  } else {
    entity.health_regen_current *= entity.health_regen_acceleration;
  }
  entity.health_current += entity.health_regen_current;

  if (entity.health_current >= entity.health_max) {
    entity.health_current = entity.health_max;
    onBoxHealed(entity);
  }

  if (entity.health_current < 0) {
    entity.health_current = 0;
  }

  if (ticks > 1) {
    updateHealth(entity, ticks - 1);
  }
}

// linear stamina regeneration
function updateStamina(entity, ticks) {
  if (playerIsRested()) {
    return;
  }

  var now = new Date().getTime();
  if (entity.lastAttack && now - entity.lastAttack < 1000) {
    return;
  }

  entity.stamina_current += entity.stamina_regen;
  if (entity.stamina_current > entity.stamina_max) {
    entity.stamina_current = entity.stamina_max;
  }

  if (entity.stamina_current < 0) {
    entity.stamina_current = 0;
  }

  if (ticks > 1) {
    updateHealth(entity, ticks - 1);
  }
}

// event listeners //
function onBoxClicked(name) {
  var box = getBoxByName(name);
  switch (box.type) {
    case "yard":
      attackYard(box);
      break;
    case "shop":
      buyFromShop(box);
      break;
  }
}

function onPlayerDefeated() {
  console.log("im defeated");
}

function onPlayerExhausted() {
  console.log("im exhausted");
}

function buyFromShop(shop) {
  if (canAffordShop(shop)) {
    PLAYER.coin -= shop.cost_current;
    shop.cost_current = Math.round(shop.cost_current * shop.cost_acceleration);

    _.each(_.keys(shop.boost), function(key) {
      PLAYER[key] += shop.boost[key];
    });

    shop.purchase_count += 1;

    if (shop.purchase_count >= shop.purchase_max) {
      onShopDepleted(shop);
    }

    activateAdjacentBoxes(shop);

    renderPlayer();
    renderLevel();
  } else {
    console.log("You can't afford this.");
  }
}

function attackYard(yard) {
  if (isDefeated(yard)) {
    console.log("box already defeated");
    return;
  }

  if (playerCanAttack()) {
    PLAYER.stamina_current -= PLAYER.stamina_cost;
    PLAYER.health_current -= yard.damage;
    if (PLAYER.health_current <= 0) {
      PLAYER.health_current = 0;
      onPlayerDefeated();
    }

    yard.health_current -= PLAYER.power;
    if (yard.health_current <= 0) {
      yard.health_current = 0;
      onYardDefeated(yard);
    }

    if (PLAYER.stamina_current <= 0) {
      PLAYER.stamina_current = 0;
      onPlayerExhausted();
    }

    var now = new Date().getTime();
    PLAYER.lastAttack = now;
    yard.lastAttack = now;

    renderPlayer();
    renderLevel();
  } else {
    console.log("... unable to attack");
  }
}

function onYardDefeated(box) {
  box.defeated = true;

  // stops regen
  box.health_regen_current = 0;

  // award player coin
  PLAYER.coin += box.coin;

  activateAdjacentBoxes(box);
}

function onShopDepleted(shop) {
  shop.defeated = true;
}

function activateAdjacentBoxes(box) {
  // activate all the other neighboring boxes
  var maxX = box.box_x + box.box_width;
  var maxY = box.box_y + box.box_height;
  for (var i = 0; i < LEVEL_BOXES.length; i++) {
    candidate = LEVEL_BOXES[i];
    // see if it's one column more to the right from our grid
    if (
      (candidate.box_x === maxX &&
        candidate.box_y >= box.box_y &&
        candidate.box_y <= maxY - 1) ||
      (candidate.box_y === maxY &&
        candidate.box_x >= box.box_x &&
        candidate.box_x <= maxX - 1)
    ) {
      candidate.active = true;
    }
  }
}

function onBoxActivated(box) {
  box.active = true;
}

function onBoxHealed(box) {
  // stops regen when healed
  box.health_regen_current = 0;
}

function isDefeated(entity) {
  return entity.health_current <= 0;
}

function isInjured(entity) {
  return entity.health_max > entity.health_current;
}

function canAffordShop(shop) {
  return PLAYER.coin >= shop.cost_current;
}

function playerIsRested() {
  return PLAYER.stamina_max < PLAYER.stamina_current;
}

function playerCanAttack() {
  return (
    PLAYER.stamina_current >= PLAYER.stamina_cost && PLAYER.health_current > 0
  );
}

function getBoxByName(name) {
  for (var i = 0; i < LEVEL_BOXES.length; i++) {
    var box = LEVEL_BOXES[i];
    if (box.name === name) {
      return box;
    }
  }
  return null;
}

// main game loop //

function gameLoop() {
  // move forward one tick
  updateData(1);

  // then we render
  renderPlayer();
  renderLevel();
}

function generateBoxFrame(width, height, boxCount, bossWidth, bossHeight) {
  var count = 1;
  var boxFrame = [];
  for (var x = 0; x < width; x++) {
    var columns = [];
    for (var y = 0; y < height; y++) {
      columns.push(count);
    }
    boxFrame.push(columns);
  }

  // we assume boss is the last id
  for (var x = width - bossWidth; x < width; x++) {
    for (var y = height - bossHeight; y < height; y++) {
      boxFrame[x][y] = boxCount;
    }
  }

  var cuts = 0;
  var attempts = 0;
  while (cuts < boxCount - 2) {
    attempts += 1;
    var x = _.random(0, width - 2);
    var y = _.random(0, height - 2);
    var cutHorizontal = _.random(0, 1) === 0;

    if (cutHorizontal) {
      var top = boxFrame[x][y];
      var bottom = boxFrame[x][y + 1];
      if (top !== bottom) {
        continue;
      } else if (bottom === boxCount) {
        continue;
      } else {
        count += 1;
        for (var a = 0; a < width; a++) {
          for (var b = y + 1; b < height; b++) {
            if (boxFrame[a][b] === bottom) {
              boxFrame[a][b] = count;
            }
          }
        }
      }
    } else {
      var left = boxFrame[x][y];
      var right = boxFrame[x + 1][y];
      if (left !== right) {
        continue;
      } else if (right === boxCount) {
        continue;
      } else {
        count += 1;
        for (var a = x + 1; a < width; a++) {
          for (var b = 0; b < height; b++) {
            if (boxFrame[a][b] === right) {
              boxFrame[a][b] = count;
            }
          }
        }
      }
    }
    cuts += 1;
  }

  return boxFrame;
}

function _applyVariance(value, variance) {
  return value;
}

function _getBoxStats(difficulty) {
  var health_diff = _.random(0, difficulty);
  var damage_diff = difficulty - health_diff;

  console.log(health_diff, damage_diff);

  return {
    health_max: 50 + health_diff * 20,
    health_current: 50 + health_diff * 20,
    damage: damage_diff,
    coin: 50 + difficulty * 20
  };
}

// assuming bottom right is boss, it indicates width/height of the boss
function generateBoxData(boxFrame, boxCount, bossWidth, bossHeight) {
  var width = boxFrame.length;
  var height = boxFrame[0].length;

  var staminaShopCount = 0;
  var healthShopCount = 0;
  var powerShopCount = 0;

  LEVEL_BOXES = [];
  for (var id = 1; id <= boxCount; id++) {
    var boxData = _getBoxPosInFrame(boxFrame, id);
    var distance =
      boxData.box_x +
      boxData.box_y +
      boxData.box_width -
      1 +
      boxData.box_height -
      1;

    var isShop = id % 8 === 0;
    var isActive = id === 1;
    var isExit =
      boxData.box_x + boxData.box_width === width &&
      boxData.box_y + boxData.box_height === height;

    if (!isShop) {
      var difficulty = Math.floor(id / 15 + distance / 2);

      // extra difficulty for boss exit
      if (isExit) {
        difficulty += 1;
      }

      _.extend(boxData, _getBoxStats(difficulty));
      _.extend(boxData, {
        name: String(id),
        type: "yard",
        active: isActive,
        level_exit: isExit,
        health_regen: 1,
        health_regen_current: 0,
        health_regen_acceleration: 1.333
      });
    } else {
      _.extend(boxData, {
        name: "shop_" + id,
        type: "shop",
        active: isActive,
        level_exit: isExit,
        boost: {}
      });

      var shopTypes = ["stamina", "health", "power"];
      var shopType = shopTypes[_.random(0, 2)];
      if (staminaShopCount === 0) {
        shopType = "stamina";
      } else if (healthShopCount === 0) {
        shopType = "health";
      } else if (powerShopCount === 0) {
        shopType = "power";
      }

      if (shopType === "stamina") {
        var base = 10;
        var purchaseMax = 5;
        var costAcceleration = 1.25;
        boxData.boost.stamina_max = 1;
        var cost = base * Math.pow(1.25, 5 * staminaShopCount);
        cost = Math.floor(cost / 10) * 10;
        staminaShopCount += 1;
      } else if (shopType === "health") {
        var base = 10;
        var purchaseMax = 5;
        var costAcceleration = 1.25;
        boxData.boost.health_max = 1;
        var cost = base * Math.pow(1.25, 5 * healthShopCount);
        cost = Math.floor(cost / 10) * 10;
        healthShopCount += 1;
      } else if (shopType === "power") {
        var base = 40;
        var purchaseMax = 5;
        var costAcceleration = 1.25;
        boxData.boost.power = 1;
        var cost = base * Math.pow(1.25, 5 * powerShopCount);
        cost = Math.floor(cost / 20) * 20;
        powerShopCount += 1;
      }

      _.extend(boxData, {
        cost_acceleration: 1.25,
        purchase_max: purchaseMax,
        purchase_count: 0,
        cost_current: cost
      });
    }

    LEVEL_BOXES.push(boxData);
  }
}

function _getBoxPosInFrame(boxFrame, id) {
  var width = boxFrame.length;
  var height = boxFrame[0].length;
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      if (boxFrame[x][y] === id) {
        // found the x,y
        // next get width
        var boxWidth = _getBoxWidthInFrame(boxFrame, id, x, y);
        var boxHeight = _getBoxHeightInFrame(boxFrame, id, x, y);
        return {
          box_x: x,
          box_y: y,
          box_width: boxWidth,
          box_height: boxHeight
        };
      }
    }
  }
}

function _getBoxWidthInFrame(boxFrame, id, x, y) {
  var width = boxFrame.length;
  var height = boxFrame[0].length;
  for (var a = x; a < width; a++) {
    if (boxFrame[a][y] !== id) {
      break;
    }
  }
  return a - x;
}

function _getBoxHeightInFrame(boxFrame, id, x, y) {
  var width = boxFrame.length;
  var height = boxFrame[0].length;
  for (var b = y; b < height; b++) {
    if (boxFrame[x][b] !== id) {
      break;
    }
  }
  return b - y;
}

function startGame() {
  var boxCount = Math.floor(BOARD.box_width * BOARD.box_height * 0.6);
  var boxFrame = generateBoxFrame(
    BOARD.box_width,
    BOARD.box_height,
    boxCount,
    BOARD.boss_width,
    BOARD.boss_height
  );
  generateBoxData(boxFrame, boxCount);
  renderPlayer();
  setupLevel();
  setupListeners();
  setInterval(gameLoop, 40);
}

setTimeout(startGame, 1000);
