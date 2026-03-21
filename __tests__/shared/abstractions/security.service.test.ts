describe('SecureParams', () => {
  const ORIGINAL_ENV = process.env;
  let mockWarn: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    mockWarn = jest.fn();

    // Always mock logger — prevents real logger from registering
    // process exit listeners on every module reload
    jest.doMock('../../../src/shared/logger/logger', () => ({
      __esModule: true,
      default: {
        warn: mockWarn,
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
      },
    }));

    process.env = {
      ...ORIGINAL_ENV,
      REDIRECT_PARAM_SECRET: 'test_secret',
      REDIRECT_PARAM_SALT: 'test_salt',
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  function loadSecureParams() {
    return require('../../../src/shared/abstractions/security.service').default;
  }

  // ── Singleton ─────────────────────────────────────────────────────────────

  it('should return the same instance on multiple getInstance calls', () => {
    const first = loadSecureParams();
    const second = loadSecureParams();
    expect(first).toBe(second);
  });

  // ── encrypt ───────────────────────────────────────────────────────────────

  it('should return a non-empty string', () => {
    const result = loadSecureParams().encrypt('hello');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return a base64url encoded string', () => {
    const result = loadSecureParams().encrypt('hello');
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('should produce different ciphertexts for the same input (random IV)', () => {
    const secureParams = loadSecureParams();
    expect(secureParams.encrypt('same_value')).not.toBe(
      secureParams.encrypt('same_value'),
    );
  });

  it('should produce different ciphertexts for different inputs', () => {
    const secureParams = loadSecureParams();
    expect(secureParams.encrypt('value_one')).not.toBe(
      secureParams.encrypt('value_two'),
    );
  });

  // ── decrypt ───────────────────────────────────────────────────────────────

  it('should decrypt back to the original plaintext', () => {
    const secureParams = loadSecureParams();
    const plaintext = 'my_secret_token';
    expect(secureParams.decrypt(secureParams.encrypt(plaintext))).toBe(
      plaintext,
    );
  });

  it('should decrypt strings containing special characters', () => {
    const secureParams = loadSecureParams();
    const plaintext = 'token=abc&foo=bar+baz/qux==';
    expect(secureParams.decrypt(secureParams.encrypt(plaintext))).toBe(
      plaintext,
    );
  });

  it('should decrypt an empty string', () => {
    const secureParams = loadSecureParams();
    expect(secureParams.decrypt(secureParams.encrypt(''))).toBe('');
  });

  it('should decrypt a long string', () => {
    const secureParams = loadSecureParams();
    const plaintext = 'a'.repeat(10_000);
    expect(secureParams.decrypt(secureParams.encrypt(plaintext))).toBe(
      plaintext,
    );
  });

  it('should throw when decrypting a tampered ciphertext', () => {
    const secureParams = loadSecureParams();
    const buf = Buffer.from(
      secureParams.encrypt('legitimate_token'),
      'base64url',
    );
    buf[15] ^= 0xff;
    expect(() => secureParams.decrypt(buf.toString('base64url'))).toThrow();
  });

  it('should throw when decrypting a completely invalid string', () => {
    expect(() =>
      loadSecureParams().decrypt('not_a_valid_ciphertext'),
    ).toThrow();
  });

  // ── Missing env vars ──────────────────────────────────────────────────────

  it('should log a warning when REDIRECT_PARAM_SECRET is missing', () => {
    delete process.env.REDIRECT_PARAM_SECRET;
    jest.resetModules();
    jest.doMock('../../../src/shared/logger/logger', () => ({
      __esModule: true,
      default: {
        warn: mockWarn,
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
      },
    }));

    loadSecureParams();

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('REDIRECT_PARAM_SECRET'),
    );
  });

  it('should log a warning when REDIRECT_PARAM_SALT is missing', () => {
    delete process.env.REDIRECT_PARAM_SALT;
    jest.resetModules();
    jest.doMock('../../../src/shared/logger/logger', () => ({
      __esModule: true,
      default: {
        warn: mockWarn,
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
      },
    }));

    loadSecureParams();

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('REDIRECT_PARAM_SALT'),
    );
  });

  it('should throw when encrypt is called without env vars configured', () => {
    delete process.env.REDIRECT_PARAM_SECRET;
    delete process.env.REDIRECT_PARAM_SALT;
    jest.resetModules();
    jest.doMock('../../../src/shared/logger/logger', () => ({
      __esModule: true,
      default: {
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
      },
    }));

    expect(() => loadSecureParams().encrypt('value')).toThrow();
  });
});
