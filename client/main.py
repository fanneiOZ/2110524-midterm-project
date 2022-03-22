import http.client
import json
from urllib.parse import urljoin, urlencode

target_host = 'http://localhost:3000'
domain_path = '/api'


def parse_url(uri, query_obj=None):
    query_obj = dict() if query_obj is None else query_obj
    query_obj = urlencode(query_obj)
    query_obj = f'?{query_obj}' if query_obj != '' else ''

    return urljoin(uri, query_obj)


def send_request(method, uri, query_obj=None, headers=None):
    query_obj = dict() if query_obj is None else query_obj
    headers = dict() if headers is None else headers
    url = f'{domain_path}{parse_url(uri, query_obj)}'
    conn = http.client.HTTPConnection('localhost:3000')
    conn.request(method, url, headers=headers)
    response = conn.getresponse()
    res = {
        'headers': response.headers,
        'body': json.loads(response.read().decode('utf-8')),
    }
    conn.close()

    return res


def create_query(query):
    return {'limit': 10000, **query}


def main():
    created_data_left = True
    updated_data_left = True
    deleted_data_left = True

    query = dict()
    while created_data_left or updated_data_left or deleted_data_left:
        res = send_request(method='GET',
                           uri='/messages',
                           query_obj=create_query(query),
                           headers={'Accept': 'application/json', 'User-Agent': 'python/3.10'})

        deleted_data_left = res['headers']['x-delete-cursor'] != 'null'
        if deleted_data_left:
            query['delete_cursor'] = res['headers']['x-delete-cursor']

        created_data_left = res['headers']['x-create-cursor'] != 'null'
        if created_data_left:
            query['create_cursor'] = res['headers']['x-create-cursor']

        updated_data_left = res['headers']['x-update-cursor'] != 'null'
        if updated_data_left:
            query['update_cursor'] = res['headers']['x-update-cursor']


main()
