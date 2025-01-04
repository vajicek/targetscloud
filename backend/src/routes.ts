import { OAuth2Client } from 'google-auth-library';
import express from 'express';

import { logger } from './logging';
import * as controller from './controller';


export function setupRoutes(
	googleClientId: string,
	secret: string): express.Router {

	// Setup google authentication client
	logger.info(`Setting up google authentication client, googleClientId=${googleClientId}`);
	const googleClient = new OAuth2Client(googleClientId);

	logger.info(`Setting up route for /api`);
	const router = express.Router();
	router.get('/users', (req, res) =>
		controller.getAllUsers(req, res));
	router.get('/users/search', (req, res) =>
		controller.searchUsers(req, res));
	router.get('/users/:id', (req, res) =>
		controller.getUser(req, res));
	router.get('/users/:id/friends', (req, res) =>
		controller.getFriends(req, res));
	router.get('/users/:id/friendship', (req, res) =>
		controller.friendshipRequest(req, res));

	// list groups and group participants for user
	router.get('/users/:id/groups', (req, res) =>
		controller.getGroups(req, res));
	// create, delete, modify group
	router.get('/users/:id/group', (req, res) =>
		controller.groupRequest(req, res));

	router.get('/users/:id/chats/:chatId', (req, res) =>
		controller.getChat(req, res));
	router.put('/users/:id/sendmessage', (req, res) =>
		controller.sendMessage(req, res));
	router.put('/users/:id', (req, res) =>
		controller.updateUser(req, res));
	router.post('/login', (req, res) =>
		controller.login(req, res, secret));
	router.post('/loginWithGoogle', (req, res) =>
		controller.loginWithGoogle(googleClient,
			googleClientId,
			req,
			res,
			secret));

	return router;
}