#!/usr/bin/env python3
import pymongo
import logging
import random

def get_mongo_client():
    client = pymongo.MongoClient("localhost",
                                 27017,
                                 password="secret",
                                 username="mongoadmin")
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


client = get_mongo_client()
db = get_db(client, "local")
users = get_collection(db, "users")
generate_users(users, 1, 10, 10, 3)
