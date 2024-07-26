export var CAMERA = {
  POSITION: {
    DEFAULT: [18, 7, 22],
    VCARD_ACTIVE: [18, 7.5, 22],
    LANDSCAPE: [0, 21, 0],
    PORTRAIT: [0, 21, 0]
  },
  ROTATION: {
    DEFAULT: [0, 0, 0],
    VCARD_ACTIVE: [0, 0, 0],
    LANDSCAPE: [0, 0, 0],
    PORTRAIT: [0, 0, 0]
  },
  LOOK_AT: {
    DEFAULT: [0, 2, 0],
    VCARD_ACTIVE: [0, 1, 0],
    LANDSCAPE: [-70, -1e5, 26.5],
    PORTRAIT: [12, -1e5, -13.86]
  },
  FOV: 50,
  NEAR: 0.1,
  FAR: 100
}

export var VCARD = {
  POSITION: {
    DEFAULT: [0, 2.5, 0],
    ACTIVE: [0, 3.35, 0]
  },
  ROTATION: {
    DEFAULT: [0, 0.75, 0],
    ACTIVE: [0.05, 0.6, -0.32]
  },
  SCALE: 1,
  GEOMETRY: [9, 5, 0.05]
}

export var PAPER = {
  POSITION: {
    DEFAULT: [0, 0.05, 0]
  },
  ROTATION: {
    DEFAULT: [0, 4, 0],
    LANDSCAPE: [0, 3.5, 0]
  },
  GEOMETRY: [14.8, 0.05, 21]
}

export var COFFEE = {
  POSITION: {
    DEFAULT: [-12, -0.5, 2]
  },
  ROTATION: {
    DEFAULT: [0, 1.2, 0]
  },
  SCALE: 1
}

export var COFFEE_INNER = {
  POSITION: {
    DEFAULT: [0, 5.6, 0]
  },
  ROTATION: {
    DEFAULT: [Math.PI / 2, 0, 0]
  },
  SCALE: 1
}

export var CUP = {
  POSITION: {
    DEFAULT: [0, 0, 0]
  },
  ROTATION: {
    DEFAULT: [0, 0, 0]
  },
  SCALE: 64
}

export var PEN_COMPOSITION = {
  POSITION: {
    DEFAULT: [10, 0.01, 2]
  },
  ROTATION: {
    DEFAULT: [0, 1.5, 0]
  },
  SCALE: 1
}

export var PEN_HOLDER = {
  POSITION: {
    DEFAULT: [0, 0, 0]
  },
  ROTATION: {
    DEFAULT: [0, 0, 0]
  },
  SCALE: 0.04
}

export var PENCIL = {
  POSITION: {
    DEFAULT: [0.37, 4, 1]
  },
  ROTATION: {
    DEFAULT: [0.41, 0.7, 0]
  },
  SCALE: 0.015
}

export var DESK_LAMP = {
  POSITION: {
    DEFAULT: [-1, 0, -17]
  },
  ROTATION: {
    DEFAULT: [0, 0, 0]
  },
  SCALE: 0.3
}

export var PAPER_PLANE = {
  POSITION: {
    DEFAULT: [1.2, 0.27, -10]
  },
  ROTATION: {
    DEFAULT: [0, 0.7, 0.32]
  },
  SCALE: 4.7
}

export var COLORS = {
  LIGHT: '#fff',
  GROW: '#555',
  BG: '#efefef',
  GRAY: '#ccc'
}

export var LIGHT = {
  SPOT: {
    decay: 0,
    position: [5, -5, 5],
    intensity: 0.5,
    penumbra: 1,
    castShadow: true
  },
  POINT: {
    decay: 0,
    position: [-10, -10, -10]
  },
  DIRECTIONAL: [
    {
      POSITION: [5, 5, 5]
    },
    {
      POSITION: [15, 22, 25]
    }
  ],
  LAMP: {
    color: 0xffa95c,
    intensity: 1e2,
    position: [-5, 9, -12],
    angle: Math.PI / 6,
    penumbra: 0.1,
    decay: 2,
    distance: 60
  }
}

export var SHADOWS = [
  {
    scale: 50,
    blur: 3,
    far: 1.5,
    opacity: 0.25
  },
  {
    scale: 5,
    blur: 10,
    far: 2,
    opacity: 0.15
  },
  {
    scale: 10,
    blur: 2,
    far: 5,
    opacity: 0.5
  }
]
