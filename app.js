
// Trigger download of a JSON file
const downloadJson = function(data, filename) {
  const json = JSON.stringify(data);
  const blob = new Blob([json], {type: "application/json"});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Pick a color picker using browsers's built-in dialog
const pickColor = function(value, setter) {
  const input = document.createElement('input');
  input.type = 'color';
  // use the input itself to "resolve" the color
  input.style.color = value;
  input.value = rgb2hex(input.style.color);
  input.style.display = 'none';

  input.addEventListener('change', () => {
    setter(input.value);
  });

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

// Remove a CSSRule
const deleteCssRule = function(rule) {
  let rules = rule.parentStyleSheet.cssRules;
  for (let i = 0; i < rules.length; ++i) {
    if (rules[i] === rule) {
      rule.parentStyleSheet.deleteRule(i);
      break;
    }
  }
}

// Convert a CSS-style rgb color to an hex color
const rgb2hex = function(rgb) {
  return '#' + (rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
    .slice(1)
    .map(n => parseInt(n, 10).toString(16).padStart(2, '0'))
    .join('')
  );
}

const NES_COLORS = [
  null, //'#7C7C7C',
  '#0000FC',
  '#0000BC',
  '#4428BC',
  '#940084',
  '#A80020',
  '#A81000',
  '#881400',
  '#503000',
  '#007800',
  '#006800',
  '#005800',
  '#004058',
  '#000000',
  '#000000',
  '#000000',
  '#BCBCBC',
  '#0078F8',
  '#0058F8',
  '#6844FC',
  '#D800CC',
  '#E40058',
  '#F83800',
  '#E45C10',
  '#AC7C00',
  '#00B800',
  '#00A800',
  '#00A844',
  '#008888',
  '#000000',
  '#000000',
  '#000000',
  '#F8F8F8',
  '#3CBCFC',
  '#6888FC',
  '#9878F8',
  '#F878F8',
  '#F85898',
  '#F87858',
  '#FCA044',
  '#F8B800',
  '#B8F818',
  '#58D854',
  '#58F898',
  '#00E8D8',
  '#787878',
  '#000000',
  '#000000',
  '#FCFCFC',
  '#A4E4FC',
  '#B8B8F8',
  '#D8B8F8',
  '#F8B8F8',
  '#F8A4C0',
  '#F0D0B0',
  '#FCE0A8',
  '#F8D878',
  '#D8F878',
  '#B8F8B8',
  '#B8F8D8',
  '#00FCFC',
  '#F8D8F8',
  '#000000',
  '#000000',
]

class Utils {
  static frameRect(frame) {
    const sprites_x = frame.sprites.map(s => s.x);
    const sprites_y = frame.sprites.map(s => s.y);
    let left = Math.min.apply(Math, sprites_x);
    let right = Math.max.apply(Math, sprites_x) + 7;
    let top = Math.min.apply(Math, sprites_y);
    let bottom = Math.max.apply(Math, sprites_y) + 7;

    if (frame.hitbox) {
      left = Math.min(left, frame.hitbox.left);
      right = Math.max(right, frame.hitbox.right);
      top = Math.min(top, frame.hitbox.top);
      bottom = Math.max(bottom, frame.hitbox.bottom);
    }
    if (frame.hurtbox) {
      left = Math.min(left, frame.hurtbox.left);
      right = Math.max(right, frame.hurtbox.right);
      top = Math.min(top, frame.hurtbox.top);
      bottom = Math.max(bottom, frame.hurtbox.bottom);
    }

    // make sure it includes the (Y-shifted) origin
    left = Math.min(left, 0);
    right = Math.max(right, 0);
    top = Math.min(top, 16);
    bottom = Math.max(bottom, 16);

    return {
      x: left,
      y: top,
      width: right - left + 1,
      height: bottom - top + 1,
    }
  }

  static getTileByName(tree, name) {
    const tileset = tree.tileset;
    const idx = tileset.tilenames.indexOf(name);
    return tileset.tiles[idx];
  }

  static drawFrame(ctx, tree, frame, { zoom = 1, background, palettes }) {
    const rect = this.frameRect(frame);
    ctx.canvas.width = rect.width * zoom;
    ctx.canvas.height = rect.height * zoom;

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, rect.width * zoom, rect.height * zoom);

    const drawSpriteTile = (sprite, x, y) => {
      const tile = this.getTileByName(tree, sprite.tile);
      const palette = palettes[sprite.attr & 0x1];
      for (let [yy, row] of tile.representation.entries()) {
        for (let [xx, value] of row.entries()) {
          if (value === 0) {
            continue;  // transparent, don't draw
          }
          const pixel_x = x + (sprite.attr & 0x40 ? 7-xx : xx);
          const pixel_y = y + (sprite.attr & 0x80 ? 7-yy : yy);

          ctx.fillStyle = palette[value-1];
          ctx.fillRect(pixel_x * zoom, pixel_y * zoom, zoom, zoom);
        }
      }
    };

    for (let sprite of frame.sprites) {
      if (!sprite.foreground) {
        drawSpriteTile(sprite, sprite.x - rect.x, sprite.y - rect.y);
      }
    }
    for (let sprite of frame.sprites) {
      if (sprite.foreground) {
        drawSpriteTile(sprite, sprite.x - rect.x, sprite.y - rect.y);
      }
    }
  }

  static getPalettes(tree, swap) {
    return ['primary_colors', 'secondary_colors', 'alternate_colors'].map(k => (
      tree.color_swaps[k][swap].colors.map(v => NES_COLORS[v])
    ));
  }

  static getAllPalettes(tree) {
    return tree.color_swaps.primary_colors.map((_, swap) => this.getPalettes(tree, swap));
  }
}


class Conf {
  color = 0;  // manually selected color
  colorModifier = 0;  // color modified though keyboard modifiers
  colorSwap = 0;  // index of color swap
  bgColor = '#80ffff';  // background color, for transparency
  zoom = 16;  // zoom value (display pixel per tile pixel)
  tool = 'brush';  // active tool (brush, select)
  grid = 'tiles';  // grid mode (off, tiles, pixels)
  boxes = 'on';  // hitbox/hurtbox mode (off, on)

  static ZOOM_LEVELS = [2, 4, 8, 16, 24, 32, 48];

  drawColor() {
    return this.color ^ this.colorModifier;
  }

  zoomStep(step) {
    const LEVELS = this.constructor.ZOOM_LEVELS
    const zoom = LEVELS.reduce((prev, cur) => (
      Math.abs(cur - this.zoom) < Math.abs(prev - this.zoom) ? cur : prev
    ));
    let idx = LEVELS.indexOf(zoom) + step;
    idx = Math.min(Math.max(idx, 0), LEVELS.length - 1);  // clamp
    this.zoom = LEVELS[idx];
  }

  palettes(tree) {
    return Utils.getPalettes(tree, this.colorSwap);
  }
}


const app = Vue.createApp({
  data() {
    return {
      tree: null,
      conf: new Conf(),
    }
  },

  provide() {
    return {
      tree: Vue.computed(() => this.tree),
      conf: Vue.computed(() => this.conf),
    }
  },

  mounted() {
    this.fetchCharacterData();

    // Setup stylesheet for dynamic styling
    let style = document.createElement("style");
    document.head.appendChild(style);
    this.sheet = style.sheet;
    this.cssRules = {};

    this.$watch('tree', () => {
      this.updateColorSwapRule();
    });

    this.$watch('conf.colorSwap', () => this.updateColorSwapRule(), { immediate: true });
    this.$watch('conf.bgColor', () => this.updateBgColorRule(), { immediate: true });
    this.$watch('conf.zoom', () => this.updateZoomRule(), { immediate: true });
    this.$watch('conf.grid', (val, _) => {
      const classes = this.$refs.content.classList;
      for (let x of ['off', 'tiles', 'pixels']) {
        classes.toggle('tool-grid-' + x, val === x);
      }
    }, { immediate: true });
    this.$watch('conf.boxes', (val, _) => {
      const classes = this.$refs.content.classList;
      for (let x of ['off', 'on']) {
        classes.toggle('tool-boxes-' + x, val === x);
      }
    }, { immediate: true });
    this.$watch('conf.tool', (val, _) => {
      const classes = this.$refs.content.classList;
      for (let x of ['select', 'brush']) {
        classes.toggle('tool-' + x, val === x);
      }
    }, { immediate: true });
  },

  created() {
    // Setup handlers for changing color with Ctrl/Shift
    this.keymodifierHandle = (ev) => {
      if (ev.key === "Control" || ev.key === "Shift") {
        this.conf.colorModifier = ev.ctrlKey + 2 * ev.shiftKey;
      }
    }
    document.addEventListener('keydown', this.keymodifierHandle);
    document.addEventListener('keyup', this.keymodifierHandle);
  },

  beforeDestroy() {
    document.removeEventListener('keydown', this.keymodifierHandle);
    document.removeEventListener('keyup', this.keymodifierHandle);
  },

  methods: {
    fetchCharacterData() {
      console.debug("fetch character data");
      //TODO update URL, use local storage
      fetch('sample.json')
        .then(response => response.json())
        .then(data => { this.tree = data })
        .catch(err => console.error(err));
    },

    updateColorSwapRule() {
      if (!this.tree) {
        return;
      }
      const palettes = this.conf.palettes(this.tree);
      let rules = [];
      for (const [p, palette] of palettes.entries()) {
        for (const [c, color] of palette.entries()) {
          rules.push(`--color-p${p}-c${c+1}: ${color};`);
        }
      }
      this.setCssRule('palettes', `:root { ${rules.join('')} }`);
    },

    updateBgColorRule() {
      this.setCssRule('bgcolor', `:root { --color-none: ${this.conf.bgColor}; }`);
    },

    updateZoomRule() {
      this.setCssRule('zoom', `:root { --grid-zoom: ${this.conf.zoom}px; }`);
    },

    // Add or replace a CSS rule
    setCssRule(name, text) {
      if (this.cssRules[name] !== undefined) {
        deleteCssRule(this.cssRules[name]);
      }
      const i = this.sheet.insertRule(text);
      this.cssRules[name] = this.sheet.cssRules[i];
    },

    downloadAsJson() {
      console.debug("download character data as JSON");
      downloadJson(this.tree, this.tree.name + '.json');
    },
  },
});


app.component('toolbar', {
  props: ['conf'],
  inject: ['tree'],

  data() {
    return {
      palettePicker: false,
    }
  },

  methods: {
    changeGrid() {
      if (this.conf.grid == 'off') {
        this.conf.grid = 'tiles';
      } else if (this.conf.grid == 'tiles') {
        this.conf.grid = 'pixels';
      } else {
        this.conf.grid = 'off';
      }
    },

    changeBoxes() {
      if (this.conf.boxes == 'off') {
        this.conf.boxes = 'on';
      } else {
        this.conf.boxes = 'off';
      }
    },

    colorSwapPalettes() {
      return Utils.getAllPalettes(this.tree);
    },

    pickBackgroundColor() {
      pickColor(this.conf.bgColor, (color) => {
        this.conf.bgColor = color;
      });
    },
  },

  template: `
    <table>
      <tr
        v-for="c in [0, 1, 2, 3]"
        :class="{ 'active-color': c === conf.drawColor() }"
        @click="conf.color = c"
       >
        <td :class="c == 0 ? 'bg-none' : 'bg-p0-c'+c" />
        <td :class="c == 0 ? 'bg-none' : 'bg-p1-c'+c" />
      </tr>
    </table>
    <div>
      <button class="icon" @click="palettePicker = !palettePicker" title="Palette selection"><i class="fas fa-palette"/></button>
      <button class="icon" @click="pickBackgroundColor()" title="Background color"><i class="fas fa-image"/></button>
    </div>
    <div class="palette-picker" v-if="palettePicker">
      <table v-if="tree" v-for="(palettes, swap) of colorSwapPalettes()" @click="conf.colorSwap = swap; palettePicker = false">
        <tr v-for="i in [0, 1, 2]">
          <td :style="{ 'background-color': palettes[0][i] }" />
          <td :style="{ 'background-color': palettes[1][i] }" />
        </tr>
      </table>
    </div>
    <div>
      <button class="icon" @click="conf.zoomStep(-1)" title="Zoom-out"><i class="fas fa-search-minus"/></button>
      <button class="icon" @click="conf.zoomStep(1)" title="Zoom in"><i class="fas fa-search-plus"/></button>
    </div>
    <div>
      <button class="icon" @click="conf.tool = 'brush'" :class="{ enabled: conf.tool === 'brush' }" title="Brush"><i class="fas fa-paint-brush"/></button>
      <button class="icon" @click="conf.tool = 'select'" :class="{ enabled: conf.tool === 'select' }" title="Select"><i class="fas fa-mouse-pointer"/></button>
    </div>
    <div>
      <button class="icon" @click="changeGrid()" title="Grid style"><i class="fas fa-border-all"/></button>
      <button class="icon" @click="changeBoxes()" :class="{ enabled: conf.boxes === 'on' }" title="Hitbox/hurtbox"><i class="fas fa-vector-square"/></button>
    </div>
  `,
});


app.component('stb-tiles', {
  props: {
    tiles: {},
    palette: {default: 'default'}
  },
  inject: ['conf'],

  methods: {
    getColorClass(x, y) {
      return `bg-${this.palette}-c${this.getPixel(x, y)}`;
    },

    getTile(x, y) {
      return this.tiles[Math.floor(y / 8)][Math.floor(x / 8)];
    },

    getPixel(x, y) {
      return this.getTile(x, y).representation[y % 8][x % 8];
    },

    drawPixel(x, y) {
      this.getTile(x, y).representation[y % 8][x % 8] = this.conf.drawColor();
    },

    mouseMove(ev, x, y) {
      if (ev.buttons & 1) {
        this.drawPixel(x, y);
      }
    },
  },

  template: `
    <table class="canvas-grid">
      <tr v-for="y in Array(tiles.length * 8).keys()">
        <td v-for="x in Array(tiles[0].length * 8).keys()"
          :class="getColorClass(x, y)"
          @mousemove="mouseMove($event, x, y)"
          @click="drawPixel(x, y)"
         />
      </tr>
    </table>
  `,
});


app.component('stb-animation-frame', {
  props: ['frame'],
  inject: ['tree', 'conf'],

  data() {
    return {
      selectedSprite: null,
    }
  },

  computed: {
    rect() {
      return Utils.frameRect(this.frame);
    },
  },

  mounted() {
    this.$watch('frame.hurtbox.left', (newval, oldval) => { if (this.frame.hurtbox && newval > this.frame.hurtbox.right) this.frame.hurtbox.left = oldval });
    this.$watch('frame.hurtbox.top', (newval, oldval) => { if (this.frame.hurtbox && newval > this.frame.hurtbox.bottom) this.frame.hurtbox.top = oldval });
    this.$watch('frame.hurtbox.right', (newval, oldval) => { if (this.frame.hurtbox && newval < this.frame.hurtbox.left) this.frame.hurtbox.right = oldval });
    this.$watch('frame.hurtbox.bottom', (newval, oldval) => { if (this.frame.hurtbox && newval < this.frame.hurtbox.top) this.frame.hurtbox.bottom = oldval });
    this.$watch('frame.hitbox.left', (newval, oldval) => { if (this.frame.hitbox && newval > this.frame.hitbox.right) this.frame.hitbox.left = oldval });
    this.$watch('frame.hitbox.top', (newval, oldval) => { if (this.frame.hitbox && newval > this.frame.hitbox.bottom) this.frame.hitbox.top = oldval });
    this.$watch('frame.hitbox.right', (newval, oldval) => { if (this.frame.hitbox && newval < this.frame.hitbox.left) this.frame.hitbox.right = oldval });
    this.$watch('frame.hitbox.bottom', (newval, oldval) => { if (this.frame.hitbox && newval < this.frame.hitbox.top) this.frame.hitbox.bottom = oldval });
  },

  methods: {
    spriteTile(sprite) {
      const tileset = this.tree.tileset;
      const idx = tileset.tilenames.indexOf(sprite.tile);
      return tileset.tiles[idx];
    },

    spriteStyle(sprite) {
      const x = sprite.x - this.rect.x;
      const y = sprite.y - this.rect.y;
      const x8 = Math.floor(x / 8);
      const y8 = Math.floor(y / 8);

      const sx = sprite.attr & 0x40 ? -1 : 1;
      const sy = sprite.attr & 0x80 ? -1 : 1;

      return {
        left: `calc(${x} * var(--grid-zoom))`,
        top: `calc(${y} * var(--grid-zoom))`,
        //TODO Borders are not symmetrical (1px is odd), so this create artifacts
        transform: `scale(${sx},${sy})`,
      }
    },

    hurtboxStyle() {
      const x = this.frame.hurtbox.left - this.rect.x;
      const y = this.frame.hurtbox.top -this.rect.y;
      const w = this.frame.hurtbox.right - this.frame.hurtbox.left;
      const h = this.frame.hurtbox.bottom - this.frame.hurtbox.top;
      return {
        left: `calc(${x} * var(--grid-zoom))`,
        top: `calc(${y} * var(--grid-zoom))`,
        width: `calc(${w} * var(--grid-zoom))`,
        height: `calc(${h} * var(--grid-zoom))`,
      }
    },

    boxStyle(box) {
      const x = box.left - this.rect.x;
      const y = box.top -this.rect.y;
      const w = box.right - box.left;
      const h = box.bottom - box.top;
      return {
        left: `calc(${x} * var(--grid-zoom))`,
        top: `calc(${y} * var(--grid-zoom))`,
        width: `calc(${w} * var(--grid-zoom))`,
        height: `calc(${h} * var(--grid-zoom))`,
      }
    },

    originStyle() {
      const x = -this.rect.x;
      const y = -this.rect.y;
      return {
        left: `calc((${x} - 0.2) * var(--grid-zoom))`,
        top: `calc((${y} + 16 - 0.2) * var(--grid-zoom))`,
        width: `calc(0.4 * var(--grid-zoom))`,
        height: `calc(0.4 * var(--grid-zoom))`,
      }
    },

    toggleHurtbox(value) {
      if ((this.frame.hurtbox !== null) === value) {
        return;  // no changes
      }
      if (value) {
        this.frame.hurtbox = {
          type: 'animation_hurtbox',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
        };
      } else {
        this.frame.hurtbox = null;
      }
    },

    toggleHitbox(value) {
      if ((this.frame.hitbox !== null) === value) {
        return;  // no changes
      }
      if (value) {
        this.frame.hitbox = {
          type: 'animation_hitbox',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          //TODO
          base_h: 0,
          base_v: 0,
          force_h: 0,
          force_v: 0,
          damages: 1,
          enabled: true,
        };
      } else {
        this.frame.hitbox = null;
      }
    },

    setHurtboxCoord(name, value) {
      console.log("hurtbox", name, value);
      let box = this.frame.hurtbox;
      if (name == 'left') {
        if (value > box.right) return;
      } else if (name == 'top') {
        if (value > box.bottom) return;
      } if (name == 'right') {
        if (value < box.left) return;
      } else if (name == 'bottom') {
        if (value < box.top) return;
      }
      console.log("set value");
      box[name] = value;
    },
  },

  template: `
    <div class="animation-frame">
      <div class="frame-canvas">
        <table class="canvas-grid background bg-none">
          <tr v-for="y in Array(rect.height).keys()">
            <td v-for="x in Array(rect.width).keys()" />
          </tr>
        </table>
        <stb-tiles
          v-for="sprite of frame.sprites"
          :class="['frame-sprite', { selected: sprite === selectedSprite, foreground: sprite.foreground }]"
          :tiles.sync="[[spriteTile(sprite)]]"
          :palette="'p' + (sprite.attr & 0x1)"
          :style="spriteStyle(sprite)"
          @click.capture="conf.tool === 'select' && (selectedSprite = sprite, $event.stopPropagation())"
          @mousemove.capture="conf.tool === 'select' && $event.stopPropagation()"
          />
        <div v-if="frame.hitbox" class="frame-hitbox" :style="boxStyle(frame.hitbox)" />
        <div v-if="frame.hurtbox" class="frame-hurtbox" :style="boxStyle(frame.hurtbox)" />
        <div class="frame-origin" :style="originStyle()"/>
      </div>
      <div class="frame-info">
        <div><label><input type="checkbox" :checked="frame.hurtbox !== null" @change="toggleHurtbox($event.target.checked)" /> Hurtbox</label></div>
        <div v-if="frame.hurtbox !== null">
          <label>X0: <input v-model="frame.hurtbox.left" type="number" class="coordinate" /></label><br/>
          <label>Y0: <input v-model="frame.hurtbox.top" type="number" class="coordinate" /></label><br/>
          <label>X1: <input v-model="frame.hurtbox.right" type="number" class="coordinate" /></label><br/>
          <label>Y1: <input v-model="frame.hurtbox.bottom" type="number" class="coordinate" /></label><br/>
        </div>
        <div><label><input type="checkbox" :checked="frame.hitbox !== null" @change="toggleHitbox($event.target.checked)" /> Hitbox</label></div>
        <div v-if="frame.hitbox !== null">
          <label>X0: <input v-model="frame.hitbox.left" type="number" class="coordinate" /></label><br/>
          <label>Y0: <input v-model="frame.hitbox.top" type="number" class="coordinate" /></label><br/>
          <label>X1: <input v-model="frame.hitbox.right" type="number" class="coordinate" /></label><br/>
          <label>Y1: <input v-model="frame.hitbox.bottom" type="number" class="coordinate" /></label><br/>
          <label>Damages: <input v-model="frame.hitbox.damages" type="number" class="damages" /></label><br/>
          <label>Base H: <input v-model="frame.hitbox.base_h" type="number" class="force" /></label><br/>
          <label>Base V: <input v-model="frame.hitbox.base_v" type="number" class="force" /></label><br/>
          <label>Force H: <input v-model="frame.hitbox.force_h" type="number" class="force" /></label><br/>
          <label>Force V: <input v-model="frame.hitbox.force_v" type="number" class="force" /></label><br/>
          <label><input type="checkbox" v-model="frame.hitbox.enabled" /> Enabled</label><br/>
        </div>
        <stb-sprite-info v-if="selectedSprite" :sprite="selectedSprite" />
      </div>
    </div>
  `,
});

app.component('stb-sprite-info', {
  props: ['sprite'],

  template: `
    <div class="sprite-info">
      <label>X: <input v-model="sprite.x" type="number" class="coordinate" /></label>
      <label>Y: <input v-model="sprite.y" type="number" class="coordinate" /></label>
      <button class="icon" @click="sprite.attr ^= 0x40" :class="{ enabled: sprite.attr & 0x40 }" title="Horizontal flip"><i class="fas fa-arrows-alt-h"/></button>
      <button class="icon" @click="sprite.attr ^= 0x80" :class="{ enabled: sprite.attr & 0x80 }" title="Vertical flip"><i class="fas fa-arrows-alt-v"/></button>
      <button class="icon" @click="sprite.foreground = !sprite.foreground" :class="{ enabled: sprite.foreground }" title="Foreground"><i class="fas fa-layer-group"/></button>
    </div>
  `,
});

app.component('stb-frame-thumbnail', {
  props: ['frame'],
  inject: ['tree', 'conf'],

  methods: {
    drawFrame() {
      const ctx = this.$refs.canvas.getContext('2d');
      const palettes = this.conf.palettes(this.tree);
      return Utils.drawFrame(ctx, this.tree, this.frame, { zoom: 2, background: this.conf.bgColor, palettes });
    },
  },

  mounted() {
    Vue.watchEffect(() => this.drawFrame());
  },

  template: `
    <canvas ref="canvas" class="frame-thumbnail" />
  `,
});


const IllustrationsTab = {
  inject: ['tree'],

  methods: {
    illustrationTiles(illustration, width, height) {
      return Array.from({length: height}, (_, y) => Array.from({length: width}, (_, x) => illustration.tiles[y * width + x]));
    },
  },

  template: `
    <div v-if="tree" class="tab-illustrations">
      <h2>Token</h2> 
      <stb-tiles :tiles.sync="illustrationTiles(tree.illustration_token, 1, 1)" class="bg-none" />
      <h2>Small </h2> 
      <stb-tiles :tiles.sync="illustrationTiles(tree.illustration_small, 2, 2)" class="bg-none" />
      <h2>Large</h2> 
      <stb-tiles :tiles.sync="illustrationTiles(tree.illustration_large, 6, 8)" class="bg-none" />
    </div>
  `,
}


const TilesetTab = {
  inject: ['tree'],

  methods: {
    //XXX Needed?
    tileAnimations(i) {
      const name = this.tree.tileset.tilenames[i];
      const useTile = anim => anim.frames.some(frame => frame.sprites.some(sprite => sprite.tile === name));
      let animations = this.tree.animations.filter(useTile);
      for (const item of Object.values(this.tree)) {
        if (item.type === 'animation' && useTile(item)) {
          animations.push(item);
        }
      }
      return animations;
    },
  },

  template: `
    <div v-if="tree" class="tab-tileset">
      <h2>Tileset</h2>
      <div class="tileset-tile" v-for="(tile, i) in tree.tileset.tiles">
        <stb-tiles :tiles.sync="[[tile]]" class="bg-none" />
        <!-- XXX
        <ul class="tileset-tile-users">
          <li v-for="anim in tileAnimations(i)">{{ anim.name }}</li>
        </ul>
        -->
      </div>
    </div>
  `,
}


const AnimationsTab = {
  inject: ['tree'],

  methods: {
  },

  //TODO include mandatory animations?
  template: `
    <div v-if="tree">
      <h2>Animations</h2>
      <ul>
        <li v-for="anim in tree.animations">
          <router-link :to="'/animations/'+anim.name">{{ anim.name }}</router-link>
        </li>
      </ul>
    </div>
  `,
}


const AnimationTab = {
  inject: ['tree'],

  data() {
    return {
      animation: null,
      selectedFrame: null,
    }
  },

  created() {
    this.$watch(() => this.$route.params, () => this.updateAnimation());
    this.$watch('tree', () => this.updateAnimation());
    this.updateAnimation();
  },
 
  methods: {
    updateAnimation() {
      if (this.tree) {
        this.animation = this.tree.animations.find(anim => anim.name === this.$route.params.name);
      }
    },
  },

  //TODO frame selector
  template: `
    <div v-if="animation">
      <h2>Animation</h2>
      <div>
        <label>Name: <input v-model="animation.name" style="width: 40%;"/></label>
      </div>
      <div>
        <stb-frame-thumbnail
          v-for="frame of animation.frames"
          :frame="frame"
          @click="selectedFrame = frame"
         />
      </div>
      <div>
        <stb-animation-frame v-if="selectedFrame" :frame="selectedFrame" />
      </div>
    </div>
  `,
}


const HelpTab = {
  template: `
    <ul>
      <li>Choose elements to edit from the left column</li>
      <li>Click "Download JSON" button to download character data as JSON</li>
      <li>When drawing, use Control and/or Shift to modify color bitmask</li>
    </ul>
  `,
}


const routes = [
  { path: '/illustrations', component: IllustrationsTab },
  { path: '/tileset', component: TilesetTab },
  { path: '/animations', component: AnimationsTab },
  { path: '/animations/:name', component: AnimationTab },
  { path: '/help', component: HelpTab },
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
})

app.use(router);

app.config.unwrapInjectedRef = true;
app.mount('#app');

