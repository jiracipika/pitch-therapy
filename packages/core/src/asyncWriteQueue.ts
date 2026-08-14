/**
 * Minimal FIFO queue for durable storage writes.
 *
 * Mobile storage APIs are asynchronous and may resolve out of order. Serializing
 * writes prevents an older snapshot from overwriting a newer one. Individual
 * failures are reported and swallowed so later writes can recover automatically.
 */
export function createAsyncWriteQueue<T>(
  write: (value: T) => Promise<void>,
  onError: (error: unknown) => void = () => {},
) {
  let tail: Promise<void> = Promise.resolve();

  return {
    enqueue(value: T): Promise<void> {
      const operation = tail.then(() => write(value));
      tail = operation.catch((error) => {
        onError(error);
      });
      return tail;
    },
    flush(): Promise<void> {
      return tail;
    },
  };
}
