import { shuffleListingsForUser } from './randomOrder';

// Mock localStorage and crypto.randomUUID
const mockStorage: Record<string, string> = {};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-06-15'));

  // Clear and set up localStorage mock
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => { mockStorage[key] = value; },
    removeItem: (key: string) => { delete mockStorage[key]; },
  });

  vi.stubGlobal('crypto', {
    randomUUID: () => 'test-user-uuid-1234',
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('shuffleListingsForUser', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('returns the same number of elements', () => {
    const result = shuffleListingsForUser(items);
    expect(result).toHaveLength(items.length);
  });

  it('preserves all elements (no duplicates, no losses)', () => {
    const result = shuffleListingsForUser(items);
    expect([...result].sort((a, b) => a - b)).toEqual(items);
  });

  it('does not mutate the original array', () => {
    const original = [...items];
    shuffleListingsForUser(items);
    expect(items).toEqual(original);
  });

  it('returns deterministic order for same user + same day', () => {
    const result1 = shuffleListingsForUser(items);
    const result2 = shuffleListingsForUser(items);
    expect(result1).toEqual(result2);
  });

  it('returns different order for different user', () => {
    const result1 = shuffleListingsForUser(items);

    // Change the user ID
    mockStorage['fcc_user_id'] = 'different-user-uuid';
    const result2 = shuffleListingsForUser(items);

    // Extremely unlikely to be the same order with different seeds
    expect(result1).not.toEqual(result2);
  });

  it('returns different order for different day', () => {
    const result1 = shuffleListingsForUser(items);

    vi.setSystemTime(new Date('2025-06-16'));
    const result2 = shuffleListingsForUser(items);

    expect(result1).not.toEqual(result2);
  });

  it('creates and persists a user ID on first call', () => {
    expect(mockStorage['fcc_user_id']).toBeUndefined();
    shuffleListingsForUser(items);
    expect(mockStorage['fcc_user_id']).toBe('test-user-uuid-1234');
  });

  it('reuses existing user ID', () => {
    mockStorage['fcc_user_id'] = 'existing-id';
    shuffleListingsForUser(items);
    expect(mockStorage['fcc_user_id']).toBe('existing-id');
  });

  it('handles empty array', () => {
    expect(shuffleListingsForUser([])).toEqual([]);
  });

  it('handles single-element array', () => {
    expect(shuffleListingsForUser([42])).toEqual([42]);
  });
});
