import express from 'express';

const app = express();

const port = 4123;
app.use(express.json());

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
