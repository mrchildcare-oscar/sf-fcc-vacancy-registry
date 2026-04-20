import { checkElfaStatus, getElfaLicenseCount } from './elfa';

describe('checkElfaStatus', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true for a valid ELFA license', async () => {
    expect(await checkElfaStatus('384000014')).toBe(true);
  });

  it('returns false for an invalid license', async () => {
    expect(await checkElfaStatus('000000000')).toBe(false);
  });

  it('trims whitespace from license number', async () => {
    expect(await checkElfaStatus('  384000014  ')).toBe(true);
  });

  it('returns false for empty string', async () => {
    expect(await checkElfaStatus('')).toBe(false);
  });

  it('returns false for whitespace-only string', async () => {
    expect(await checkElfaStatus('   ')).toBe(false);
  });
});

describe('getElfaLicenseCount', () => {
  it('returns 372', () => {
    expect(getElfaLicenseCount()).toBe(372);
  });

  it('returns a positive number', () => {
    expect(getElfaLicenseCount()).toBeGreaterThan(0);
  });
});
