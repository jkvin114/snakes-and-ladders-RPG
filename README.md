# Snakes-and-Ladders-RPG

- [Intro Page](https://jkvin114.github.io/Snakes-and-Ladders-RPG-wiki/index.html)

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
    ┣ 📂marble //all files for marble module
    ┗ 📂uploads //images that uploaded from post board
 ┣ 📂res //.json files
    ┗ 📂marble //.json files for marble module
 ┣ 📂src //server codes
 ┣ 📂views //.ejs files for post board
 ┣ 📜.gitignore
 ┣ 📜.tsconfig
 ┣ 📜package-lock.json
 ┗ 📜package.json

````

## Configuration
- Create config folder at the root directory and add `config.json` and `.env`

### Sample `config.json`
```json
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

## Run with ts-node
`ts-node src/app.ts`