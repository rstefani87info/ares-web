/**
 * @author Roberto Stefani
 * @license MIT
 */
import express from 'express';
import expressSession from 'express-session';
import cors from 'cors';
import { json } from 'body-parser';
const server = express();
import aReS, { crypto ,  files} from '@ares/core';

import app, { isProduction, environments, md5Name } from '../../../app';
const permissionData = files.getFileContent('../../../app') ;

import { initAll } from './db';
initAll(server);

import { install } from '@ares/core/localAI';
install(server);

server.use(expressSession({
	secret: crypto.getMD5Hash('321party2024'),
	resave: false,
	saveUninitialized: true,
}));

server.use((req, res, next) => {
	isProduction = environments.filter(x => x.domain.toLowerCase() == req.hostname.toLowerCase() && x.type.toLowerCase() == 'production').length >= 0;
	console.log('app.isProduction='+isProduction);
	if (req.cookies && req.cookies[md5Name()]) {
		req.session.regenerate((err) => {
			if (!err) {
				req.session.openingTime=moment().toDate();
				req.session.id = getMD5Hash( req.get('user-agent')+' '+req.params['@clientUserId']+ moment(req.session.openingTime).format('YYYYMMDDHHmmss'));
				
			}
			next();
		});
	} else {
		next();
	}
});

// server.get('/', (req, res) => {
//   res.json(app);
// });

server.use(json());
server.use(cors());

server.listen(3000, () => {
	console.log('Server started on port 3000');
});