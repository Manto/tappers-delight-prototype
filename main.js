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

function renderShop(shop) {
  var div = document.getElementById("box_" + shop.name);
  var span = document.getElementById("box_span_" + shop.name);

  var content = "";
  _.each(_.keys(shop.boost), function(key) {
    content += "+" + shop.boost[key] + " " + key + "<br />";
  });

  content += "for " + shop.cost_current + " coins";

  span.innerHTML = content;
}

function renderYard(yard) {
  var div = document.getElementById("box_" + yard.name);
  var fill = document.getElementById("box_fill_" + yard.name);
  var span = document.getElementById("box_span_" + yard.name);
  var currentHealth = Math.floor(yard.health_max - yard.health_current);
  span.innerText = currentHealth + "/" + yard.health_max;

  var fillRatio = 1 - yard.health_current / yard.health_max;
  var divWidth = parseInt(div.style.width.replace("px", ""));
  fill.style.width = fillRatio * divWidth;
}

function setupLevel() {
  var board = document.getElementById("content");
  board.style.width = UNIT * BOARD.box_width;
  board.style.height = UNIT * BOARD.box_height;
  LEVEL_BOXES.forEach(function(box) {
    createBoxIfNotThere(board, box);
  });
}

function createBoxIfNotThere(div, box) {
  var boxDiv = document.getElementById("box_" + box.name);
  if (!boxDiv) {
    var html =
      '<div id="box_' +
      box.name +
      '" class="box" onclick="onBoxClicked(\'' +
      box.name +
      "')\">";
    html += '<div id="box_fill_' + box.name + '" class="box-fill"></div>';
    html +=
      '<div id="box_text_container_' +
      box.name +
      '" class="box-text-container">';
    html +=
      '<div id="box_name_' +
      box.name +
      '" class="box-name">' +
      box.name +
      "</div>";
    html +=
      '<span id="box_span_' + box.name + '" class="box-text">--/--</span>';
    html += "</div>";
    html += "</div>";
    div.innerHTML += html;

    boxDiv = document.getElementById("box_" + box.name);
    boxDiv.style.width = box.box_width * UNIT - 4;
    boxDiv.style.height = box.box_height * UNIT - 4;
    boxDiv.style.left = box.box_x * UNIT + 2;
    boxDiv.style.top = box.box_y * UNIT + 2;
    fillDiv = document.getElementById("box_fill_" + box.name);
    fillDiv.style.height = box.box_height * UNIT - 4;
    textContainerDiv = document.getElementById(
      "box_text_container_" + box.name
    );
    textContainerDiv.style.height = box.box_height * UNIT;
    textContainerDiv.style.width = box.box_width * UNIT;
  }
}

// player related render //
function renderPlayer() {
  for (var key in PLAYER) {
    var div = document.getElementById("player_" + key);
    if (div) {
      var content;
      var value = PLAYER[key];

      if (!isNaN(value)) {
        // if it's a "current" vaue and it's at 0, show a warning
        if (key.endsWith("_current") && PLAYER[key] <= 0) {
          var keyName = key.replace("_current", "").toUpperCase();
          content =
            ' <span class="label-warning"> OUT OF ' + keyName + "</span>";
        } else {
          content = Math.floor(value);
        }
      } else {
        content = value;
      }
      div.innerHTML = content;
    }
  }
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

  if (entity.health_current > entity.health_max) {
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
      onBoxDefeated(yard);
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

function onBoxDefeated(box) {
  // stops regen
  box.health_regen_current = 0;

  // award player coin
  PLAYER.coin += box.coin;

  var div = document.getElementById("box_" + box.name);
  div.className = "box-completed";
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
  return PLAYER.stamina_max === PLAYER.stamina_current;
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

function generateBoxFrame(width, height, boxCount) {
  BOARD.box_width = width;
  BOARD.box_height = height;

  var count = 1;
  var boxFrame = [];
  for (var x = 0; x < width; x++) {
    var columns = [];
    for (var y = 0; y < height; y++) {
      columns.push(count);
    }
    boxFrame.push(columns);
  }

  var cuts = 0;
  var attempts = 0;
  while (cuts < boxCount - 1) {
    attempts += 1;
    var x = _.random(0, width - 2);
    var y = _.random(0, height - 2);
    var cutHorizontal = _.random(0, 1) === 0;

    if (cutHorizontal) {
      var top = boxFrame[x][y];
      var bottom = boxFrame[x][y + 1];
      if (top !== bottom) {
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

function _getBoxStats(difficulty) {
  return {
    health_max: 50 + difficulty * 20,
    health_current: 50 + difficulty * 20,
    health_regen: 1,
    health_regen_current: 0,
    health_regen_acceleration: 1.2,
    damage: 0,
    coin: 50 + difficulty * 20
  };
}

function generateBoxData(boxFrame, boxCount) {
  var width = boxFrame.length;
  var height = boxFrame[0].length;

  LEVEL_BOXES = [];
  for (var id = 1; id <= boxCount; id++) {
    var boxData = _getBoxPosInFrame(boxFrame, id);
    var difficulty = Math.floor(id / 3);

    _.extend(boxData, _getBoxStats(difficulty));
    _.extend(boxData, {
      name: "[" + id + "]",
      type: "yard"
    });

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
  var boxCount = 50;
  var boxFrame = generateBoxFrame(8, 10, boxCount);
  generateBoxData(boxFrame, boxCount);
  renderPlayer();
  setupLevel();
  setInterval(gameLoop, 20);
}

setTimeout(startGame, 1000);
