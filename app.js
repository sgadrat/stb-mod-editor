
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

// Deep clone data using JSON serialization
const cloneData = function(data) {
  return JSON.parse(JSON.stringify(data));
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
  '#747474',
  '#24188C',
  '#0000A8',
  '#44009C',
  '#8C0074',
  '#A80010',
  '#A40000',
  '#7C0800',
  '#402C00',
  '#004400',
  '#005000',
  '#003C14',
  '#183C5C',
  '#000000',
  '#000000',
  '#000000',
  '#BCBCBC',
  '#0070EC',
  '#2038EC',
  '#8000F0',
  '#BC00BC',
  '#E40058',
  '#D82800',
  '#C84C0C',
  '#887000',
  '#009400',
  '#00A800',
  '#009038',
  '#008088',
  '#000000',
  '#000000',
  '#000000',
  '#FCFCFC',
  '#3CBCFC',
  '#5C94FC',
  '#CC88FC',
  '#F478FC',
  '#FC74B4',
  '#FC7460',
  '#FC9838',
  '#F0BC3C',
  '#80D010',
  '#4CDC48',
  '#58F898',
  '#00E8D8',
  '#787878',
  '#000000',
  '#000000',
  '#FCFCFC',
  '#A8E4FC',
  '#C4D4FC',
  '#D4C8FC',
  '#FCC4FC',
  '#FCC4D8',
  '#FCBCB0',
  '#FCD8A8',
  '#FCE4A0',
  '#E0FCA0',
  '#A8F0BC',
  '#B0FCCC',
  '#9CFCF0',
  '#C4C4C4',
  '#000000',
  '#000000',
]


