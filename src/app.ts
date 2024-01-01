import SETTINGS = require("../res/globalsettings.json")

import { createServer } from "http"
import {  Server, Socket } from "socket.io"
// import express = require("express")
import fs = require("fs")
import cors = require("cors")
import os = require("os")


const session = require("express-session")({
	key: "sid", //세션의 키 값
	secret: "salr", //세션의 비밀 키, 쿠키값의 변조를 막기 위해서 이 값을 통해 세션을 암호화 하여 저장
	resave: false, //세션을 항상 저장할 지 여부 (false를 권장)
	saveUninitialized: true, //세션이 저장되기전에 uninitialize 상태로 만들어 저장
	cookie: {
		maxAge: 24000 * 60 * 60 // 쿠키 유효기간 24시간
	}
})
import express=require("express")
import { connectMongoDB } from "./mongodb/connect"
import MarbleGameGRPCClient from "./grpc/marblegameclient"
import RPGGameGRPCClient from "./grpc/rpggameclient"
declare module 'express-session' {
	interface SessionData {
        cookie: Cookie;
        isLogined:boolean
        userId:string
        username:string
        boardDataId:string
        roomname:string
        turn:number
		ip:string
		time:Date
	}
  }
// import session from 'express-session';




const clientPath = `${__dirname}/../public`
const firstpage = fs.readFileSync(clientPath+"/index.html", "utf8")
const PORT = 5000
const app = express()

//temp ==============================

/*
let cookieParser = require('cookie-parser');
app.use(cookieParser());

import { createClient } from 'redis';
import { hexId } from "./Marble/util"

const redisClient = createClient(); //port 6379

redisClient.on('error', err => console.log('Redis Client Error', err));

redisClient.connect().then(()=>{
	console.log("connected to redis")
});
*/

//==============================================

app.use(session)
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use("/stat", require("./router/statRouter"))
app.use("/admin", require("./router/adminRouter"))

app.use("/user", require("./router/RegisteredUserRouter"))
app.use("/room", require("./router/RoomRouter"))
app.use("/resource", require("./router/resourceRouter"))
app.use("/board", require("./router/board/BoardRouter"))
app.use("/ping", require("./router/pingRouter"))

app.set('view engine','ejs')
app.engine('html', require('ejs').renderFile);

app.use(express.static(clientPath))
app.use(errorHandler)
const httpserver = createServer(app)
httpserver.listen(PORT)
app.on("error", (err: any) => {
	console.error("Server error:", err)
})

connectMongoDB()
MarbleGameGRPCClient.connect()
RPGGameGRPCClient.connect()

// const interfaces = os.networkInterfaces()
// var addresses = []
// for (var k in interfaces) {
// 	for (var k2 in interfaces[k]) {
// 		var address = interfaces[k][k2]
// 		if (address.family === "IPv4" && !address.internal) {
// 			addresses.push(address.address)
// 		}
// 	}
// }

console.log("start server")
// console.log("IP Address:" + addresses[0])
console.log("version " + SETTINGS.version)
console.log("patch " + SETTINGS.patch_version)
// function ROOMS.get(name: string): Room {
// 	return ROOMS.get(name)
// }
function errorHandler(err: any, req: any, res: any, next: any) {
	res.send("error!!" + err)
}

export const io = new Server(httpserver, {
	cors: {
		origin: "http://127.0.0.1:" + PORT,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
		credentials: true
	},
	allowEIO3: true
})

//for using sessing in socket.io
io.use((socket, next) => {
	let req = socket.request as any
	let res = req.res as any
	session(req, res, next as express.NextFunction)
})

io.on("listen", function () {
	console.log("listen to socket")
})
io.on("error", function (e: any) {
	console.log(e)
})



io.on("connection", function (socket: Socket) {
	//console.log(`${socket.id} is connected`)
	require("./sockets/RoomSocket")(socket)
	require("./sockets/RpgRoomSocket")(socket)
	require("./Marble/MarbleRoomSocket")(socket)
})


app.get("/connection_check", function (req:any, res:any) {
	res.end()
})
app.get("/notfound", function (req:any, res:any) {
	res.render("error",{status:404})
})
app.get("/servererror", function (req:any, res:any) {
	res.render("error",{status:500})
})
/*

app.get("/session", async function (req:any, res:any) {

	req.session.userId="hi"
	res.cookie("username", "donald_trump");
	let val=hexId()
	const value = await redisClient.get('donald_trump:key');
	console.log("current value "+value)
	console.log("set value to "+val)
	await redisClient.set('donald_trump:key',val);

	return res.end("404 not found")
})
*/
// app.get("/mode_selection", function (req, res, next) {})

// app.get("/check_players", function (req, res) {})


// app.get("/getobs_kor", function (req, res) {

// })
// app.post("/chat", function (req, res) {
// 	console.log("chat " + req.body.msg + " " + req.body.turn)
// 	let room = R.getRoom(req.session.roomname)
// 	if (!room) {
// 		return
// 	}
// 	io.to(req.session.roomname).emit(
// 		"server:receive_message",
// 		room.user_message(req.body.turn,req.body.msg)
// 	)
// 	res.end("")
// })
/*
app.post("/reset_game", function (req:any, res:any) {
	//console.log(req.session)
	let rname = req.session.roomname
	//console.log("reset"+rname)
	if (!R.hasRoom(rname)) return

	if(R.hasMarbleRoom(rname))
		R.getMarbleRoom(rname)?.reset()
	else
		R.getRPGRoom(rname)?.reset()

	R.remove(rname)
	io.to(rname).emit("server:quit")
	delete req.session.turn
	// req.session.destroy((e)=>{console.error("session destroyed")})
	res.redirect("/")
})



//depricated
function writeStat(stat: any, isSimulation: boolean) {
	let date_ob = new Date()
	let date = ("0" + date_ob.getDate()).slice(-2)

	// current month
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2)
	// current hours
	let hours = date_ob.getHours()

	// current minutes
	let minutes = date_ob.getMinutes()

	// current seconds
	let seconds = date_ob.getSeconds()

	let currenttime = month + "_" + date + "_" + hours + "_" + minutes + "_" + seconds
	//new Date().toISOString().slice(5, 19).replace(':', ' ').replace('T', ' ')
	console.log(currenttime)
	if (isSimulation) {
		currenttime += "(Simulation)"
	}

	fs.writeFile(__dirname + "/../stats/stat" + currenttime + ".txt", stat, (err) => {
		if (err) {
			console.log(err)
			throw err
		}
		console.log("The statistics have been saved!")
	})
}


// let coord = require("./../res/marble/map_coordinates.json")
// for(let c of coord){
//     c.x+=10
//     c.y+=10	
// }

// fs.writeFile(__dirname + "./../res/c.json", JSON.stringify(coord), (err) => {
//     if (err) {
//         console.log(err)
//         throw err
//     }
//     console.log("saved")
// })
/*
let list=[]
let korlist=[]
for(let i=0;i<obs.obstacles.length;++i){
	list.push({
		name:obs.obstacles[i].name,
		desc:obs.obstacles[i].desc,
	})
	korlist.push({
		name:kor.obstacles[i].name,
		desc:kor.obstacles[i].desc,
	})
}
console.log(JSON.stringify(list))
console.log(JSON.stringify(korlist))
*/