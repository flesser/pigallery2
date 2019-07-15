This is a quick&dirty hacked fork supporting trashing of images.

It has to be enabled by setting `Client.Trash.enabled = true` in `config.json`.


# PiGallery2 
[![npm version](https://badge.fury.io/js/pigallery2.svg)](https://badge.fury.io/js/pigallery2)
[![Build Status](https://travis-ci.org/bpatrik/pigallery2.svg?branch=master)](https://travis-ci.org/bpatrik/pigallery2)
[![Heroku](https://heroku-badge.herokuapp.com/?app=pigallery2&style=flat)](https://pigallery2.herokuapp.com)
[![Docker Build Status](https://img.shields.io/docker/build/bpatrik/pigallery2.svg)](https://hub.docker.com/r/bpatrik/pigallery2/)
[![dependencies Status](https://david-dm.org/bpatrik/pigallery2/status.svg)](https://david-dm.org/bpatrik/pigallery2)
[![devDependencies Status](https://david-dm.org/bpatrik/pigallery2/dev-status.svg)](https://david-dm.org/bpatrik/pigallery2?type=dev)


Homepage: http://bpatrik.github.io/pigallery2/

This is a directory-first photo gallery website, optimised for running on low resource servers (especially on raspberry pi)

## Live Demo
Live Demo @ heroku: https://pigallery2.herokuapp.com/ 
 - the demo page **first load** might take up **30s**: the time while the free webservice boots up

## Table of contents
1. [Getting started](#1-getting-started-on-raspberry-pi)
2. [Translate the page to your own language](#2-translate-the-page-to-your-own-language)
3. [Feature list](#3-feature-list)
4. [Suggest/endorse new features](#4-suggestendorse-new-features)
5. [Known errors](#5-known-errors)
6. [Credits](#6-credits) 



## 1. Getting started (on Raspberry Pi)
### 1.1 Direct Install
### 1.1.0 [Install NodeJs](https://nodejs.org/en/download/)
Download and extract
```bash
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Full node install on raspberry pi description: https://www.w3schools.com/nodejs/nodejs_raspberrypi.asp
 
### 1.1.1 Install PiGallery2
#### 1.1.1-a Install from release

```bash
cd ~
wget https://github.com/bpatrik/pigallery2/releases/download/1.5.6/pigallery2.zip
unzip pigallery2.zip -d pigallery2
cd pigallery2
npm install
```
#### 1.1.1-b Install from source
```bash
cd ~
wget https://github.com/bpatrik/pigallery2/archive/master.zip
unzip master.zip
cd pigallery2-master # enter the unzipped directory
npm install
```
**Note**: if you run `npm run build-release`, it creates a clean, minified, production ready version from the app in the `release` folder, that is ready to deploy.

#### 1.1.2 Run PiGallery2
```bash
npm start
```
To configure it, run `PiGallery2` first to create `config.json` file, then edit it and restart.
The app has a nice UI for settings, you may use that too. 
Default user: `admin` pass: `admin`

### 1.2 Run with Docker 
If you have `docker` and don't want to install all the dependencies, use this:
```bash
docker run \
   -p 80:80 \
   -e NODE_ENV=production \
   -v <path to your config file folder>/config.json:/pigallery2-release/config.json \
   -v <path to your db file folder>/sqlite.db:/pigallery2-release/sqlite.db \
   -v <path to your images folder>:/pigallery2-release/demo/images \
   -v <path to your temp folder>:/pigallery2-release/demo/TEMP \
   bpatrik/pigallery2:1.5.6-stretch
```
Make sure that a file at `<path to your config file folder>/config.json` and `sqlite.db` files exists before running it. 

You do not need the `<path to your db file folder>/sqlite.db` line if you don't use the sqlite database.

After the container is up and running, you go to `http://localhost` and log in with user: `admin` pass: `admin` and set up the page in the settings. 

**All docker builds**: https://hub.docker.com/r/bpatrik/pigallery2/tags/

**Note**: You dont need to do the installation steps if you are using docker. 


### 1.3 Advanced configuration
You can set up the app the following ways:
 * Using the UI
 * Manually editing the `config.json`
 * Through switches
   * Like: `node backend/index.js --Server-port=3000 --Client-authenticationRequired=false`
   * You can check the generated `config.json` for the config hierarchy
 * Through environmental variable
   * like set env. variable `Server-port` to `3000`   

### 1.4 Useful links/tips:

#### using nginx
It is recommended to use a reverse proxy like nginx before node
https://stackoverflow.com/questions/5009324/node-js-nginx-what-now

#### making https
With cerbot & nginx it is simple to set up secure connection. You have no excuse not doing so.
https://certbot.eff.org/

#### node install error:
If you get error during module installation, make sure you have everything to build node modules from source
```bash
apt-get install build-essential  libkrb5-dev gcc g++
```


## 2. Translate the page to your own language
1. [Install Pigallery2](#111-b-install-from-source) from source (with the release it won't work) 
2. add your language e.g: fr
   ```bash
   npm run add-translation -- --fr
   ```
   it creates a new `messages.fr.xls` file at `frontend/translate` folder, 
   it will already contain dummy translation with google translate.
3. 'fix' the dummy translation
4. test if it works:
   build and start the app
   ```bash
   npm install
   npm start
   ```
5. (optional) create a pull request at github to add your translation to the project.

**Note**: you can also build your own release with as described in [1.1.1-b Install from source](#111-b-install-from-source);



## 3. Feature list

 * supported formats:
   * images: **jpg, jpeg, jpe, webp, png, gif, svg**
   * videos: **mp4, ogg, ogv, webm**
 * **Rendering directories as it is**
   * Listing subdirectories recursively
   * Listing photos in a nice grid layout
     * supporting most common image formats
     * showing **tag/keywords, locations, GPS coordinates** for photos
     * rendering photos on demand (on scroll)
 * **On the fly thumbnail generation** in several sizes
   * prioritizes thumbnail generation (generating thumbnail first for the visible photos)
   * saving generated thumbnails to TEMP folder for reuse
   * supporting multi-core CPUs
   * supporting hardware acceleration ([sharp](https://github.com/lovell/sharp) and [gm](https://github.com/aheckmann/gm) as optional and JS-based [Jimp](https://github.com/oliver-moran/jimp)  as fallback)   
 * Custom lightbox for full screen photo and video viewing
   * keyboard support for navigation  
   * showing low-res thumbnail while full image loads
   * Information panel for showing **Exif info**  
   * Automatic playing
   * gesture support (swipe left, right, up)
   * shortcut support
 * Client side caching (directories and search results)
 * Rendering **photos** with GPS coordinates **on open street maps**
   * .gpx file support: rendering paths to map
   * supports [OSM](https://www.openstreetmap.org) and [Mapbox](https://www.mapbox.com) by default, but you can add any provider that has a tile url
 * **Two modes: SQL database and no-database mode**
   * both modes supports
     * user management
     * password protection can be disabled/enabled
   * database mode supports:
     * faster directory listing
     * searching
       * instant search, auto complete
     * sharing 
       * setting link expiration time
 * internalization / translation support
   * currently supported languages: eng, hun
 * Nice design 
    * responsive design (phone, tablet desktop support)
 * Setup page
 * Random photo url
   * You can generate an url that returns a random photo from your gallery. You can use this feature to develop 3rd party applications, like: changing desktop background
 * video support
   * fully supports *.mp4 files and partially (might have errors with safari and IE) supports *.ogg, *.ogv, *.webm files
   * uses ffmpeg and ffprobe to generate video thumbnails
 * Dockerized 
 * **Markdown based blogging support** - `future plan`
   * you can write some note in the blog.md for every directory
 * bug free :) - `In progress`
 
 
## 4. Suggest/endorse new features
  You are welcome to suggest new features to the application via [github issues](https://github.com/bpatrik/pigallery2/issues).
  I cannot garantie any dealine with the development of a new feature. (I usually fix bugs within week/weeks.)
  I will give a higher priority to a feature that has more 'likes' (i.e.: `+1`-s or thumbs ups) on it.

## 5. Known errors
* EXIF orientation tag:
  *  There is no nice way to handle EXIF orientation tag properly.
The page handles these photos, but might cause same error in the user experience (e.g.: the pages loads those photos slower. See issue [#11](https://github.com/bpatrik/pigallery2/issues/11))
* Video support on weak servers (like raspberry pi) with low upload rate
  * video playback may use up too much resources and the server might not response for a while. A solution might be to down scale / convert the video files to lower bitrate. 
## 6. Credits
Crossbrowser testing sponsored by [Browser Stack](https://www.browserstack.com)
[<img src="https://camo.githubusercontent.com/a7b268f2785656ab3ca7b1cbb1633ee5affceb8f/68747470733a2f2f64677a6f7139623561736a67312e636c6f756466726f6e742e6e65742f70726f64756374696f6e2f696d616765732f6c61796f75742f6c6f676f2d6865616465722e706e67" alt="Browser Stack" height="31px" style="background: cornflowerblue;">](https://www.browserstack.com)

