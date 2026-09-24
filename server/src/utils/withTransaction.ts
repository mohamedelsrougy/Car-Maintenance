import mongoose from 'mongoose';

export async function withTransaction<T>(
  work: (session: mongoose.ClientSession) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}
