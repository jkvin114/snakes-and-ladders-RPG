
from flask import Flask, json,request
from chartgen import *
import random

from chartgen.v1 import generate_v1

api = Flask(__name__)
from flask_cors import CORS
CORS(api)

@api.route('/gen_stock', methods=['GET'])
def gen_stock():
    try:
        variance=request.args.get("variance", default=0.5, type=float)
        scale=request.args.get("scale", default=100, type=float)
        seed = random.randint(0,100000)
        arr,steep_increase,steep_decrease,trend_changes=generate_v1(scale,variance,seed=seed)
        return json.dumps({
            "prices":arr,
            "steep_increase":steep_increase,
            "steep_decrease":steep_decrease,
            "trend_changes":trend_changes,
            "seed":int(seed)
        }),200
    except Exception as e:
        print(e)
        return str(e),500
# CORS(api) 
def main():
    api.run(port=5050)

if __name__=="__main__":
    main()


