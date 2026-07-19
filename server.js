import { app } from './lib/app.js';

const PORT = process.env.PORT || 3456;
app.listen(PORT, '0.0.0.0', () => console.log(`Edgar Cayce app on http://0.0.0.0:${PORT}`));