import { Schema, Types, model } from 'mongoose';

export type IBlockedList = {
  blockerId: Types.ObjectId;
  blockedIds: Types.ObjectId[];
};

const blockedListSchema = new Schema(
  {
    blockerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    blockedIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: false },
);

const BlockedList = model<IBlockedList>('BlockedList', blockedListSchema);
export default BlockedList;
