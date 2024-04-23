import json
import numpy as np
from chartgen import *
import random

from chartgen.v1 import generate_v1
from chartgen.v2 import generate_v2


def lambda_handler(event, context):
    try:
        body = json.loads(event["body"])
        variance= body["variance"] if "variance" in body else 0.5
        scale= body["scale"] if "scale" in body else 100
        version = body["version"] if "version" in body else "1"
        seed =  body["seed"] if "seed" in body else random.randint(0,100000)
        if version=="1":
            arr,steep_increase,steep_decrease,trend_changes=generate_v1(scale,variance,seed=int(seed))
        else:
            arr,steep_increase,steep_decrease,trend_changes=generate_v2(scale,variance,seed=int(seed))
        return {
            "prices":arr,
            "steep_increase":steep_increase,
            "steep_decrease":steep_decrease,
            "trend_changes":trend_changes,
            "seed":str(seed)
        }
    except Exception as e:
        return {"error":str(e)}