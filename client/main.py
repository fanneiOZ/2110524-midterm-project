import http.client
import json
import os
import pandas as pd
import sys

from urllib.parse import urljoin, urlencode

TARGET_HOST = sys.argv[1] if len(sys.argv) >= 2 else 'localhost:3000'
INIT_RUN = len(sys.argv) == 3 and sys.argv[2] == 'new'

DOMAIN_PATH = '/api'
CREATED_TEMP_FILE_NAME = 'data/created_temp.csv'
UPDATED_TEMP_FILE_NAME = 'data/updated_temp.csv'
DELETED_TEMP_FILE_NAME = 'data/deleted_temp.csv'
OUTPUT_FILE_NAME = 'data/output.csv'
DEFAULT_HEADERS = {'Accept': 'application/json'}


def setup():
    os.makedirs('./data/', exist_ok=True)
    if INIT_RUN:
        create_dataframe([]).to_csv(OUTPUT_FILE_NAME, index=False, header=False)


def parse_url(uri, query_obj=None):
    query_obj = dict() if query_obj is None else query_obj
    query_obj = urlencode(query_obj)
    query_obj = f"?{query_obj}" if query_obj != "" else ""

    return urljoin(uri, query_obj)


def send_request(method, uri, query_obj=None, headers=None):
    query_obj = dict() if query_obj is None else query_obj
    headers = dict() if headers is None else headers
    url = f'{DOMAIN_PATH}{parse_url(uri, query_obj)}'
    conn = http.client.HTTPConnection(TARGET_HOST)
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


def create_dataframe(data):
    return pd.DataFrame(data, columns=['uuid', 'author', 'message', 'likes'])


def merge_result_set(updated_dataframe, deleted_dataframe):
    with open(OUTPUT_FILE_NAME) as file:
        for line in file:
            uuid = line.split(',')[0]
            if uuid in deleted_dataframe.index:
                continue
            if uuid in updated_dataframe.index:
                continue
            print(line.replace('\n', ''))

    for i, row in updated_dataframe.reset_index().iterrows():
        print(f"{row['uuid']},{row['author']},{row['message']},{row['likes']}")


def fetch_data():
    created_data_left = True
    updated_data_left = True
    deleted_data_left = True
    query = dict()
    updated_dataframe = create_dataframe([])
    deleted_dataframe = pd.DataFrame([], columns=['uuid'])

    while created_data_left or updated_data_left or deleted_data_left:
        res = send_request(method='GET', uri='/messages', query_obj=create_query(query), headers=DEFAULT_HEADERS)

        deleted_data_left = res['headers']['x-delete-cursor'] != 'null'
        if deleted_data_left:
            query['delete_cursor'] = res['headers']['x-delete-cursor']
            delete = list(map(lambda x: [x], res['body']['d'].split(',')))
            deleted_dataframe = pd.concat([deleted_dataframe, pd.DataFrame(delete, columns=['uuid'])])

        created_data_left = res['headers']['x-create-cursor'] != 'null'
        if created_data_left:
            query['create_cursor'] = res['headers']['x-create-cursor']
            create_dataframe(res['body']['c']).to_csv(OUTPUT_FILE_NAME, index=False, mode='a', header=False)

        updated_data_left = res['headers']['x-update-cursor'] != 'null'
        if updated_data_left:
            query['update_cursor'] = res['headers']['x-update-cursor']
            updated_dataframe = pd.concat([updated_dataframe, create_dataframe(res['body']['u'])])

    updated_dataframe.set_index('uuid', drop=True, inplace=True)
    deleted_dataframe.set_index('uuid', drop=True, inplace=True)

    return updated_dataframe, deleted_dataframe


def main():
    setup()
    updated_dataframe, deleted_dataframe = fetch_data()
    merge_result_set(updated_dataframe, deleted_dataframe)


main()
