import json, sys, redis, os

r_ip = '141.164.46.103'
r_pw = 'tsd9nnABwrfH7vxuq/5NbdIVtWfvhATqiwp/14mXnpJtybvhUbRk9bk9Mcj+pib/gYVjRfQW5RlkMSfZ'

r = redis.Redis(host=r_ip, port=6379, password=r_pw)

option = '' if len(sys.argv) == 1 else sys.argv[1]

def save_blog_entry(json_filename):
    with open('./json/{}'.format(json_filename), 'r') as json_file:
        json_data = json.load(json_file)

    with open('./html/{}'.format(json_data['content']), 'r') as f:
        content = f.read()

    json_data['content'] = content
    json_data = json.dumps(json_data)
    entry_num = json_filename.split('_')[1].split('.')[0]
    redis_res = r.set('blog_entry_{}'.format(entry_num), json_data)
    print('blog_entry_{}: saved {}'.format(entry_num, redis_res))

if option == '':
    json_files = [f for f in os.listdir('./json')]
    for jf in json_files:
        save_blog_entry(jf)

if option != '':
    save_blog_entry(option)