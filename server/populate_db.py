#!/usr/bin/env python3
import argparse
import pymongo
import logging
import random
import bcrypt


def get_mongo_client(uri):
    client = pymongo.MongoClient(uri,
                                 server_api=pymongo.server_api.ServerApi('1'))
    logging.info(client.list_database_names())
    return client


def get_db(client, db_name):
    db = client[db_name]
    logging.info(db.list_collection_names())
    return db


def get_collection(db, collection_name):
    return db[collection_name]


def generate_users(users, users_count, trainings_count, sets_count, hits_count):
    users.drop()

    for user_no in range(users_count):
        trainings = []

        for training_no in range(trainings_count):
            sets = []
            for set_no in range(sets_count):
                set = {
                    "no": str(set_no),
                    "hits": [{
                        "angle": str(random.random() * 6.28),
                        "dist": str(random.random() * 10),
                        "note": "note"
                    } for _ in range(hits_count)]
                }
                sets.append(set)

            trainings.append({
                "id": "%d" % training_no,
                "timestamp": "123",
                "training_type": "type",
                "title": "title",
                "score": "1",
                "sets": sets
            })

        users.insert_one({
            "id": "%s" % user_no,
            "name": "joe_%s" % user_no,
            "trainings": trainings,
            "friends": [],
            "chats": [],
            "groups": []
        })


def generate_user_auths(user_auths, users_count):
    user_auths.drop()

    for user_no in range(users_count):
        salt = bcrypt.gensalt()
        user_auths.insert_one({
            "id": "%s" % user_no,
            "username": "joe_%s" % user_no,
            "password": bcrypt.hashpw('test'.encode('utf-8'), salt)
        })


def get_args():
    parser = argparse.ArgumentParser(
        prog='populate_db',
        description='Populate targetscloud database')

    parser.add_argument('-u', '--uri',
                        type=str,
                        default="mongodb://mongoadmin:secret@localhost:27017",
                        help="MongoDB connection uri")
    parser.add_argument('-d', '--database',
                        type=str,
                        default="master",
                        help="MongoDB database name")

    return parser.parse_args()


def main():
    logging.basicConfig(level=logging.INFO)
    args = get_args()
    client = get_mongo_client(args.uri)
    db = get_db(client, args.database)
    users = get_collection(db, "users")
    user_auths = get_collection(db, "user_auths")
    generate_users(users, 1, 10, 10, 3)
    generate_user_auths(user_auths, 1)

main()
