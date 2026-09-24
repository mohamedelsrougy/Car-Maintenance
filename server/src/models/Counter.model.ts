import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const counterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false },
);

export type Counter = InferSchemaType<typeof counterSchema>;
export type CounterModel = Model<Counter> & {
  getNextSequence(
    key: string,
    session?: mongoose.ClientSession,
  ): Promise<number>;
};

counterSchema.statics.getNextSequence = async function getNextSequence(
  key: string,
  session?: mongoose.ClientSession,
): Promise<number> {
  const doc = await this.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true, session },
  );

  if (!doc) {
    throw new Error(`Failed to allocate sequence for ${key}`);
  }

  return doc.seq;
};

export const Counter = mongoose.model<Counter, CounterModel>('Counter', counterSchema);
