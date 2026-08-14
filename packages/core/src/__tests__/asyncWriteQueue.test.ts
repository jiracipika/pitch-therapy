import { describe, expect, it } from "vitest";
import { createAsyncWriteQueue } from "../asyncWriteQueue";

describe("createAsyncWriteQueue", () => {
  it("serializes writes so an older snapshot cannot finish after a newer one", async () => {
    const committed: number[] = [];
    let releaseFirst: (() => void) | undefined;
    const queue = createAsyncWriteQueue<number>(async (value) => {
      if (value === 1)
        await new Promise<void>((resolve) => {
          releaseFirst = resolve;
        });
      committed.push(value);
    });

    const first = queue.enqueue(1);
    const second = queue.enqueue(2);
    await Promise.resolve();
    expect(committed).toEqual([]);
    releaseFirst?.();
    await Promise.all([first, second]);

    expect(committed).toEqual([1, 2]);
  });

  it("continues processing after a failed write and reports each failure", async () => {
    const failures: string[] = [];
    const committed: number[] = [];
    const queue = createAsyncWriteQueue<number>(
      async (value) => {
        if (value === 1) throw new Error("offline");
        committed.push(value);
      },
      (error) => failures.push(error instanceof Error ? error.message : String(error)),
    );

    await Promise.all([queue.enqueue(1), queue.enqueue(2)]);

    expect(failures).toEqual(["offline"]);
    expect(committed).toEqual([2]);
  });
});
