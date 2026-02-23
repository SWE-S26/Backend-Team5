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

// --- Order Events ---
export type OrderEvent =
  | {
      type: 'order:placed';
      payload: {
        orderId: string;
        userId: string;
        items: { productId: string; quantity: number; price: number }[];
        totalAmount: number;
      };
    }
  | {
      type: 'order:cancelled';
      payload: {
        orderId: string;
        userId: string;
        reason: string;
      };
    }
  | {
      type: 'order:fulfilled';
      payload: {
        orderId: string;
        userId: string;
      };
    };
