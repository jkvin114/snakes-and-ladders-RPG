export const PAGES={
    home:{
        html:"home.html",
        scripts:[
            "lib/jquery-3.6.0.min.js",
            "lib/axios.js",
            "src/skillparser.js",
            "src/localeManager.js",
            "lib/socket.io.min.js",
            "src/homepage.js",
            "src/init.js"
        ]
    },
    test:{
        html:"home.html",
        scripts:[
            "lib/jquery-3.6.0.min.js"
        ],
        modules:[
            "src/init.js"
        ]
    },
    spectate:{
        html:"spectatepage.html",
        scripts:[
            "lib/jquery-3.6.0.min.js",
            "lib/axios.js",
            "src/spectate.js",
            "src/init.js"
        ]
    },
    stat:{
        html:"statpage.html",
        scripts:[
            "lib/jquery-3.6.0.min.js",
            "lib/axios.js",
            "src/localeManager.js",
            "src/stat/stat.js",
            "src/stat/statChartConfig.js",
            "src/stat/analysis.js",
            "src/stat/character.js",
            "src/stat/gamedetail.js",
            "src/stat/util.js",
            "src/skillparser.js",
            "src/init.js"
        ]
    }
    ,find_room:{
        html:"find_room_page.html",
        scripts:[
            "lib/jquery-3.6.0.min.js",
            "lib/axios.js",
            "src/findroom.js",
            "src/init.js"
        ]
    }
    ,board:{
        html:"",
        scripts:[
            "/lib/jquery-3.6.0.min.js",
            "/lib/axios.js",
            "/src/localeManager.js",
            "/src/init.js"
        ]
    }
}