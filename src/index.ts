import express, { Request, Response, Application } from "express";

const app: Application = express();
const port: number = 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
