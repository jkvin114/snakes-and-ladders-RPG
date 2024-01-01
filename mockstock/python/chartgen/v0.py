import numpy as np
import matplotlib.pyplot as plt


def fillSpace(arr,num_mean,num_std,min_bins):
    
    nums=np.maximum(np.random.normal(num_mean,num_std,size=arr.shape[0]-1).astype(np.int8),min_bins)
    newarr = np.zeros(0)

    for i in range(arr.shape[0]-1):
        a = np.linspace(arr[i],arr[i+1],num=nums[i],endpoint=False).squeeze()
        # print(a.shape)
        # print(newarr.shape)
        newarr=np.concatenate((newarr,a),axis=0)
    return newarr

def addNoise(arr,std):
    noise = np.random.normal(0,scale=std,size=arr.shape)
    return arr + noise

def addPercentNoise(arr,std):
    noise = np.random.normal(1,scale=std,size=arr.shape)
    return arr * noise

def interp(start,end,t):
    return start + (end-start)*t
def triDist(scale,mean,size):
    return mean + (np.random.random(size=size) + np.random.random(size=size)) *scale - scale
def generate_v1(value,variance=0.5,seed=None):
    """
    variance : 0 ~ 1
    
    """

    if seed:
        np.random.seed(seed)

    safety_offset= interp(1,0.2,variance)

    
    # print(bias)
    target_size=3000
    size1 = int(interp(4,7,variance))
    size2 = 15
    size3 = target_size // (size1*size2)
    

    size_final=size3*(size1*size2-1)

    std1 = interp(0.5,2,variance) ** 1.5
    std2 = std1/80# interp(0.05,0.25,variance)
    std3 = interp(0.005,0.025,variance)
    
    bias = np.random.normal(0,interp(0,0.4,variance))

    arr=triDist(0.5,0.5,(size1+1,1)) * std1 + safety_offset
    min_bins = int(interp(15,11,variance))
    arr = fillSpace(arr,size2,20,min_bins)
    arr = addPercentNoise(arr,std=std2)

    arr = fillSpace(arr,size3,25,5)
    arr = addNoise(arr,std=std3)
    # print(arr.shape)
    # print(bias_arr.shape)
    bias_arr = np.linspace(0,bias,arr.shape[0])

    return ((arr.squeeze() + bias_arr) * value).astype(np.int16)


def generate(scale,variance=0.5,seed=None):
    """
    variance : 0 ~ 1
    
    """
    variance*=2.5

    if seed:
        np.random.seed(seed)

    safety_offset= interp(1,0.2,variance)

    
    # print(bias)
    target_size=3000
    size1 = int(interp(1,7,variance))
    size2 = 15
    size3 = target_size // (size1*size2)
    

    size_final=size3*(size1*size2-1)

    std1 = interp(0.5,2,variance) ** 1.5
    std2 = std1/60# interp(0.05,0.25,variance)
    std3 = interp(0.005,0.025,variance)
    
    bias = np.random.normal(0,interp(0,0.4,variance))

    arr=triDist(0.5,0.5,(size1+1,1)) * std1 + safety_offset
    min_bins = int(interp(15,11,variance))
    arr = fillSpace(arr,size2,20,min_bins)
    arr = addPercentNoise(arr,std=std2)

    arr = fillSpace(arr,size3,25,3)
    arr = addNoise(arr,std=std3)
    # print(arr.shape)
    # print(bias_arr.shape)
    bias_arr = np.linspace(0,bias,arr.shape[0])

    return ((arr.squeeze() + bias_arr) * scale).astype(np.int16).tolist(),[],[]


if __name__=="__main__":

# # lens =[]
#     for var in [0,0.4,0.8,1,1.5,2]:
#         maxes=np.zeros(1000)
#         delists=0
#         for i in range(1000):
#             arr=generate(2,variance=var)
#             maxes[i]=np.max(arr)
#             if np.min(arr)<=0:
#                 delists +=1
#         print(var)
#         print(np.mean(maxes))
#         print(delists)
#         print()
# print(min(lens))
# print(sum(lens)/len(lens))
# print()
    plt.plot(generate(10,0.3))
    plt.show()
