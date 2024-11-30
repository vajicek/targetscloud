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


def user(user_no, username, trainings):
    return {
        "id": user_no,
        "name": username,
        "trainings": trainings,
        "friends": [],
        "chats": [],
        "groups": []
    }


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

        users.insert_one(user(user_no, "joe_%s" % user_no, trainings))


def user_auth(user_id, username, password):
    salt = bcrypt.gensalt()
    return {
        "id": user_id,
        "username": username,
        "password": bcrypt.hashpw(password.encode('utf-8'), salt)
    }


def generate_user_auths(user_auths, users_count):
    user_auths.drop()

    for user_no in range(users_count):
        user_auths.insert_one(user_auth("%s" % user_no,
                                        "joe_%s" % user_no,
                                        'test'))


def add_user(users, user_auths, username, password):
    latest_user = users.find_one(sort=[("id", -1)])
    user_id = int(latest_user["id"]) + 1
    users.insert_one(user(user_id, username, []))
    salt = bcrypt.gensalt()
    user_auths.insert_one(user_auth(user_id,
                                    username,
                                    password))


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

    # Create subparsers
    subparsers = parser.add_subparsers(title="Operations",
                                       dest="operation",
                                       required=True)

    # Define 'subcommand1'
    parser_all = subparsers.add_parser("all", help="Generate all")

    # Define 'subcommand2'
    parser_add_user = subparsers.add_parser("add_user", help="Perform action 2")
    parser_add_user.add_argument("--username",
                                 type=str,
                                 required=True,
                                 help="Username")
    parser_add_user.add_argument("--password",
                                 type=str,
                                 required=True,
                                 help="User password")

    return parser.parse_args()


def main():
    logging.basicConfig(level=logging.INFO)
    args = get_args()
    client = get_mongo_client(args.uri)
    db = get_db(client, args.database)
    users = get_collection(db, "users")
    user_auths = get_collection(db, "user_auths")

    if args.operation == "all":
        generate_users(users, 5, 10, 10, 3)
        generate_user_auths(user_auths, 5)
    elif args.operation == "add_user":
        add_user(users, user_auths, args.username, args.password)

main()
