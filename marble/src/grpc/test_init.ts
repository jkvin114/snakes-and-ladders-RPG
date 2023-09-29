import { ServerUnaryCall, sendUnaryData } from "@grpc/grpc-js/build/src/server-call";
import { test } from "./services/test";
import { Server, ServerCredentials, ServerReadableStream, ServerWritableStream } from "@grpc/grpc-js";
import {loadSync} from '@grpc/proto-loader';
const PROTO_PATH = __dirname +'/proto/test.proto';
import {loadPackageDefinition} from '@grpc/grpc-js';

//https://javascript.plainenglish.io/building-a-grpc-client-and-server-with-node-js-1722fd46bf28
//https://github.com/improbable-eng/ts-protoc-gen
//https://blog.mechanicalrock.io/2022/04/08/getting-started-with-protobufs-and-typescript.html
const packageDefinition = loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
   
});

function balance(call: ServerUnaryCall<test.Int,test.Int>, callback: sendUnaryData<test.Int>) {
    // Perform necessary business logic
    console.log(call.request)
    const res = new test.Int();
    res.val=1
    callback(null, res);
}

function balance2(call: ServerUnaryCall<test.Int,test.Void>, callback: sendUnaryData<test.Void>) {
    // Perform necessary business logic
    console.log(call.request)
    const res = new test.Void();
    // res.setVal(1)
    callback(null, res);
}

function listFeatures(call:ServerWritableStream<test.Obj,test.Arr>) {
    // For each feature, check if it is in the given bounding box
    
    call.write(new test.Arr({arr:[0]}));
    console.log(call.request.payload)
    console.log(JSON.parse(call.request.payload))
    emit(call,1)
  }
  export const sleep = (m: any) => new Promise((r) => setTimeout(r, m))

  
async function emit(call:ServerWritableStream<test.Obj,test.Arr>,val:number) {
    for(let i=0;i<2;++i){

        await sleep(500)

        call.write(new test.Arr({arr:[val]}))
    }
    call.end()

}
let employee_proto:any = loadPackageDefinition(packageDefinition).test; //package test

const server = new Server();

server.bindAsync('0.0.0.0:50052', ServerCredentials.createInsecure(),()=>server.start());
console.log("start grpc server")
server.addService(employee_proto.Test.service, {
    Test:balance,
    Test1:balance2,
    EmitEvent:listFeatures
});