import jwt from 'jsonwebtoken';

import { logger } from './logging';


export function authenticationInterceptor(req: any,
	res: any,
	next: any,
	secret: string,
	exceptions: string[]): any {

	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(' ')[1];

	if (exceptions.includes(req.path)) {
		logger.debug(`Authentication skipped, path=${req.path}`);
		next();
		return;
	}

	if (!token) {
		const msg: string = "Access denied. No token provided.";
		logger.error(msg);
		return res.status(401)
			.json({ message: msg });
	}

	try {
		const decoded = jwt.verify(token, secret);
		req.user = decoded;
		next();
	} catch (error) {
		const msg: string = "Access denied. Invalid token."
		logger.error(msg);
		res.status(403)
			.json({ message: msg });
	}
}
