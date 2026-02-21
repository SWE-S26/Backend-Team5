// user.routes.ts
import { Router } from "express";
import { UserController } from "./user.controller";

const router = Router();
const controller = new UserController();

router.post("/register", controller.register.bind(controller));
router.post("/login", controller.login.bind(controller));

// ! MAKE SURE THESE STAY IN THE END OF ANY ROUTE
// ! THEY WILL KILL ALL ROUTES AFTER THEM
router.get("/", controller.list.bind(controller));
router.get("/:id", controller.getById.bind(controller));
router.patch("/:id", controller.update.bind(controller));

export default router;
