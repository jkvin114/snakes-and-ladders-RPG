import express = require('express');
import { R } from '../RoomStorage';
import { MAP_TYPE } from '../data/enum';
import fs = require("fs")
const RESOURCE_PATH="/../../res/"
const router = express.Router()

router.get("/gamesetting", function (req:express.Request, res:express.Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"gamesetting.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting game setting file"})
		}
		res.end(data)
	})
})
router.get("/simulationsetting", function (req:express.Request, res:express.Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"simulationsetting.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting simulation setting file"})
		}
		res.end(data)
	})
})
router.get("/globalsetting", function (req:express.Request, res:express.Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"globalsettings.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting global setting file"})
		}
		res.end(data)
	})
})
router.get("/visualeffects", function (req:express.Request, res:express.Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"visualeffects.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting visualeffects setting file"})
		}
		res.end(data)
	})
})
router.get("/map", function (req:express.Request, res:express.Response) {
	let room = R.getRoom(req.session.roomname)
	if (!room) {
		return
	}
	if (room.getMapId() === MAP_TYPE.OCEAN) {
		fs.readFile(__dirname + RESOURCE_PATH+"ocean_map.json", "utf8", function (err, data) {
			if(err){
				res.status(500).send({err:"error while requesting map file"})
			}
			res.end(data)
		})
	} else if (room.getMapId()=== MAP_TYPE.CASINO) {
		fs.readFile(__dirname + RESOURCE_PATH+"casino_map.json", "utf8", function (err, data) {
			if(err){
				res.status(500).send({err:"error while requesting map file"})
			}
			res.end(data)
		})
	} else {
		
		fs.readFile(__dirname + RESOURCE_PATH+"map.json", "utf8", function (err, data) {
			if(err){
				res.status(500).send({err:"error while requesting map file"})
			}
			res.end(data)
		})
	}
})

router.get("/item", function (req:express.Request, res:express.Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"item.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting item file"})
		}
		res.end(data)
	})
})

router.get("/obstacle", function (req:express.Request, res:express.Response) {
	//	console.log(req.query.lang)
	if (req.query.lang === "kor") {
		fs.readFile(__dirname + RESOURCE_PATH+"obstacles_kor.json", "utf8", function (err, data) {
			if(err){
				res.status(500).send({err:"error while requesting obstacle file"})
			}
			res.end(data)
		})
	} else {
		fs.readFile(__dirname + RESOURCE_PATH+"obstacles.json", "utf8", function (err, data) {
			if(err){
				res.status(500).send({err:"error while requesting obstacle file"})
			}
			res.end(data)
		})
	}
})

router.get("/string_resource", function (req:express.Request, res:express.Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"string_resource.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting resource file"})
		}
		res.end(data)
	})
})
router.get("/marble_map", function (req:express.Request, res:express.Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"marble/godhand_map.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting resource file"})
		}
		res.end(data)
	})
})

router.get("/marble_map_coordinates", function (req:express.Request, res:express.Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"marble/map_coordinates.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting resource file"})
		}
		res.end(data)
	})
})



module.exports=router