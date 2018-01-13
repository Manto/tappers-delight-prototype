// level related render //
function renderLevel() {
    LEVEL_BOXES.forEach(function (box) {
        renderBox(box);
    });
}

function renderBox(box) {
    var div = document.getElementById('box_' + box.name);
    var fill = document.getElementById('box_fill_' + box.name);
    var span = document.getElementById('box_span_' + box.name);
    span.innerText = (box.health_max - box.health_current) + '/' + box.health_max;

    var fillRatio = 1 - (box.health_current / box.health_max);
    var divWidth = parseInt(div.style.width.replace('px', ''));
    fill.style.width = fillRatio * divWidth;
}

function setupLevel() {
    var board = document.getElementById('content');
    LEVEL_BOXES.forEach(function (box) {
        createBoxIfNotThere(board, box)
    })
}

function createBoxIfNotThere(div, box) {
    var boxDiv = document.getElementById('box_' + box.name);
    if (!boxDiv) {
        var html = '<div id="box_' + box.name + '" class="box" onclick="onBoxClicked(\'' + box.name + '\')">';
        html += '<div id="box_fill_' + box.name + '" class="box-fill"></div>';
        html += '<div id="box_text_container_' + box.name + '" class="box-text-container">';
        html += '<div id="box_name_' + box.name + '" class="box-name">' + box.name + '</div>';
        html += '<span id="box_span_' + box.name + '" class="box-text">--/--</span>';
        html += '</div>';
        html += '</div>';
        div.innerHTML += html;

        boxDiv = document.getElementById('box_' + box.name);
        boxDiv.style.width = box.box_width * UNIT - 4;
        boxDiv.style.height = box.box_height * UNIT - 4;
        boxDiv.style.left = box.box_x * UNIT + 2;
        boxDiv.style.top = box.box_y * UNIT + 2;
        fillDiv = document.getElementById('box_fill_' + box.name);
        fillDiv.style.height = box.box_height * UNIT - 4;
        textContainerDiv = document.getElementById('box_text_container_' + box.name);
        textContainerDiv.style.height = box.box_height * UNIT;
        textContainerDiv.style.width = box.box_width * UNIT;
    }
}

// player related render //
function renderPlayer() {
    for (var i in PLAYER) {
        var div = document.getElementById('player_' + i);
        if (div) {
            div.innerText = PLAYER[i];
        }
    }
}

function updateData(ticks) {
    updateHealth(PLAYER);
    updateStamina(PLAYER);
    LEVEL_BOXES.forEach(function (box) {
        if (!boxIsDefeated(box)) {
            updateHealth(box);
        }
    });
}

function updateHealth(entity, ticks) {
    var amount = ticks * entity.health_regen
    entity.health_current += entity.health_regen;
    if (entity.health_current > entity.health_max) {
        entity.health_current = entity.health_max;
    }
    if (entity.health_current < 0) {
        entity.health_current = 0;
    }
}

function updateStamina(entity, ticks) {
    var amount = ticks * entity.stamina_regen
    entity.stamina_current += entity.stamina_regen;
    if (entity.stamina_current > entity.stamina_max) {
        entity.stamina_current = entity.stamina_max;
    }
    if (entity.stamina_current < 0) {
        entity.stamina_current = 0;
    }
}

// event listeners //
function onBoxClicked(name) {
    var box = getBoxByName(name);
    attackBox(box);
}

function onPlayerDefeated() {
    console.log('im defeated');
}

function onPlayerExhausted() {
    console.log('im exhausted');
}

function attackBox(box) {
    if (box.health_current === 0) {
        console.log('box already defeated');
        return;
    }

    if (playerCanAttack()) {
        PLAYER.stamina_current -= PLAYER.stamina_cost;
        PLAYER.health_current -= box.damage;
        if (PLAYER.health_current <= 0) {
            PLAYER.health_current = 0;
            onPlayerDefeated();
        }

        box.health_current -= PLAYER.power;
        if (box.health_current <= 0) {
            box.health_current = 0;
            onBoxDefeated(box);
        }

        if (PLAYER.stamina_current <= 0) {
            PLAYER.stamina_current = 0;
            onPlayerExhausted();
        }

        renderPlayer();
        renderLevel();
    } else {
        console.log('... unable to attack');
    }
}

function onBoxDefeated(box) {
    // aware player coin
    PLAYER.coin += box.coin;

    var div = document.getElementById('box_' + box.name);
    div.className = 'box-completed';
}

function boxIsDefeated(box) {
    return box.health_current <= 0;
}

function playerCanAttack() {
    return PLAYER.stamina_current >= PLAYER.stamina_cost &&
        PLAYER.health_current > 0;
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

function startGame() {
    renderPlayer();
    setupLevel();
    setInterval(gameLoop, 1000);
}

setTimeout(startGame, 1000);