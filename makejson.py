from itertools import islice
import json

with open("colorbv.cmap") as color_file:
    color_choices = [[float(x) for x in l.split()] for l in color_file]

with open("stars.speck") as f:
    lines = list(f)

vert_data = []
brightness_data = []
color_data = []
for line in lines:
    items = line.split()
    vert_data.extend([float(x) for x in items[:3]])
    #print len(brightness_data)
    brightness_data.append(float(items[4]))
    color_index = int((float(items[3]) + .5) / 2.5 * 255)
    color_index = max(0, color_index)
    color_index = min(255, color_index)
    color_data.extend(color_choices[color_index])

output_text = """
var vertex_data = {vertex_data};
var brightness_data = {brightness_data};
var color_data = {color_data};
""".format(vertex_data=vert_data, brightness_data=brightness_data, color_data=color_data)
with open("data.js", "w") as outf:
    outf.write(output_text)
