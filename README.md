# Snakes-and-Ladders-RPG

**[INTRO PAGE](https://jkvin114.github.io/Snakes-and-Ladders-RPG-wiki/index.html)**

## Tech stacks
Server
- Node.js
- Express.js
- socket.io
- Typescript
- MongoDB(mongoose)

Client
- HTML/CSS
- Javascript
- Jquery

Client Dependencies
- Jquery
- Fabric.js
- Socket.io
- Amcharts4
- Howler.js
- Axios


## Directory structure
<!-- > blockquote -->


```
📦server-ts 
 ┣ 📂node_modules 
 ┣ 📂config //server configurations

 ┣ 📂public  //contains client files
    ┣ 📂lib //contains library js files
    ┣ 📂res //contains resources
        ┣ 📂font
        ┣ 📂tmg
        ┗ 📂sound
    ┣ 📂src //contains all css and js files
        ┗ 📂style
    ┗ 📂uploads //images that uploaded from post board
 ┣ 📂res //.json files
    ┗ 📂marble //.json files for marble module
 ┣ 📂src //server codes
 ┣ 📂views //.ejs files for post board
 ┣ 📂marble //all files for marble game service module
 ┣ 📜.gitignore
 ┣ 📜.tsconfig
 ┣ 📜package-lock.json
 ┗ 📜package.json

````

## Configuration
- Create config folder at the root directory and add `config.json` and `.env`

### Sample `config.json`
```jsonc
{
    "simulation":true, //enables simulation
    "marble":true, //enables marble module
    "board":true, //enables post board
    "localDB":true, //use local database
    "dev_settings":{ 
        "enabled":false,
        "player":{ //can force initial settings for every players for all game
            "level":4,
            "pos":80,
            "money":500
        },
        "dice":-1 //can force all dice numbers to be fixed (-1 on unset)
    }
}
```
### Sample `.env`

```
MONGODB_URL_LOCAL=//url for local DB
MONGODB_URL=//url for cloud DB

```

## Run with npm
`npm run dev`


## The Marble Game Module
- The marble game module is a clone-coded version of Korean mobile game [Get Rich](https://play.google.com/store/apps/details?id=com.linecorp.LGGRTHN&hl=en_US&gl=US&pli=1) ( 모두의마블), besides the main game Snakes-and-Ladders RPG.
- This module utilizes reuses the same matching and board graphic code for the Snakes-and-Ladders RPG game.
- This module runs as a separate service from rest of the program, connected via **gRPC**.

### Run marble game module with npm

```bash
cd marble
npm run dev
```