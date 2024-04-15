import numpy as np
import math
def interp(start,end,t):
    return start + (end-start)*t
def triDist(scale,mean,size):
    return mean + (np.random.random(size=size) + np.random.random(size=size)) *scale - scale
def clamp01(n):
    return min(max(n,0),1)

def clamp(n,start,end):
    return min(max(n,start),end)

def interp_rand(start,end,t,std=0.3):
    t = np.random.normal(t,std)
    t = clamp01(t)
    return interp(start,end,t)

def get_partition_points(length,count,offset_idx=0,limit_area=True,min_margin=0.0):
    """
    min_distance : minimum distance between points (when limit_area=True)
    """
    if not limit_area:
        points= np.random.choice(np.arange(1,length-1),size=count,replace=False) + offset_idx
        return np.sort(points)

    min_distance = clamp(min_margin,0,0.4)
    
    region_size = (length // (count+1) )
    margin = region_size * min_distance
    lim_region_size =  region_size - margin*2
    points = np.random.rand(count) * lim_region_size
    margin_start = length // (count+1)/2 + margin

    offsets=np.linspace(margin_start ,length-margin_start,count,endpoint=False)
    assert points.shape[0] == offsets.shape[0]

    return (points + offsets).astype(np.int64)
    

def oscilate(count):
    base=[-1,1]
    if np.random.rand() > 0.5:
        base = [1,-1]
    return np.tile(np.array(base),(count+1)//2)[:count].astype(np.float16)

def oscilate_val(count,val1,val2):
    base=[val1,val2]
    if np.random.rand() > 0.5:
        base = [val2,val1]
    return np.tile(np.array(base),(count+1)//2)[:count].astype(np.float16)

def get_slope(pos1,val1,pos2,val2):
    return (val2-val1)/(pos2-pos1+1e-1)
def rand_mask(count,p):
    return p > np.random.rand(count)
