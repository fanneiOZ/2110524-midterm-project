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
SAVE_FILE_NAME = 'data/save.conf'
OUTPUT_FILE_NAME = 'data/output.csv'
DEFAULT_HEADERS = {'Accept': 'application/json'}


def setup():
    os.makedirs('./data/', exist_ok=True)
    if INIT_RUN:
        if os.path.exists(SAVE_FILE_NAME):
            os.remove(SAVE_FILE_NAME)

        create_dataframe([]).to_csv(OUTPUT_FILE_NAME, index=False, header=False)
        create_dataframe([]).to_csv(DELETED_TEMP_FILE_NAME, index=False, header=False)


def load_state():
    f = open(SAVE_FILE_NAME, 'r')
    save = json.loads(f.read())
    f.close()

    return save


def save_state(query):
    f = open(SAVE_FILE_NAME, 'w')
    f.write(json.dumps(query))
    f.close()


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
            if uuid in deleted_dataframe.index or uuid in updated_dataframe.index:
                continue

            print(line.replace('\n', ''))

    for i, row in updated_dataframe.reset_index().iterrows():
        print(f"{row['uuid']},{row['author']},{row['message']},{row['likes']}")


def fetch_data():
    created_data_left = True
    updated_data_left = True
    deleted_data_left = True
    query = dict() if INIT_RUN else load_state()
    updated_dataframe = create_dataframe([])
    # deleted_dataframe = pd.DataFrame([], columns=['uuid'])

    while created_data_left or updated_data_left or deleted_data_left:
        res = send_request(method='GET', uri='/messages', query_obj=create_query(query), headers=DEFAULT_HEADERS)

        deleted_data_left = res['headers']['x-delete-cursor'] != 'null'
        if deleted_data_left:
            query['delete_cursor'] = res['headers']['x-delete-cursor']
            delete = list(map(lambda x: [x], res['body']['d'].split(',')))
            pd.DataFrame(delete, columns=['uuid']).to_csv(DELETED_TEMP_FILE_NAME, index=False, mode='a', header=False)

        created_data_left = res['headers']['x-create-cursor'] != 'null'
        if created_data_left:
            query['create_cursor'] = res['headers']['x-create-cursor']
            create_dataframe(res['body']['c']).to_csv(OUTPUT_FILE_NAME, index=False, mode='a', header=False)

        updated_data_left = res['headers']['x-update-cursor'] != 'null'
        if updated_data_left:
            query['update_cursor'] = res['headers']['x-update-cursor']
            updated_dataframe = pd.concat([updated_dataframe, create_dataframe(res['body']['u'])])

    updated_dataframe.set_index('uuid', drop=True, inplace=True)
    save_state(query)

    return updated_dataframe


def main():
    setup()
    updated_dataframe = fetch_data()
    deleted_dataframe = pd.read_csv(DELETED_TEMP_FILE_NAME, header=None, names=['uuid'])
    deleted_dataframe.set_index('uuid', drop=True, inplace=True)
    merge_result_set(updated_dataframe, deleted_dataframe)


main()
