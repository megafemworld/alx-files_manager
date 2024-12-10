import express from 'express';
import routes from './routes/index';

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/', routes);

app.listen(port, () => {
  console.log(`Server running on PORT: ${port}`);
});

export default app;