const PALETTE_NAMES = ['primary_colors', 'secondary_colors', 'alternate_colors']
const MANDATORY_ANIMATION_NAMES = ['menu_select_animation', 'defeat_animation', 'victory_animation']

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

  static getAnimationByName(tree, name) {
    for (let k of MANDATORY_ANIMATION_NAMES) {
      if (tree[k].name == name) {
        return tree[k];
      }
    }
    return tree.animations.find(anim => anim.name === name);
  }

  static getTileByName(tree, name) {
    const tileset = tree.tileset;
    const idx = tileset.tilenames.indexOf(name);
    return tileset.tiles[idx];
  }

  static drawSingleTile(ctx, tree, tile, { zoom = 1, palette, x = 0, y = 0, flip_x = false, flip_y = false }) {
    for (let [yy, row] of tile.representation.entries()) {
      for (let [xx, value] of row.entries()) {
        if (value === 0) {
          continue;  // transparent, don't draw
        }
        const pixel_x = x + (flip_x ? 7-xx : xx);
        const pixel_y = y + (flip_y ? 7-yy : yy);

        ctx.fillStyle = palette[value-1];
        ctx.fillRect(pixel_x * zoom, pixel_y * zoom, zoom, zoom);
      }
    }
  }

  static drawTile(ctx, tree, tile, { zoom = 1, background, palette }) {
    ctx.canvas.width = 8 * zoom;
    ctx.canvas.height = 8 * zoom;

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 8 * zoom, 8 * zoom);

    this.drawSingleTile(ctx, tree, tile, { zoom, palette })
  }

  static drawSingleSprite(ctx, tree, sprite, { zoom = 1, palettes, x = 0, y = 0 }) {
      const tile = this.getTileByName(tree, sprite.tile);
      const palette = palettes[sprite.attr & 0x1];
      const flip_x = sprite.attr & 0x40;
      const flip_y = sprite.attr & 0x80;
      this.drawSingleTile(ctx, tree, tile, { zoom, palette, x, y, flip_x, flip_y })
  }

  static drawSprite(ctx, tree, sprite, { zoom = 1, background, palettes }) {
    ctx.canvas.width = 8 * zoom;
    ctx.canvas.height = 8 * zoom;

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 8 * zoom, 8 * zoom);

    this.drawSingleSprite(ctx, tree, sprite, { zoom, palettes })
  }

  static drawFrame(ctx, tree, frame, { zoom = 1, background, palettes }) {
    const rect = this.frameRect(frame);
    ctx.canvas.width = rect.width * zoom;
    ctx.canvas.height = rect.height * zoom;

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, rect.width * zoom, rect.height * zoom);

    for (let sprite of frame.sprites) {
      if (!sprite.foreground) {
        const x = sprite.x - rect.x;
        const y = sprite.y - rect.y;
        this.drawSingleSprite(ctx, tree, sprite, { zoom, palettes, x, y  });
      }
    }
    for (let sprite of frame.sprites) {
      if (sprite.foreground) {
        const x = sprite.x - rect.x;
        const y = sprite.y - rect.y;
        this.drawSingleSprite(ctx, tree, sprite, { zoom, palettes, x, y  });
      }
    }
  }

  static getPalettes(tree, swap) {
    return PALETTE_NAMES.map(k => (
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
  bgColor = '#3CBCFC';  // background color, for transparency
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
    this.fetchCharacterData('data/sinbad.json');  //TODO change default

    // Setup stylesheet for dynamic styling
    let style = document.createElement("style");
    document.head.appendChild(style);
    this.sheet = style.sheet;
    this.cssRules = {};

    Vue.watchEffect(() => this.updateColorSwapRule());

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
    fetchCharacterData(url) {
      console.debug(`fetch character data: ${url}`);
      //TODO update URL, use local storage
      fetch(url)
        .then(response => response.json())
        .then(data => { this.tree = data })
        .catch(err => console.error(err));
    },

    loadCharacterData(url) {
      this.fetchCharacterData(url);
      this.$router.push('/');
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
    <table class="color-picker">
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


app.component('stb-tile', {
  props: ['tile', 'palette', 'flip'],
  inject: ['conf'],

  methods: {
    getColorClass(x, y) {
      const px = this.flip?.[0] ? 7 - x : x;
      const py = this.flip?.[1] ? 7 - y : y;
      const pixel = this.tile.representation[py][px];
      return `bg-${this.palette}-c${pixel}`;
    },

    drawPixel(x, y) {
      const px = this.flip?.[0] ? 7 - x : x;
      const py = this.flip?.[1] ? 7 - y : y;
      this.tile.representation[py][px] = this.conf.drawColor();
    },

    mouseMove(ev, x, y) {
      if (ev.buttons & 1) {
        this.drawPixel(x, y);
      }
    },
  },

  template: `
    <table class="stb-tile">
      <tr v-for="(_, y) in 8">
        <td v-for="(_, x) in 8"
          :class="getColorClass(x, y)"
          @mousemove="mouseMove($event, x, y)"
          @click="drawPixel(x, y)"
         />
      </tr>
    </table>
  `,
});

app.component('stb-illustration', {
  props: ['tiles', 'width', 'height', 'palette'],
  inject: ['conf'],

  methods: {
    getStyle() {
      return {
        'grid-template-columns': `repeat(${this.width}, max-content)`,
        'grid-template-rows': `repeat(${this.height}, max-content)`,
      }
    },
  },

  template: `
    <div class="stb-illustration" :style="getStyle()">
      <stb-tile v-for="tile in tiles" :tile.sync="tile" :palette="palette" />
    </div>
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

      return {
        left: `calc(${x} * var(--grid-zoom))`,
        top: `calc(${y} * var(--grid-zoom))`,
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
      box[name] = value;
    },

    newSprite() {
      this.frame.sprites.push({
        type: 'animation_sprite',
        tile: this.tree.tileset.tilenames[0],
        attr: 0,
        foreground: false,
        x: 0,
        y: 0,
      });
    },

    dragSprite(ev, idx) {
      ev.dataTransfer.dropEffect = 'move';
      ev.dataTransfer.effectAllowed = 'copyMove';
      ev.dataTransfer.setData('idx', idx);
      ev.dataTransfer.setData('group', 'sprite');
    },

    dragSpriteOver(ev, effect) {
      if (ev.dataTransfer.getData('group') === 'sprite') {
        ev.dataTransfer.dropEffect = effect;
      } else {
        ev.dataTransfer.dropEffect = 'none';
      }
    },

    dropSprite(ev, dst) {
      if (ev.dataTransfer.getData('group') === 'sprite') {
        const src = parseInt(ev.dataTransfer.getData('idx'));
        const sprites = this.frame.sprites;
        if (src !== dst) {
          sprites.splice(dst, 0, sprites[src]);
          sprites.splice(src < dst ? src : src + 1, 1);
        }
      }
    },

    dropNewSprite(ev) {
      if (ev.dataTransfer.getData('group') === 'sprite') {
        const src = parseInt(ev.dataTransfer.getData('idx'));
        const sprites = this.frame.sprites;
        sprites.push(cloneData(sprites[src]));
      }
    },
  },

  template: `
    <div class="animation-frame">
      <div class="frame-canvas">
        <table class="stb-tile background bg-none">
          <tr v-for="y in rect.height">
            <td v-for="x in rect.width"
              @click.capture="conf.tool === 'select' && (selectedSprite = null, $event.stopPropagation())"
             />
          </tr>
        </table>
        <stb-tile
          v-for="sprite of frame.sprites"
          :class="['frame-sprite', { selected: sprite === selectedSprite, foreground: sprite.foreground }]"
          :tile.sync="spriteTile(sprite)"
          :flip="[sprite.attr & 0x40, sprite.attr & 0x80]"
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
        <div>
          <label>Duration: <input v-model="frame.duration" type="number" style="width: 3em" /> frames</label>
        </div>
        <div class="box-header">
          <label><input type="checkbox" :checked="frame.hurtbox !== null" @change="toggleHurtbox($event.target.checked)" /> Hurtbox</label>
        </div>
        <div v-if="frame.hurtbox !== null">
          Area: (<input v-model="frame.hurtbox.left" type="number" class="coordinate" />,<input v-model="frame.hurtbox.top" type="number" class="coordinate" />)
          to (<input v-model="frame.hurtbox.right" type="number" class="coordinate" />,<input v-model="frame.hurtbox.bottom" type="number" class="coordinate" />)
        </div>
        <div class="box-header">
          <label><input type="checkbox" :checked="frame.hitbox !== null" @change="toggleHitbox($event.target.checked)" /> Hitbox</label>
        </div>
        <div v-if="frame.hitbox !== null">
          Area: (<input v-model="frame.hitbox.left" type="number" class="coordinate" />,<input v-model="frame.hitbox.top" type="number" class="coordinate" />)
          to (<input v-model="frame.hitbox.right" type="number" class="coordinate" />,<input v-model="frame.hitbox.bottom" type="number" class="coordinate" />)
          <br/>
          <label>Damages: <input v-model="frame.hitbox.damages" type="number" class="damages" /> %</label>
          <br/>
          Base knockback: (<input v-model="frame.hitbox.base_h" type="number" class="force" />,<input v-model="frame.hitbox.base_v" type="number" class="force" />)
          <br/>
          Knockback scaling: (<input v-model="frame.hitbox.force_h" type="number" class="force" />,<input v-model="frame.hitbox.force_v" type="number" class="force" />) per %
          <br/>
          <label><input type="checkbox" v-model="frame.hitbox.enabled" /> Enabled</label><br/>
        </div>
        <hr/>
        <div class="sprite-thumbnails">
          <template v-for="(sprite, idx) in frame.sprites">
            <div class="dragdrop-divider"
              @drop="dropSprite($event, idx)"
              @dragover.prevent="dragSpriteOver($event, 'move')"
              ></div>
            <stb-sprite-thumbnail
              :sprite="sprite"
              :class="{ selected: selectedSprite === sprite }"
              @click="selectedSprite = sprite"
              draggable="true"
              @dragstart="dragSprite($event, idx)"
             />
          </template>
          <div class="dragdrop-divider"
            @drop="dropSprite($event, idx)"
            @dragover.prevent="dragSpriteOver($event, 'move')"
           ></div>
          <div class="sprite-thumbnails-new"
            @click="newSprite()"
            @drop="dropNewSprite($event)"
            @dragover.prevent="dragSpriteOver($event, 'copy')"
           >
            <i class="fas fa-plus-square" />
        </div>
        </div>
        <hr/>
        <stb-sprite-info v-if="selectedSprite" :sprite="selectedSprite" />
      </div>
    </div>
  `,
});

app.component('stb-sprite-info', {
  props: ['sprite'],
  inject: ['tree'],

  template: `
    <div class="sprite-info">
      Position: (<input v-model="sprite.x" type="number" class="coordinate" />,<input v-model="sprite.y" type="number" class="coordinate" />)
      <br/>
      <button class="icon" @click="sprite.attr ^= 0x40" :class="{ enabled: sprite.attr & 0x40 }" title="Horizontal flip"><i class="fas fa-arrows-alt-h"/></button>
      <button class="icon" @click="sprite.attr ^= 0x80" :class="{ enabled: sprite.attr & 0x80 }" title="Vertical flip"><i class="fas fa-arrows-alt-v"/></button>
      <button class="icon" @click="sprite.attr ^= 0x01" :class="{ enabled: sprite.attr & 0x01 }" title="Palette"><i class="fas fa-palette"/></button>
      <button class="icon" @click="sprite.foreground = !sprite.foreground" :class="{ enabled: sprite.foreground }" title="Foreground"><i class="fas fa-layer-group"/></button>
      <div class="sprite-tile-picker">
        <stb-tile-thumbnail v-for="(name, idx) in tree.tileset.tilenames"
          :tile="tree.tileset.tiles[idx]"
          @click="sprite.tile = name; tilePicker = false"
          :class="{ selected: sprite.tile === name }"
         />
      </div>
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
    <canvas ref="canvas" class="stb-frame-thumbnail" />
  `,
});

app.component('stb-tile-thumbnail', {
  props: ['tile'],
  inject: ['tree', 'conf'],

  methods: {
    drawTile() {
      const ctx = this.$refs.canvas.getContext('2d');
      const palette = this.conf.palettes(this.tree)[0];
      return Utils.drawTile(ctx, this.tree, this.tile, { zoom: 4, background: this.conf.bgColor, palette });
    },
  },

  mounted() {
    Vue.watchEffect(() => this.drawTile());
  },

  template: `
    <canvas ref="canvas" class="stb-tile-thumbnail" />
  `,
});

app.component('stb-sprite-thumbnail', {
  props: ['sprite'],
  inject: ['tree', 'conf'],

  methods: {
    drawSprite() {
      const ctx = this.$refs.canvas.getContext('2d');
      const palettes = this.conf.palettes(this.tree);
      return Utils.drawSprite(ctx, this.tree, this.sprite, { zoom: 4, background: this.conf.bgColor, palettes });
    },
  },

  mounted() {
    Vue.watchEffect(() => this.drawSprite());
  },

  template: `
    <canvas ref="canvas" class="stb-sprite-thumbnail" />
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
      <stb-illustration :tiles.sync="tree.illustration_token.tiles" width="1" height="1" palette="illu-token" />
      <h2>Small </h2> 
      <stb-illustration :tiles.sync="tree.illustration_small.tiles" width="2" height="2" palette="illu-small" />
      <h2>Large</h2> 
      <stb-illustration :tiles.sync="tree.illustration_large.tiles" width="6" height="8" palette="illu-large" />
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
      <div class="tileset-tiles">
        <div class="tileset-tile" v-for="(tile, i) in tree.tileset.tiles">
          <stb-tile :tile.sync="tile" palette="p0" class="bg-none" />
          <!-- XXX
          <ul class="tileset-tile-users">
            <li v-for="anim in tileAnimations(i)">{{ anim.name }}</li>
          </ul>
          -->
        </div>
      </div>
    </div>
  `,
}


const AnimationsTab = {
  inject: ['tree'],

  methods: {
    getMandatoryAnimations() {
      return MANDATORY_ANIMATION_NAMES.map(x => this.tree[x]);
    },
  },

  template: `
    <div v-if="tree">
      <h2>Animations</h2>
      <ul>
        <li v-for="anim in getMandatoryAnimations()">
          <router-link :to="'/animations/'+anim.name">{{ anim.name }}</router-link>
        </li>
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
      if (!this.tree) {
        return;
      }
      if (!this.$route.path.startsWith('/animations')) {
        return;
      }
      this.animation = Utils.getAnimationByName(this.tree, this.$route.params.name);
      if (this.animation === undefined) {
        this.$router.push('/animations');
        return;
      }
      const frame = this.$route.params.frame;
      if (frame !== undefined) {
        this.selectedFrame = this.animation.frames[frame];
        if (this.selectedFrame === undefined) {
          this.selectedFrame = null;
          this.$router.replace(`/animations/${this.animation.name}`);
        }
      }
    },

    updateFrame(idx) {
      this.$router.replace(`/animations/${this.animation.name}/${idx}`);
    },

    newFrame() {
      const frames = this.animation.frames;
      frames.push({
        type: 'animation_frame',
        duration: 1,
        sprites: [{
          type: 'animation_sprite',
          tile: this.tree.tileset.tilenames[0],
          attr: 0,
          foreground: false,
          x: 0,
          y: 0,
        }],
        hitbox: null,
        hurtbox: null,
      });
      this.updateFrame(frames.length-1);
    },

    dragFrame(ev, idx) {
      ev.dataTransfer.dropEffect = 'move';
      ev.dataTransfer.effectAllowed = 'copyMove';
      ev.dataTransfer.setData('idx', idx);
      ev.dataTransfer.setData('group', 'frame');
    },

    dragFrameOver(ev, effect) {
      if (ev.dataTransfer.getData('group') === 'frame') {
        ev.dataTransfer.dropEffect = effect;
      } else {
        ev.dataTransfer.dropEffect = 'none';
      }
    },

    dropFrame(ev, dst) {
      if (ev.dataTransfer.getData('group') === 'frame') {
        const src = parseInt(ev.dataTransfer.getData('idx'));
        const frames = this.animation.frames;
        if (src !== dst) {
          frames.splice(dst, 0, frames[src]);
          frames.splice(src < dst ? src : src + 1, 1);
        }
        if (this.selectedFrame) {
          // Update the URL (index may have changed)
          this.updateFrame(this.animation.frames.indexOf(this.selectedFrame));
        }
      }
    },

    dropNewFrame(ev) {
      if (ev.dataTransfer.getData('group') === 'frame') {
        const src = parseInt(ev.dataTransfer.getData('idx'));
        const frames = this.animation.frames;
        frames.push(cloneData(frames[src]));
      }
    },
  },

  template: `
    <div v-if="animation">
      <h2>Animation</h2>
      <div>
        <label>Name: <input v-model="animation.name" style="width: 40%;"/></label>
      </div>
      <div class="frame-thumbnails">
        <template v-for="(frame, idx) in animation.frames">
          <div class="dragdrop-divider"
            @drop="dropFrame($event, idx)"
            @dragover.prevent="dragFrameOver($event, 'move')"
            ></div>
          <stb-frame-thumbnail
            :frame="frame"
            :class="{ selected: selectedFrame === frame }"
            @click="updateFrame(idx)"
            draggable="true"
            @dragstart="dragFrame($event, idx)"
           />
        </template>
        <div class="dragdrop-divider"
          @drop="dropFrame($event, idx)"
          @dragover.prevent="dragFrameOver($event, 'move')"
         ></div>
        <div class="frame-thumbnails-new"
          @click="newFrame()"
          @drop="dropNewFrame($event)"
          @dragover.prevent="dragFrameOver($event, 'copy')"
         >
          <i class="fas fa-plus-square" />
        </div>
      </div>
      <div>
        <stb-animation-frame v-if="selectedFrame" :frame="selectedFrame" draggable />
      </div>
    </div>
  `,
}


const ColorsTab = {
  inject: ['tree'],

  data() {
    return {
      selectedSwap: null,
      selectedPalette: 0,
      selectedColor: 1,
    }
  },

  methods: {
    colorSwapPalettes() {
      return Utils.getAllPalettes(this.tree);
    },

    fullPaletteCellStyle(i, j) {
      const color = i == 0 && j == 0 ? 'black' : NES_COLORS[16 * i + j];
      return { 'background-color': color }
    },

    setSelectedSwapColor(i, j) {
      const k = PALETTE_NAMES[this.selectedPalette];
      this.tree.color_swaps[k][this.selectedSwap].colors[this.selectedColor] = 16 * i + j;
    },
  },

  computed: {
    selectedSwapPalettes() {
      return Utils.getPalettes(this.tree, this.selectedSwap);
    },

    selectedSwapColor() {
      if (this.selectedSwap === null) {
        return null;
      }
      const k = PALETTE_NAMES[this.selectedPalette];
      return this.tree.color_swaps[k][this.selectedSwap].colors[this.selectedColor];
    },
  },

  template: `
    <div v-if="tree" class="color-swaps">
      <h2>Color swaps</h2>
      <div class="palette-picker">
        <table v-for="(palettes, swap) of colorSwapPalettes()"
          @click="selectedSwap = swap"
         >
          <tr v-for="c in [0, 1, 2]">
            <td v-for="p in [0, 1, 2]" :style="{ 'background-color': palettes[p][c] || 'black' }" />
          </tr>
        </table>
      </div>
      <div class="selected-swap">
        <div class="color-picker">
          <table v-if="selectedSwap !== null">
            <tr v-for="c in [0, 1, 2]">
              <td v-for="p in [0, 1, 2]"
                :style="{ 'background-color': selectedSwapPalettes[p][c] }"
                :class="{ selected: p == selectedPalette && c == selectedColor }"
                @click="selectedPalette = p; selectedColor = c"
               />
            </tr>
          </table>
        </div>
        <div class="full-palette">
          <table>
            <tr v-for="(_, i) in 4">
              <td v-for="(_, j) in 16"
                :style="fullPaletteCellStyle(i, j)"
                :class="{ selected: selectedSwapColor === 16*i+j }"
                @click="setSelectedSwapColor(i, j)"
               >
                <template v-if="i + j === 0"><i class="fas fa-image" /></template>
                <template v-else>{{ (16*i+j).toString(16).padStart(2, '0') }}</template>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `,
}


const HelpTab = {
  template: `
    <ul id="help">
      <li>
        General
        <ul>
          <li>Choose elements to edit from the left column</li>
          <li>Changes to a tile will propagate to everything that uses it</li>
        </ul>
      </li>
      <li>
        Toolbar
        <ul>
          <li>The toolbar is the vertical panel on the left side</li>
          <li>Use <i class="fas fa-paint-brush"/> tool to draw</li>
          <li>Select drawing color from the palette</li>
          <li>When drawing, use Control and/or Shift to modify color bitmask</li>
          <li>Use <i class="fas fa-palette"/> to change palette used for display and drawing</li>
          <li>Use <i class="fas fa-image"/> to select the background color, for transparent pixels</li>
          <li>Use <i class="fas fa-border-all"/> to change grid and overlays: all borders / tile borders / nothing</li>
          <li>Use <i class="fas fa-search-minus"/> / <i class="fas fa-search-plus"/> to zoom-out/in</li>
        </ul>
      </li>
      <li>
        Animation edition
        <ul>
          <li>Select a frame from the thumbnails to edit it</li>
          <li>Drag and drop frames to reorder them</li>
          <li>Drop a frame on <i class="fas fa-plus-square" /> to clone it</li>
        </ul>
      </li>
      <li>
        Frame edition
        <ul>
          <li>Select a sprite from the thumbnails or using <i class="fas fa-mouse-pointer" /> tool to edit it</li>
          <li>Drag and drop sprites to reorder them</li>
          <li>Drop a sprite on <i class="fas fa-plus-square" /> to clone it</li>
          <li>Check/uncheck hurtbox and hitbox to enable/disable them</li>
          <li>Use <i class="fas fa-vector-square"/> to toggle hurtbox and hitbox display</li>
          <li>The red dot marks the origin (character's left, at ground level)</li>
        </ul>
      </li>
      <li>
        Sprite edition
        <ul>
          <li>Select sprite's tile from the thumbnails</li>
          <li>Use <i class="fas fa-arrows-alt-h"/> to flip the sprite horizontally</li>
          <li>Use <i class="fas fa-arrows-alt-v"/> to flip the sprite vertically</li>
          <li>Use <i class="fas fa-palette"/> to toggle between primary and secondary palette</li>
          <li>Use <i class="fas fa-layer-group"/> to toggle between foreground and background</li>
        </ul>
      </li>
    </ul>
  `,
}


const routes = [
  { path: '/illustrations', component: IllustrationsTab },
  { path: '/tileset', component: TilesetTab },
  { path: '/animations', component: AnimationsTab },
  { path: '/animations/:name', component: AnimationTab },
  { path: '/animations/:name/:frame', component: AnimationTab },
  { path: '/colors/', component: ColorsTab },
  { path: '/help', component: HelpTab },
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
})

app.use(router);

app.config.unwrapInjectedRef = true;
app.mount('#app');

