
import Jwt from "jsonwebtoken"
import express=require("express")

const key="key"
declare module 'jsonwebtoken' {
    export interface CustomJwtPayload extends Jwt.JwtPayload {
        id: string
    }
}

function extractTokenPayload (req:express.Request) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return decodeToken(req.headers.authorization.split(' ')[1]);
    }
    return null;
}
function decodeToken(token:string){
	try{
		return Jwt.verify(token,key)
	}
	catch(e){
		console.error("Failed to verify jwt")
		console.error(e)
		return null
	}
}
export function getSessionId(req:express.Request){
	let token=extractTokenPayload(req) as Jwt.CustomJwtPayload
	if(token) return token.id
	return null
}
export function getNewJwt(id:string){
	return Jwt.sign({id:id},key)
}