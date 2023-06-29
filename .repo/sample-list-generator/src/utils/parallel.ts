export class ParallelController {
  limit: number = 0;
  queue: (() => void)[] = [];

  constructor(limit: number) {
    this.limit = ~~limit;
  }

  async start() {
    if (this.limit === 0) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    } else {
      this.limit--;
    }
  }

  async finish() {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      if (resolve) {
        resolve();
      } else {
        this.limit++;
      }
    }
  }
}
