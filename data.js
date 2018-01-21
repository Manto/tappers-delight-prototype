PLAYER = {
  stamina_max: 20,
  stamina_current: 20,
  stamina_regen: 0.2,
  health_max: 20,
  health_current: 20,
  health_regen: 0.2,
  health_regen_current: 0,
  health_regen_acceleration: 1,
  power: 5,
  stamina_cost: 1,
  coin: 0
};

UNIT = 50;

BOARD = {
  box_width: 8,
  box_height: 10
};

LEVEL_BOXES = [
  {
    name: "one",
    type: "yard",
    health_max: 50,
    health_current: 50,
    health_regen: 1,
    health_regen_current: 0,
    health_regen_acceleration: 1.2,
    damage: 0,
    coin: 50,
    box_width: 2,
    box_height: 1,
    box_x: 0,
    box_y: 0
  },
  {
    name: "two",
    type: "yard",
    health_max: 75,
    health_current: 75,
    health_regen: 1,
    health_regen_current: 0,
    health_regen_acceleration: 1.2,
    damage: 0,
    coin: 20,
    box_width: 3,
    box_height: 2,
    box_x: 2,
    box_y: 0
  },
  {
    name: "three",
    type: "yard",
    health_max: 50,
    health_current: 50,
    health_regen: 1,
    health_regen_current: 0,
    health_regen_acceleration: 1.2,
    damage: 2,
    coin: 30,
    box_width: 2,
    box_height: 1,
    box_x: 0,
    box_y: 1
  },
  {
    name: "stamina shop",
    type: "shop",
    cost_current: 10,
    cost_acceleration: 1.25,
    boost: {
      stamina_max: 1
    },
    box_width: 3,
    box_height: 1,
    box_x: 0,
    box_y: 2
  },
  {
    name: "health shop",
    type: "shop",
    cost_acceleration: 1.25,
    cost_current: 10,
    boost: {
      health_max: 1
    },
    box_width: 3,
    box_height: 1,
    box_x: 0,
    box_y: 3
  },
  {
    name: "power shop",
    type: "shop",
    cost_acceleration: 1.25,
    cost_current: 100,
    boost: {
      power: 1
    },
    box_width: 3,
    box_height: 1,
    box_x: 0,
    box_y: 4
  }
];
