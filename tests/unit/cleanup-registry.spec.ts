import { test, expect } from '@playwright/test';
import { CleanupRegistry } from '@fixtures/index';

/**
 * Pure unit tests for the FILO teardown registry.
 * Exercises ordering, error aggregation and the expected-404 filtering that
 * the integration suites never trigger.
 */
test.describe('CleanupRegistry (unit) @unit', () => {
  test('resolves without error when no tasks are registered', async () => {
    const registry = new CleanupRegistry();

    await expect(registry.runCleanup()).resolves.toBeUndefined();
  });

  test('runs deferred tasks in FILO (reverse registration) order', async () => {
    const registry = new CleanupRegistry();
    const order: number[] = [];

    registry.defer(async () => void order.push(1));
    registry.defer(async () => void order.push(2));
    registry.defer(async () => void order.push(3));

    await registry.runCleanup();

    expect(order).toEqual([3, 2, 1]);
  });

  test('drains the task stack so a second run is a no-op', async () => {
    const registry = new CleanupRegistry();
    let runs = 0;
    registry.defer(async () => void (runs += 1));

    await registry.runCleanup();
    await registry.runCleanup();

    expect(runs).toBe(1);
  });

  test('ignores a successful ApiResponse-shaped result', async () => {
    const registry = new CleanupRegistry();
    registry.defer(async () => ({ status: 201, statusText: 'Created' }));

    await expect(registry.runCleanup()).resolves.toBeUndefined();
  });

  test('treats a returned 404 status as an acceptable already-deleted state', async () => {
    const registry = new CleanupRegistry();
    registry.defer(async () => ({ status: 404, statusText: 'Not Found' }));

    await expect(registry.runCleanup()).resolves.toBeUndefined();
  });

  test('aggregates a returned error status into a thrown failure', async () => {
    const registry = new CleanupRegistry();
    registry.defer(async () => ({ status: 500, statusText: 'Server Error' }));

    await expect(registry.runCleanup()).rejects.toThrow(/500 Server Error/);
  });

  test('swallows a thrown error whose message mentions 404', async () => {
    const registry = new CleanupRegistry();
    registry.defer(async () => {
      throw new Error('Request failed with status 404');
    });

    await expect(registry.runCleanup()).resolves.toBeUndefined();
  });

  test('swallows a thrown error carrying a status property of 404', async () => {
    const registry = new CleanupRegistry();
    registry.defer(async () => {
      throw Object.assign(new Error('gone'), { status: 404 });
    });

    await expect(registry.runCleanup()).resolves.toBeUndefined();
  });

  test('propagates a genuine thrown error and reports the failure count', async () => {
    const registry = new CleanupRegistry();
    registry.defer(async () => {
      throw new Error('boom-a');
    });
    registry.defer(async () => {
      throw new Error('boom-b');
    });

    await expect(registry.runCleanup()).rejects.toThrow(/2 failure\(s\)/);
  });

  test('coerces a non-Error throwable into a reported failure', async () => {
    const registry = new CleanupRegistry();
    registry.defer(async () => {
      throw 'plain string failure';
    });

    await expect(registry.runCleanup()).rejects.toThrow(/plain string failure/);
  });
});
