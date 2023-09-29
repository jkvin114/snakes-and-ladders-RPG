
import { credentials } from "@grpc/grpc-js";
import { test } from "./services/test";
export function grpctest(){
    const client = new test.TestClient('localhost:50051',credentials.createInsecure());
    const request = new test.Int();
    request.val=123;
    client.Test(request, (error:any, response:test.Int) => {
        if (error) {
            console.error(error);
        } else {
            console.log(response.val);
        }
    });
}
grpctest()