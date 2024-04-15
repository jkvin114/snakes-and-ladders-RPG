
from flask import Flask, json,request
from chartgen import *
import random

from chartgen.v1 import generate_v1
from chartgen.v2 import generate_v2
import os
PORT=os.environ.get('PORT',5050)
api = Flask(__name__)
from flask_cors import CORS
CORS(api)

@api.route('/gen_stock', methods=['GET'])
def gen_stock():
    try:
        variance=request.args.get("variance", default=0.5, type=float)
        scale=request.args.get("scale", default=100, type=float)
        version = request.args.get("version", default="1", type=float)
        seed =  request.args.get("seed", default=random.randint(0,100000), type=float) 
        if version=="1":
            arr,steep_increase,steep_decrease,trend_changes=generate_v1(scale,variance,seed=int(seed))
        else:
            arr,steep_increase,steep_decrease,trend_changes=generate_v2(scale,variance,seed=int(seed))
        return json.dumps({
            "prices":arr,
            "steep_increase":steep_increase,
            "steep_decrease":steep_decrease,
            "trend_changes":trend_changes,
            "seed":str(seed)
        }),200
    except Exception as e:
        print(e)
        return str(e),500
# CORS(api) 
def main():
    api.run(port=int(PORT),host="0.0.0.0")

if __name__=="__main__":
    main()


