# WatermarkRemover.io for Photoshop

This plugin introduces support to remove watermarks from images in the Photoshop backend by [PixelBin's](https://www.pixelbin.io) Watermark Remover transformation.

> [!NOTE]
> To learn more about how to use this plugin, [click here](https://www.pixelbin.io/docs/integrations/photoshop/watermarkremover.io/).

## Install dependencies

First, make sure that `npm` is installed on your system.

After you ensure that your terminal is in the root of this project, use `npm` to install the various dependencies needed:

```
npm install
```

<b>Optional</b></br>
If you prefer to use `yarn`, after you generate the `package-lock.json` file you can run the following line to import dependencies to a `yarn.lock` file:

```
yarn import
```

## Build Process

There are two ways to build the plugin for use in Photoshop:

-   `yarn watch` (or `npm run watch`) will build a development version of the plugin, and recompile every time you make a change to the source files. The result is placed in `dist` folder. Make sure your plugin is in watch mode in UDT app.
-   `yarn build` (or `npm run build`) will build a production version of the plugin and place it in `dist` folder. It will not update every time you make a change to the source files.

> You **must** run either `watch` or `build` prior to trying to use within Photoshop!

## Launching in Photoshop

You can use the UXP Developer Tools to load the plugin into Photoshop.

If the plugin hasn't already been added to your workspace in the UXP Developer Tools, you can add it by clicking "Add Plugin...". You can either add the `manifest.json` file in the `dist` folder or the `plugin` folder.

-   If you add the one in the `plugin` folder, then you need to update the relative path to the plugin build folder ( `dist` ) by clicking the ••• button > "Options" > "Advanced" > "Plugin build folder".
-   During development, it is recommended to build the plugin using `yarn watch` and load the `manifest.json` in the (plugin build) `dist` folder.

Once added, you can load it into Photoshop by clicking the ••• button on the corresponding row, and clicking "Load". Switch to Photoshop and you should see the starter panels.

---

PS Version : 23.2.0 or higher
UXP Version : 5.6 or higher
