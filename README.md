## Medusa

Medusa is a 3D git repository history visualization tool inspired by the famous medusa visualization: https://github.com/acaudwell/medusa.

It uses a GPGPU Force Directed Graph simulation to efficiently maintain it's structure.

This package comes with a Node JS server for populating Google Firebase Firestore from the GitHub API and a frontend client for running the visualization.

![medusa visual](https://raw.githubusercontent.com/input-output-hk/medusa/master/static/assets/images/medusa.jpg)

Install server dependencies with:

```bash
yarn install
```

Install client dependencies with:

```bash
cd client && yarn install
```

To start the Node server and the frontend client, run this in the root directory:

```bash
yarn dev
```

## Firebase Firestore data storage

Medusa relies on data being copied from the GitHub API to Google Firebase Firestore. You will need to set up a new Firebase Firestore project through your Google Console.

Once this is set up, paste the following into the Firestore Rules:

```
// Allow read/write access on all documents to any user signed in to the application
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid != null;
    }
  }
}
```

Following this, you need to enable Anonymous authentication for the Google project. This step is to slow down a potential DDOS attack.

In order to run the Node server you will need to download your Firebase Admin SDK service account key json file and put this in ```/auth```. Add the key filename to ```/config.js```

## Local server config

Enter the details of the GitHub Repository you wish to use in ```/config.js``` (these values can also be passed as query strings when running the update script):

```javascript
const config = {
  GHRepo: 'REPO_NAME',
  GHBranch: 'BRANCH',
  GHOwner: 'OWNER',
  FBFilename: 'FIREBASE_ADMIN_SDK_FILENAME'
}
```

## GitHub access token

Create a new GitHub personal access token: https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/ and add this as a Node JS environment variable with the key: ```TOKEN_GITHUB_DOT_COM```


## Populating Firebase Firestore

With all of the above configured you should be able to run:

```bash
yarn dev
```

To start populating Firebase Firestore, point your browser to:

```
http://localhost:5000/api/updateDB
```

If you hit github API rate limiting or the script is stopped for any reason, the script will automatically pick up where it left off. For a production environment as on https://cardanoroadmap.com/ you can set this script run as a cron job to keep Firebase up to date with the git repository.

It should be noted that each repository branch needs to be added separately.

## Google Cloud Function for file click interaction

In order to show details about a file on click you will need to set up a Google Cloud Function to pull data from the GitHub API. There is an example script and ```package.json``` in ```/client/cloud_functions/```

## Running the Visualization

The following code will create a new medusa instance:

```javascript
window.onload = function() {
  if (medusa.canRun()) {
    medusa.init(config).on('ready', function() {

    }
  }
}
```

A detailed example implementation can be found in: ```/client/build/index.html```

The following config settings can be passed to the medusa instance. Default values can be found in ```/client/src/Config.js```.

```javascript
config = {
          git: {
            owner: 'input-output-hk',
            repo: 'cardano-sl',
            branch: 'develop',
            commitHash: '', // hash of commit to load
            commitDate: '', // date to load (YYYY-MM-DD)
            loadLatest: true // load latest commit in db
          },
          display: {
            showUI: true,
            showSidebar: true
          },
          FDG: {
            nodeSpritePath: 'textures/dot.png', // path to node texture
            nodeUpdatedSpritePath: 'textures/dot-concentric.png', // path to node updated state texture
            fontTexturePath: 'textures/UbuntuMono.png', // path to font texture
            autoPlay: false,
            delayAmount: 1000, // time in between new commits being added to the graph
            sphereProject: 0, // project graph onto sphere? 1 == true, 0 == false
            usePicker: false, // show file commit details on click
            pickerLoadingPath: '/assets/images/loading.svg', // show file commit details on click
            sphereRadius: 500, // radius of sphere if in sphere projection mode
            showFilePaths: true, // display filepath overlay on nodes
            colorPalette: [ // colors to use if cycleColors is switched off
              '#eb2256',
              '#f69ab3',
              '#1746a0',
              '#6f9cef',
              '#652b91',
              '#0e5c8d',
              '#1fc1c3'
            ]
          },
          scene: {
            fullScreen: true,
            width: 800,
            height: 600,
            bgColor: 0x121327,
            antialias: false,
            canvasID: 'medusa-stage', // ID of webgl canvas element
            autoRotate: false, // auto rotate camera around target
            autoRotateSpeed: 0.001 // speed of auto rotation
          },
          post: {
            vignette: true
          },
          camera: {
            fov: 45,
            initPos: {x: 0, y: 0, z: 1600},
            enableZoom: true // enable camera zoom on mousewheel/pinch gesture
          }
        }
```

## TODO

- Move frontend data sorting code to webworkers to ensure smooth playback in play mode
- Add higher visual quality setting for faster machines
- Use an octree for physics calculations
- Add UI widgets to expose more information about the repository to the user
