
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

const NES_COLORS = [
  '#7C7C7C',
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


class Drawer {
  constructor(tree) {
    this.tree = tree;
    //TODO
    this.background = '#222';
    this.palettes = [
      [null, '#888', '#ccc', '#fff'],
      [null, '#22f', '#44f', '#88f'],
    ];
    this.zoom = 16;
  }

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

    return {
      x: left,
      y: top,
      width: right - left + 1,
      height: bottom - top + 1,
    }
  }

  getTileByName(name) {
    const tileset = this.tree.tileset;
    const idx = tileset.tilenames.indexOf(name);
    return tileset.tiles[idx];
  }

  drawFrame(ctx, frame) {
    const rect = this.frameRect(frame);
    ctx.canvas.width = rect.width * this.zoom;
    ctx.canvas.height = rect.height * this.zoom;

    ctx.fillStyle = this.background;
    ctx.fillRect(0, 0, rect.width * this.zoom, rect.height * this.zoom);

    for (let sprite of frame.sprites) {
      if (!sprite.foreground) {
        this.drawSpriteTile(ctx, sprite, sprite.x - rect.x, sprite.y - rect.y)
      }
    }
    for (let sprite of frame.sprites) {
      if (sprite.foreground) {
        this.drawSpriteTile(ctx, sprite, sprite.x - rect.x, sprite.y - rect.y)
      }
    }
  }

  drawSpriteTile(ctx, sprite, x, y) {
    const palette = this.palettes[sprite.attr & 0x1];
    const tile = this.getTileByName(sprite.tile);
    for (let [yy, row] of tile.representation.entries()) {
      for (let [xx, value] of row.entries()) {
        const color = palette[value];
        if (color === null) {
          continue;  // transparent, don't draw
        }
        const pixel_x = x + (sprite.attr & 0x40 ? 7-xx : xx);
        const pixel_y = y + (sprite.attr & 0x80 ? 7-yy : yy);

        ctx.fillStyle = color;
        ctx.fillRect(pixel_x * this.zoom, pixel_y * this.zoom, this.zoom, this.zoom);
      }
    }
  }
}


