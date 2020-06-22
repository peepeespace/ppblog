import json, sys, redis, os

r_ip = '141.164.46.103'
r_pw = 'tsd9nnABwrfH7vxuq/5NbdIVtWfvhATqiwp/14mXnpJtybvhUbRk9bk9Mcj+pib/gYVjRfQW5RlkMSfZ'

r = redis.Redis(host=r_ip, port=6379, password=r_pw)

with open('./entry_1.json', 'r') as json_file:
    json_data = json.load(json_file)

with open('./{}'.format(json_data['content']), 'r') as f:
    content = f.read()

json_data['content'] = content
json_data = json.dumps(json_data)
redis_res = r.set('blog_entry_1', json_data)
print(redis_res)