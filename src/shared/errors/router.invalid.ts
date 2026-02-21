import { Router } from "express";
import { NotFoundError } from "./responseErrors";
const router = Router();

const invalidRouterDetector = () => {
	throw NotFoundError("Invalid Route!");
};

router.use(invalidRouterDetector);

export default router;
