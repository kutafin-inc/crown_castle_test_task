// steps.ts
import type { TestType, TestInfo } from '@playwright/test';

const counters = new WeakMap<TestInfo, number>();
const nextIdx = (info: TestInfo) => {
  const n = (counters.get(info) ?? 0) + 1;
  counters.set(info, n);
  return n;
};

export function testMo(test: TestType<any, any>) {
  return async function step<T>(title: string, body: () => Promise<T>): Promise<T> {
    const info = test.info();
    const idx = nextIdx(info);

    try {
      return await test.step(title, async () => {
        const result = await body();
        info.annotations.push({ type: `step${idx}[passed]`, description: title });
        return result;
      });
    } catch (e) {
      info.annotations.push({ type: `step${idx}[failed]`, description: title });
      throw e;
    }
  };
}
