import fs = require("fs")
import { getCurrentTime } from "../util"


const DELIMITER=","
const LINEBREAK="\n"

export default class SimulationWriter{
    csvwriter:fs.WriteStream
    constructor(){
        this.csvwriter=fs.createWriteStream("stats/csv/marble_state_labels"+getCurrentTime()+".csv")
    }

    writeLabelCSV(vec:number[][]){
        let states=[]
        for(let state of vec){
            states.push(state.join(DELIMITER))
        }
        this.csvwriter.write(LINEBREAK+states.join(LINEBREAK))
    }
    onFinish(){
        if(this.csvwriter){
            this.csvwriter.close()
        }
    }
}