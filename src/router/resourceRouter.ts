import express = require('express');
import { R } from '../Room/RoomStorage';
import { MAP_TYPE } from '../RPGGame/data/enum';
import fs = require("fs")
import { MarbleRoom } from '../Marble/MarbleRoom';
const RESOURCE_PATH="/../../res/"
const router = express.Router()
const{MarbleItemPreset} = require("../mongodb/GameDBSchema")
const{Replay} = require("../mongodb/ReplayDBHandler")


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
router.get("/map/:mapId", function (req:express.Request, res:express.Response) {

	let mapId = Number(req.params.mapId)
	let filename="map.json"
	if (mapId === MAP_TYPE.OCEAN) {
		filename="ocean_map.json"
	} else if (mapId=== MAP_TYPE.CASINO) {
		filename="casino_map.json"
	}else if (mapId=== MAP_TYPE.RAPID) {
		filename="rapid_map.json"
	}
	
	fs.readFile(__dirname + RESOURCE_PATH + filename, "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting map file"})
		}
		res.end(data)
	})
})

router.get("/item", function (req:express.Request, res:express.Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"item_new.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting item file"})
		}
		res.end(data)
	})
})
router.get("/skill", function (req:express.Request, res:express.Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"skill.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting skill file"})
		}
		res.end(data)
	})
})
router.get("/obstacle", function (req:express.Request, res:express.Response) {
	//	console.log(req.query.lang)
	fs.readFile(__dirname + RESOURCE_PATH+"obstacle_data.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting obstacle file"})
		}
		res.end(data)
	})
	return
	if (req.query.lang === "kor") {
		
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
	if (req.query.lang === "kor") {
		fs.readFile(__dirname + RESOURCE_PATH+"string_resource_kor.json", "utf8", function (err, data) {
			if(err){
				res.status(500).send({err:"error while requesting resource file"})
			}
			res.end(data)
		})
	}
	else{
		fs.readFile(__dirname + RESOURCE_PATH+"string_resource.json", "utf8", function (err, data) {
			if(err){
				res.status(500).send({err:"error while requesting resource file"})
			}
			res.end(data)
		})
	}
	
})
router.get("/replay_format", function (req:express.Request, res:express.Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"replay_record_format.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting replay_record_format file"})
		}
		res.end(data)
	})
})

router.get("/replay/:replayid", async function (req:express.Request, res:express.Response) {
	let data=await Replay.findById(req.params.replayid)

	res.end(JSON.stringify(data))
})


router.get("/marble_map", function (req:express.Request, res:express.Response) {
	let room = R.getMarbleRoom(req.session.roomname)
	if (!room) {
		res.status(500).send({err:"error while requesting resource file"})
		return
	}
	if(room.getMapId===0){
		console.log("world_map")
		fs.readFile(__dirname + RESOURCE_PATH+"marble/world_map.json", "utf8", function (err, data) {
			if(err){
				res.status(500).send({err:"error while requesting resource file"})
			}
			res.end(data)
		})
	}
	else if(room.getMapId===1){
		console.log("godhand_map")
		fs.readFile(__dirname + RESOURCE_PATH+"marble/godhand_map.json", "utf8", function (err, data) {
			if(err){
				res.status(500).send({err:"error while requesting resource file"})
			}
			res.end(data)
		})
	}
	
})

router.get("/marble_map_coordinates", function (req:express.Request, res:express.Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"marble/map_coordinates.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting resource file"})
		}
		res.end(data)
	})
})

router.get("/marble_items", function (req:express.Request, res:express.Response) {
	let data={}
	res.end(JSON.stringify(MarbleRoom.ItemDescriptionCache))
})
router.get("/marble_item_presets", async function (req:express.Request, res:express.Response) {
	fs.readFile(__dirname + RESOURCE_PATH+"marble/marbleitempresets.json", "utf8", function (err, data) {
		if(err){
			res.status(500).send({err:"error while requesting resource file"})
		}
		res.end(data)
	})
	
	return

	try{

		let data=await MarbleItemPreset.findAll()

		res.end(JSON.stringify(data))
	}
	catch(e){
		console.error(e)
		res.status(500).end()
	}
})

router.post("/marble_item_presets", async function (req:express.Request, res:express.Response) {
	if(!req.body) return
	try{

		
		await MarbleItemPreset.create({
			name:req.body.name,
			items:req.body.items,
			randomCount:req.body.randcount
		})
		res.status(200).end()
	}
	catch(e){
		console.error(e)
		res.status(500).end()
	}
	
})


module.exports=router