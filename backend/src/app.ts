import { ArgumentParser } from 'argparse';
import bodyParser from 'body-parser';
import cors from 'cors';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';

import { logger } from './logging';
import { setupRoutes } from './routes';
import { authenticationInterceptor } from './auth';
import { connectToMongo } from './models';


function serveApi(args: any, models: Map<string, any>) {

	// Setup router for /api
	const router: express.Router = setupRoutes(args.googleclientid,
		args.secret,
		models);

	// Setup express
	logger.info(`Setting up express`);
	const app = express();
	app.use(cors());

	logger.info(`Setting up /api`);
	app.use('/api', (req, res, next) =>
		authenticationInterceptor(req,
			res,
			next,
			args.secret,
			["/login", "/loginWithGoogle"]));
	app.use(bodyParser.json());
	app.use('/api', router);

	// Logging access
	logger.info(`Setting up access log`);
	app.use((req, res, next) => {
		logger.debug(`${req.method} ${req.url} - ${req.ip}`);
		next();
	});

	// Setup hosting of Angular App
	logger.info(`Setting up static pages routing`);
	app.use(express.static(path.join(__dirname, 'browser')));
	app.get('*', (req, res) => {
		res.sendFile(path.join(__dirname, 'browser', 'index.html'));
	});

	// SSL Cert
	logger.info(`Getting SSL cert and key`);
	const options = {
		key: fs.readFileSync(args.privatekey),
		cert: fs.readFileSync(args.cert)
	};

	// Start server
	logger.info(`Starting server`);
	const server = https.createServer(options, app)
		.listen(args.port, () => {
			logger.info(`TargetsCloud backend listening on port ${args.port}!`)
		});

	// Handling shutdown
	process.on('SIGINT', () => {
		logger.info('Gracefully shutting down...');
		server.close(() => {
			logger.info('Server closed');
			process.exit(0);
		});
		// Force exit if close takes too long
		setTimeout(() => {
			logger.error('Forced shutdown');
			process.exit(1);
		}, 5000);
	});
}


function getArgs(): any {
	const parser = new ArgumentParser({
		description: 'TargetsCloud backend'
	});

	parser.add_argument('-v', '--verbose', {
		action: 'store_true',
		help: 'Enable verbose mode',
	});
	parser.add_argument('-c', '--cert', {
		help: 'SSL Certificate',
		default: 'cert.pem'
	});
	parser.add_argument('-k', '--privatekey', {
		help: 'SSL Private Key',
		default: 'key.pem'
	});
	parser.add_argument('-s', '--secret', {
		help: 'JWT Secret',
		default: crypto.randomBytes(32).toString('hex')
	});
	parser.add_argument('-p', '--port', {
		help: 'API port',
		default: 8000
	});
	parser.add_argument('-g', '--googleclientid', {
		help: 'Google Client ID',
		default: null
	});
	parser.add_argument('-m', '--mongodb', {
		help: 'MongoDB connection string',
		default: 'mongodb://mongoadmin:secret@localhost:27017/master?authSource=admin'
	});
	return parser.parse_args();
}


async function main() {
	const args: any = getArgs();

	if (args.verbose) {
		logger.level = 'debug';
	}

	const models: Map<string, any> = await connectToMongo(args.mongodb);
	serveApi(args, models);
}


main();
