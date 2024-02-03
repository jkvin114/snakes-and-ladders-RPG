import fetch from "node-fetch";
import { Logger } from "../logger";
const URL="http://127.0.0.1:5000/prediction"
const stockgame_gen_url="http://127.0.0.1:5050"
export function extractNumber(str: string) {
	let s = str.match(/([0-9,.,\s]+)/g)?.join('')
	if (!s) return ''
	return s.replace(/[\s]{2,}/g," ")
}

export async function getPrediction(labels:string,playercount:number,map:number){
    return new Promise<string[]>(async (resolve,reject)=>{
        try{
            let response=await fetch(URL+`?count=${String(playercount)}&map=${map}&labels=${labels}`)
            const body = await response.text();
            if(body[0]==="[")
            {
                resolve(extractNumber(body).split(', ')) 
            }
            else resolve([])
        }
        catch(e){
            Logger.error("ERROR while fetching win prediction data",e)
           return resolve([])
        }
        return resolve([])
    })
}

export async function generateStockChart(variance:number,scale:number,version:string){
    return new Promise<string[]>(async (resolve,reject)=>{
        try{
            const data = await (
				await fetch(stockgame_gen_url + `/gen_stock?variance=${variance}&scale=${scale}&version=${version}`,{})
			).json()

            resolve(data)
        }
        catch(e){
            Logger.error("ERROR while fetching generating stock chart",e)
           return resolve(null)
        }
        return resolve(null)
    })
}
