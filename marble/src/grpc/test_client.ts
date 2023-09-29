import { credentials } from "@grpc/grpc-js"
import { test } from "./services/test"

const client = new test.TestClient("localhost:50051", credentials.createInsecure())
export function grpctest() {
	const request = new test.Int()
	request.val = 1
	client.Test(request, (error: any, res: test.Int | undefined) => {
		if (res) console.log(res.val)
	})
}
export function streamTest() {
    let st=JSON.stringify({foo:"bar",g:[{hi:"hi"},{hi:"hi3"},{hi:"hi2"}]})
	console.log(st)
	
	
	const stream = client.EmitEvent(
		new test.Obj({
			payload:st 
    	})
	)
	stream.on("data", (data) => {
		console.log(data.arr)
	})
	stream.on("end", () => {
		console.log("end stream")
	})
}

grpctest()
streamTest()
