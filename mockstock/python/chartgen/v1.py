import numpy as np
import matplotlib.pyplot as plt
import math

from chartgen.util import *

def stable_trend_partition(offset,points,val1,val2,variance):
    point_mean_values = np.linspace(val1,val2,points.shape[0]+1,endpoint=False)[1:]

    #진동수렴 
    decay_rate = np.random.uniform(0.9,1) if np.random.rand() > 0.7 else np.random.uniform(0.6,0.9)
    std_decay = decay_rate ** np.arange(points.shape[0])
    std = std_decay * variance * 0.2  + 0.1
    mul = oscilate(points.shape[0]) * rand_mask(points.shape[0],0.7)
    mul *= (rand_mask(points.shape[0],0.7).astype(np.float16) * 1.5)
    #상방/하방 저지선 
    if np.random.rand() > 0.7:
        std *= np.random.uniform(1.2,2)
        mul *= oscilate_val(points.shape[0],0,1)

    point_mean_values += np.random.normal(std,std/1.3,size=points.shape[0]) * mul
    anchors=[]
    for i in range(points.shape[0]):
        anchors.append([points[i]+offset,point_mean_values[i]])
    return anchors



def increase_trend_partition(offset,points,val1,val2,logslope,variance):
    count = points.shape[0]
    point_mean_values = np.linspace(val1,val2,count+1,endpoint=False)[1:]


    if np.random.rand() > 0.4:
        space=np.geomspace(0.1,val2-val1,count+1,endpoint=False)[1:]
        point_mean_values = space + val1

    std =  variance * 0.2 + logslope/20
    std *=0.5
    mul = oscilate_val(points.shape[0],1,-1.8) * rand_mask(points.shape[0],0.8)

    point_mean_values += np.random.normal(std,std/1.3,size=points.shape[0]) * mul

    anchors=[]

    for i in range(points.shape[0]):
        anchors.append([points[i]+offset,point_mean_values[i]])
    return anchors
def decrease_trend_partition(offset,points,val1,val2,logslope,variance):
    count = points.shape[0]
    point_mean_values = np.linspace(val1,val2,count+1,endpoint=False)[1:]
    if np.random.rand() > 0.5:
        space=np.geomspace(0.1,val1-val2,count+1,endpoint=False)[1:]
        # print(space)
        point_mean_values = val1-space

    std =  variance * 0.2  + logslope/20
    std *=0.5
    mul = oscilate_val(points.shape[0],1.8,-1) * rand_mask(points.shape[0],0.8)

    point_mean_values += np.random.normal(std,std/1.3,size=points.shape[0]) * mul

    anchors=[]

    for i in range(points.shape[0]):
        anchors.append([points[i]+offset,point_mean_values[i]])
    return anchors

