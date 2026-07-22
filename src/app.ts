import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authorizationRoutes from "./routes/authorization.routes.js";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 7077;



app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

app.use("/api", authorizationRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});