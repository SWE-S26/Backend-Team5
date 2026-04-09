import { Schema, Types, model } from 'mongoose';

type NotificationActivityType =
  | 'follow'
  | 'like'
  | 'comment'
  | 'repost'
  | 'newTrack';

type INotificationPayload = {
  actorName: string;
  actorId: Types.ObjectId;
  avatarURL?: string;
  trackName?: string;
  trackId?: Types.ObjectId;
  commentText?: string;
};

type INotificationType = {
  type: NotificationActivityType;
  referenceId: Types.ObjectId;
  payload: INotificationPayload;
};

export type INotification = {
  to: Types.ObjectId;
  from: Types.ObjectId;
  type: INotificationType;
  read: boolean;
  createdAt: Date;
};

type NotificationTypeValidatorContext = {
  type: NotificationActivityType;
  missingFields: NotificationPayloadField[];
};

type NotificationTypeValidationTarget = {
  type?: NotificationActivityType;
  invalidate: (path: string, message: string) => void;
};

type NotificationPayloadField =
  | 'actorName'
  | 'actorId'
  | 'trackName'
  | 'trackId'
  | 'commentText';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const hasObjectIdValue = (value: unknown): boolean => {
  if (value instanceof Types.ObjectId) return true;
  if (typeof value === 'string') return Types.ObjectId.isValid(value);
  return false;
};

const requireStringField = (
  payload: Partial<INotificationPayload>,
  field: 'actorName' | 'trackName' | 'commentText',
  context: NotificationTypeValidatorContext,
): void => {
  if (!isNonEmptyString(payload[field])) {
    context.missingFields.push(field);
  }
};

const requireObjectIdField = (
  payload: Partial<INotificationPayload>,
  field: 'actorId' | 'trackId',
  context: NotificationTypeValidatorContext,
): void => {
  if (!hasObjectIdValue(payload[field])) {
    context.missingFields.push(field);
  }
};

const getMissingPayloadFieldsByType = (
  type: NotificationActivityType,
  payload: Partial<INotificationPayload>,
): NotificationPayloadField[] => {
  const missingFields: NotificationPayloadField[] = [];
  const context: NotificationTypeValidatorContext = {
    type,
    missingFields,
  };

  requireStringField(payload, 'actorName', context);
  requireObjectIdField(payload, 'actorId', context);

  if (type === 'like' || type === 'repost') {
    requireStringField(payload, 'trackName', context);
    requireObjectIdField(payload, 'trackId', context);
    return missingFields;
  }

  if (type === 'comment') {
    requireStringField(payload, 'commentText', context);
    requireObjectIdField(payload, 'trackId', context);
  }

  return missingFields;
};

const notificationPayloadSchema = new Schema(
  {
    actorName: {
      type: String,
      trim: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    avatarURL: {
      type: String,
      trim: true,
    },
    trackName: {
      type: String,
      trim: true,
    },
    trackId: {
      type: Schema.Types.ObjectId,
      ref: 'Track',
    },
    commentText: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const notificationTypeSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['follow', 'like', 'comment', 'repost', 'newTrack'],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    payload: {
      type: notificationPayloadSchema,
      required: true,
    },
  },
  { _id: false },
);

notificationTypeSchema.path('payload').validate(function (
  payload: Partial<INotificationPayload> | undefined,
) {
  const subDoc = this as unknown as NotificationTypeValidationTarget;

  if (!subDoc.type || !payload) {
    return true;
  }

  const missingFields = getMissingPayloadFieldsByType(subDoc.type, payload);

  for (const field of missingFields) {
    subDoc.invalidate(
      `payload.${field}`,
      `${field} is required for ${subDoc.type} notifications`,
    );
  }

  return missingFields.length === 0;
});

const notificationSchema = new Schema(
  {
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: notificationTypeSchema,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

const Notification = model<INotification>('Notification', notificationSchema);
export default Notification;
