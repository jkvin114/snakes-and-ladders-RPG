import fetch from "node-fetch";
const URL="http://127.0.0.1:5000/prediction"

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
            console.error("ERROR while fetching win prediction daa")
           return resolve([])
        }
        return resolve([])
    })
}