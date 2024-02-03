import matplotlib.pyplot as plt

from chartgen.v2 import generate_v2
from chartgen.v1 import generate_v1

arr,steep,_,trend=generate_v2(100,0.5)
    # print(steep)
    # print(trend)
plt.plot(arr)
plt.show()