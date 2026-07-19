import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 7077;



app.use(cors());
app.use(helmet());
app.use(express.json());


app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});