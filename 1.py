import json
with open('static/demo/kpts_background.json') as f:
    # j = f.read()
    data_b = json.load(f)
with open('static/demo/kpts_forground.json') as f:
    # j = f.read()
    data_f = json.load(f)
print(len(data_f))
print(len(data_b[0]))
print(len(data_b[0][0]))
for i in range(len(data_f)):
    data_f[i] = data_f[i] + data_b[i]
print(len(data_f[0]))
json.dump(data_f, open('static/demo/kpts_new.json', 'w'))