def generate_v1(scale,variance,seed=None):
    if seed:
        np.random.seed(seed)
    
    variance = clamp(variance,0,1)



    target_len = 3000
    min_partition_margin=interp(0.1,0,variance)
    trend_point_count = int(interp_rand(3,5,variance,std=0.5))
    mul1= oscilate(trend_point_count)
    points1 = get_partition_points(target_len,trend_point_count-2,limit_area=True,min_margin=min_partition_margin)
    anchors = []

    approx_trand_change_points=points1.astype(np.float32)
    steep_decrease_points=[]
    steep_increase_points=[]
    #octave 1======================================
    values = np.random.triangular(0,variance/3+0.1,1+variance*2,size=trend_point_count)*mul1
    anchors.append([0,values[0]])
    for i in range(1,trend_point_count-1):
        anchors.append([points1[i-1],values[i]])
    anchors.append([target_len-1,values[-1]])

    #octave 2==========================================
    anchors2=[]
    mean_partition_len = 100
    for i in range(len(anchors)-1):
        pos1,val1 = anchors[i]
        pos2,val2 = anchors[i+1]
        length = pos2-pos1
        slope = get_slope(pos1,val1*target_len,pos2,val2*target_len)

        logslope = max(1,np.log2(abs(slope)))
        partition_count = max(2,int(np.random.normal(length/ mean_partition_len,1.2)*logslope))
        

        anchors2.append(anchors[i])
        #stable trend
        if abs(slope) < interp(0.5,4,variance):
            points2 = get_partition_points(length,partition_count-1,limit_area=True,min_margin=min_partition_margin*0.5)
            anchors2.extend(stable_trend_partition(pos1,points2,val1,val2,variance))
            continue

        points2 = get_partition_points(length,partition_count-1,limit_area=False,min_margin=min_partition_margin*1.5)

        if slope > 0: #increasing trend
            anchors2.extend(increase_trend_partition(pos1,points2,val1,val2,logslope,variance))
        else:  #decreasing trend
            anchors2.extend(decrease_trend_partition(pos1,points2,val1,val2,logslope,variance))
    anchors2.append(anchors[-1])
    pos_change_offest=0
    
    y_offset = 0.7
    anchors3=[[anchors2[0][0],anchors2[0][1]+y_offset]]

    #make steep slopes longer, reduce too long partitions=====================
    for i in range(len(anchors2)-1):
        pos1,val1 = anchors2[i]
        pos2,val2 = anchors2[i+1]
        length = pos2-pos1
        slope = get_slope(pos1,val1*target_len,pos2,val2*target_len)

        offset_change = 0
        if length/target_len > 0.1:
            offset_change= - (length - int(target_len*0.1))
        elif abs(slope) > 7:
            offset_change = np.random.randint(20,30)
            if slope >0:
                steep_decrease_points.append(int(pos2+pos_change_offest))
            else:
                steep_increase_points.append(int(pos2+pos_change_offest))
        pos_change_offest+=offset_change

        anchors3.append([pos2+pos_change_offest,val2+y_offset])
    
    approx_trand_change_points *= (target_len + pos_change_offest) / target_len

    anchors4=[anchors3[0]]
    for i in range(len(anchors3)-1):
        pos1,val1 = anchors3[i]
        pos2,val2 = anchors3[i+1]
        length = pos2-pos1
        slope = get_slope(pos1,val1*target_len,pos2,val2*target_len)

        #octave 3
        if length > 35:
            count = length//35
            points3 = get_partition_points(length,count,min_margin=0.2) + pos1
            values = np.linspace(val1,val2,num=count+1,endpoint=False)[1:]
            values += np.random.normal(0,0.015*(length/40),count)
            for j in range(count):
                anchors4.append([points3[j],values[j]])

        anchors4.append([pos2,val2])

    # anchors3=np.array(anchors3)
    # plt.plot(anchors3[:,0],anchors3[:,1])
    # plt.show()
    # return  
    result = np.zeros(int(anchors4[-1][0]))
    for i in range(len(anchors4)-1):
        pos1,val1 = anchors4[i]
        pos2,val2 = anchors4[i+1]
        length = pos2-pos1
        slope = get_slope(pos1,val1*target_len,pos2,val2*target_len)
        logslope = max(1,np.log2(abs(slope)))
        values = np.linspace(val1,val2,length,endpoint=False)
        std = 0.002 * logslope * interp_rand(1,4,variance)
        #final noise
        noise = np.random.normal(0,std,size=length)
        result[pos1:pos1+length] = values + noise

    # plt.plot(result*scale)
    # plt.show()
    
    shift_amt = scale * interp_rand(3,0.7,variance)

    result = np.maximum(0,shift_amt + result * scale)
    return result.astype(np.int16).tolist(),steep_increase_points,steep_decrease_points,approx_trand_change_points.tolist()

# generatev2(100,0.8)
# for i in range(100):
#     generatev2(100,0.5)


def test_stats():
    for var in [0,0.2,0.4,0.6,0.8,1]:
        maxes=np.zeros(1000)
        delists=0
        for i in range(1000):
            arr,_,_,_=generate_v1(10,variance=var)
            maxes[i]=np.max(arr)
            if np.min(arr)<=0:
                delists +=1
        print(var)
        print(np.mean(maxes))
        print(delists)
        print()
if __name__=="__main__":
    pass
    test_stats()
    # arr,steep,_,trend=generatev2(100,0.2)
    # print(steep)
    # print(trend)
    # plt.plot(arr)
    # plt.show()

# # lens =[]
    
# print(min(lens))
# print(sum(lens)/len(lens))
# print()