# Character editor for Super Tilt Bro

Web editor for characters of the NES game [Super Tilt Bro](https://github.com/sgadrat/super-tilt-bro).

This project provides an interactive way to modify characters.
The game is moddable, and each character can be serialized as JSON.
All changes made through the editor are reflected to the JSON data, which can be downloaded back.

[Online version](https://benoitryder.github.io/stb-mod-editor/)

## How to build

There is nothing to build! Copy all files and serve it using any HTTP server.

## Dependencies

Dependencies are hardcoded in `index.html` and loaded from external CDNs.

* [Vue.js](https://v3.vuejs.org/)
* [Vue Router](https://next.router.vuejs.org)
* [Font Awesome](https://fontawesome.com/)

Vue and Vue Router are licensed under the MIT license.
Font Awesome uses [a mix](https://fontawesome.com/license/free) of CC BY 4.0, SIL OFL 1.1 and MIT.

