import { exec } from 'child_process';
import path from 'path';

export const backupDatabase = async () => {
  return new Promise<void>((resolve, reject) => {
    const uri = process.env.MONGO_URI; // same URI you use in mongoose
    const backupDir = path.join(
      process.cwd(),
      'db-backups',
      `backup-${Date.now()}`,
    );

    const command = `mongodump --uri="${uri}" --out="${backupDir}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Backup failed:', error);
        return reject(error);
      }

      console.log('Backup completed at:', backupDir);
      resolve();
    });
  });
};
