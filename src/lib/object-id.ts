import mongoose from 'mongoose';

export function isValidObjectId(value: string) {
  return mongoose.Types.ObjectId.isValid(value);
}
