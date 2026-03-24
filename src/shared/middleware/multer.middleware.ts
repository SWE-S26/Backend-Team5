import multer, { memoryStorage } from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({ storage });
