import { OAuth2Client } from 'google-auth-library';
import express from 'express';

import { logger } from './logging';
import * as controller from './controller';


export function setupRoutes(
	googleClientId: string,
	secret: string,
	models: Map<string, any>): express.Router {

	// Setup google authentication client
	logger.info(`Setting up google authentication client, googleClientId=${googleClientId}`);
	const googleClient = new OAuth2Client(googleClientId);

	logger.info(`Setting up route for /api`);
	const router = express.Router();
	router.get('/users', (req, res) =>
		controller.getAllUsers(req,
			res,
			models.get("users")));
	router.get('/users/search', (req, res) =>
		controller.searchUsers(req,
			res,
			models.get("users")));
	router.get('/users/:id', (req, res) =>
		controller.getUser(req,
			res,
			models.get("users")));
	router.get('/users/:id/friends', (req, res) =>
		controller.getFriends(req,
			res,
			models.get("users")));
	router.get('/users/:id/friendship', (req, res) =>
		controller.friendshipRequest(req,
			res,
			models.get("users")));

	// list groups and group participants for user
	router.get('/users/:id/groups', (req, res) =>
		controller.getGroups(req,
			res,
			models.get("users"),
			models.get("chats")));
	// create, delete, modify group
	router.get('/users/:id/group', (req, res) =>
		controller.groupRequest(req,
			res,
			models.get("users")));

	router.get('/users/:id/chats/:chatId', (req, res) =>
		controller.getChat(req,
			res,
			models.get("users"),
			models.get("chats")));
	router.put('/users/:id/sendmessage', (req, res) =>
		controller.sendMessage(req,
			res,
			models.get("users"),
			models.get("chats")));
	router.put('/users/:id', (req, res) =>
		controller.updateUser(req,
			res,
			models.get("users")));
	router.post('/login', (req, res) =>
		controller.login(req,
			res,
			models.get("users"),
			models.get("user_auths"),
			secret));
	router.post('/loginWithGoogle', (req, res) =>
		controller.loginWithGoogle(googleClient,
			googleClientId,
			req,
			res,
			models.get("users"),
			secret));

	return router;
}