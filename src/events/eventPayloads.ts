// --- Auth Events ---
export type AuthEvent =
  | {
      type: 'auth:registered';
      payload: {
        userId: string;
        email: string;
        name: string;
      };
    }
  | {
      type: 'auth:password-reset-requested';
      payload: {
        userId: string;
        email: string;
        resetToken: string;
      };
    }
  | {
      type: 'auth:account-deleted';
      payload: {
        userId: string;
        email: string;
      };
    };