const app = Vue.createApp({
  data() {
    return {
      tree: null,
    }
  },

  provide() {
    return {
      tree: Vue.computed(() => this.tree),
      drawColor: Vue.computed(() => this.$refs.toolbar.drawColor()),
      activeTool: Vue.computed(() => this.$refs.toolbar.tool),
    }
  },

  mounted() {
    this.fetchCharacterData();

    // Setup stylesheet for dynamic styling
    let style = document.createElement("style");
    document.head.appendChild(style);
    this.sheet = style.sheet;
    this.updateZoomRule();

    this.$watch("$refs.toolbar.zoom", () => this.updateZoomRule(), { immediate: true });
    this.$watch("$refs.toolbar.grid", (val, _) => {
      const classes = this.$refs.content.classList;
      for (let x of ['off', 'tiles', 'pixels']) {
        classes.toggle('tool-grid-' + x, val === x);
      }
    }, { immediate: true });
    this.$watch("$refs.toolbar.tool", (val, _) => {
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
        this.$refs.toolbar.colorModifier = ev.ctrlKey + 2 * ev.shiftKey;
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

    updateZoomRule() {
      const zoom = this.$refs.toolbar.zoom;
      if (this.zoomRule !== undefined) {
        deleteCssRule(this.zoomRule);
      }
      this.zoomRule = this.insertCssRule(`:root { --grid-zoom: ${zoom}px; }`);
    },

    // Insert a CSS rule and return it, as a CSSRule object
    insertCssRule(text) {
      const i = this.sheet.insertRule(text);
      return this.sheet.cssRules[i];
    },

    downloadAsJson() {
      console.debug("download character data as JSON");
      downloadJson(this.tree, this.tree.name + '.json');
    },
  },
});


app.component('toolbar', {
  data() {
    return {
      baseColor: 0,
      colorModifier: 0,
      zoom: 16,
      tool: 'brush',
      grid: 'tiles',
    }
  },

  methods: {
    zoomIn() {
      if (this.zoom * 2 <= 64) {
        this.zoom *= 2;
        console.debug("zoom in:", this.zoom);
      }
    },
    zoomOut() {
      if (this.zoom / 2 >= 4) {
        this.zoom /= 2;
        console.debug("zoom out:", this.zoom);
      }
    },

    changeGrid() {
      if (this.grid == 'off') {
        this.grid = 'tiles';
      } else if (this.grid == 'tiles') {
        this.grid = 'pixels';
      } else {
        this.grid = 'off';
      }
    },

    drawColor() {
      return this.baseColor ^ this.colorModifier;
    },
  },

  template: `
    <table>
      <tr v-for="c in [0, 1, 2, 3]">
        <td
          :class="['bgcolor'+(c || '-none'), { 'active-color': c === drawColor() }]"
          @click="baseColor = c"
         />
      </tr>
    </table>
    <div>
      <button class="icon" @click="zoomOut()" title="Zoom-out"><i class="fas fa-search-minus"/></button>
      <button class="icon" @click="zoomIn()" title="Zoom in"><i class="fas fa-search-plus"/></button>
    </div>
    <div>
      <button class="icon" @click="tool = 'brush'" :class="{ enabled: tool === 'brush' }" title="Brush"><i class="fas fa-paint-brush"/></button>
      <button class="icon" @click="tool = 'select'" :class="{ enabled: tool === 'select' }" title="Select"><i class="fas fa-mouse-pointer"/></button>
    </div>
    <button class="icon" @click="changeGrid()" title="Grid style"><i class="fas fa-border-all"/></button>
  `,
});


app.component('stb-tiles', {
  props: ['tiles'],
  inject: ['drawColor'],

  methods: {
    getTile(x, y) {
      return this.tiles[Math.floor(y / 8)][Math.floor(x / 8)];
    },

    getPixel(x, y) {
      return this.getTile(x, y).representation[y % 8][x % 8];
    },

    drawPixel(x, y) {
      this.getTile(x, y).representation[y % 8][x % 8] = this.drawColor.value;
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
          :class="'bgcolor'+getPixel(x, y)"
          @mousemove="mouseMove($event, x, y)"
          @click="drawPixel(x, y)"
         />
      </tr>
    </table>
  `,
});


app.component('stb-animation-frame', {
  props: ['frame'],
  inject: ['tree', 'activeTool'],

  data() {
    return {
      selectedSprite: null,
    }
  },

  computed: {
    rect() {
      return Drawer.frameRect(this.frame);
    },
  },

  methods: {
    spriteTile(sprite) {
      const tileset = this.tree.value.tileset;
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
        position: 'absolute',
        left: `calc(${x} * var(--grid-zoom))`,
        top: `calc(${y} * var(--grid-zoom))`,
        transform: `scale(${sx},${sy})`,
      }
    },
  },

  template: `
    <div class="animation-frame">
      <div class="frame-canvas">
        <table class="canvas-grid background bgcolor-none">
          <tr v-for="y in Array(rect.height).keys()">
            <td v-for="x in Array(rect.width).keys()" />
          </tr>
        </table>
        <stb-tiles
          v-for="sprite of frame.sprites"
          :class="['frame-sprite', { selected: sprite === selectedSprite, foreground: sprite.foreground }]"
          :tiles.sync="[[spriteTile(sprite)]]"
          :style="spriteStyle(sprite)"
          @click.capture="activeTool.value === 'select' && (selectedSprite = sprite, $event.stopPropagation())"
          @mousemove.capture="activeTool.value === 'select' && $event.stopPropagation()"
          />
      </div>
      <stb-sprite-info v-if="selectedSprite" :sprite="selectedSprite" />
    </div>
  `,
});

app.component('stb-sprite-info', {
  props: ['sprite'],

  template: `
    <div class="sprite-info">
      <div><label>X: <input v-model="sprite.x" type="number" style="width: 5em;"/></label></div>
      <div><label>Y: <input v-model="sprite.y" type="number" style="width: 5em;"/></label></div>
      <div>
        <button class="icon" @click="sprite.attr ^= 0x40" :class="{ enabled: sprite.attr & 0x40 }" title="Horizontal flip"><i class="fas fa-arrows-alt-h"/></button>
        <button class="icon" @click="sprite.attr ^= 0x80" :class="{ enabled: sprite.attr & 0x80 }" title="Vertical flip"><i class="fas fa-arrows-alt-v"/></button>
        <button class="icon" @click="sprite.foreground = !sprite.foreground" :class="{ enabled: sprite.foreground }" title="Foreground"><i class="fas fa-layer-group"/></button>
      </div>
    </div>
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
    <div v-if="tree.value" class="tab-illustrations">
      <h2>Token</h2> 
      <stb-tiles :tiles.sync="illustrationTiles(tree.value.illustration_token, 1, 1)" class="bgcolor-none" />
      <h2>Small </h2> 
      <stb-tiles :tiles.sync="illustrationTiles(tree.value.illustration_small, 2, 2)" class="bgcolor-none" />
      <h2>Large</h2> 
      <stb-tiles :tiles.sync="illustrationTiles(tree.value.illustration_large, 6, 8)" class="bgcolor-none" />
    </div>
  `,
}


const TilesetTab = {
  inject: ['tree'],

  methods: {
    //XXX Needed?
    tileAnimations(i) {
      const tree = this.tree.value;
      const name = tree.tileset.tilenames[i];
      const useTile = anim => anim.frames.some(frame => frame.sprites.some(sprite => sprite.tile === name));
      let animations = tree.animations.filter(useTile);
      for (const item of Object.values(tree)) {
        if (item.type === 'animation' && useTile(item)) {
          animations.push(item);
        }
      }
      return animations;
    },
  },

  template: `
    <div v-if="tree.value" class="tab-tileset">
      <h2>Tileset</h2>
      <div class="tileset-tile" v-for="(tile, i) in tree.value.tileset.tiles">
        <stb-tiles :tiles.sync="[[tile]]" class="bgcolor-none" />
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
    <div v-if="tree.value">
      <h2>Animations</h2>
      <ul>
        <li v-for="anim in tree.value.animations">
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
    }
  },

  created() {
    this.$watch(() => this.$route.params, () => this.updateAnimation());
    this.$watch('tree.value', () => this.updateAnimation());
    this.updateAnimation();
  },
 
  methods: {
    updateAnimation() {
      if (this.tree.value) {
        this.animation = this.tree.value.animations.find(anim => anim.name === this.$route.params.name);
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
        <stb-animation-frame :frame="animation.frames[0]" />
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

app.mount('#app');

