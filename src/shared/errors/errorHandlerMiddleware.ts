import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { HttpError } from "./responseErrors";

export const errorHandler = (
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	// Zod validation errors
	if (err instanceof ZodError) {
		return res.status(400).json({
			message: "Validation failed",
			errors: err.issues.map((issue) => ({
				field: issue.path.join("."),
				message: issue.message,
			})),
		});
	}

	// Custom HttpErrors
	if (err instanceof HttpError) {
		return res.status(err.status).json({ message: err.message });
	}

	console.error("Error: ", err);
	// Fallback for unexpected errors
	return res.status(500).json({ message: "Internal server error" });
};
