// Netlify Function entry — ESM with a STATIC import so esbuild bundles lib/app.js
// into the function zip. (Dynamic import() isn't followed by the bundler.)
import serverlessHttp from 'serverless-http';
import { app } from '../../lib/app.js';

const handler = serverlessHttp(app);

export { handler };