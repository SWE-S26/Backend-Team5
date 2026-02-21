import { Router } from "express";
const router = Router();

import swaggerUi from "swagger-ui-express";
import combinedSwaggerDoc from "./swagger.integration";
router.use("/docs", swaggerUi.serve, swaggerUi.setup(combinedSwaggerDoc));

import userRoutes from "../user/user.routes";
router.use("/users", userRoutes);





export default router;
