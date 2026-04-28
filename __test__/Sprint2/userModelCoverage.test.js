let mockPreSaveFn;
let mockUserSchema;

jest.mock('mongoose', () => {
  const Schema = jest.fn().mockImplementation(function (definition) {
    this.definition = definition;
    this.methods = {};
    this.pre = jest.fn((hookName, fn) => {
      if (hookName === 'save') {
        mockPreSaveFn = fn;
      }
    });

    mockUserSchema = this;
    return this;
  });

  return {
    Schema,
    model: jest.fn((modelName, schema) => {
      return {
        modelName,
        schema
      };
    })
  };
});

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

describe('User model extra coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRE = '30d';
  });

  test('should register User model with mongoose', () => {
    expect(User.modelName).toBe('User');
    expect(User.schema).toBe(mockUserSchema);
  });

  test('should not hash password when password is not modified', async () => {
    const fakeUser = {
      password: 'plainpassword',
      isModified: jest.fn().mockReturnValue(false)
    };

    await mockPreSaveFn.call(fakeUser, jest.fn());

    expect(fakeUser.isModified).toHaveBeenCalledWith('password');
    expect(bcrypt.genSalt).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  test('should hash password when password is modified', async () => {
    bcrypt.genSalt.mockResolvedValue('salt10');
    bcrypt.hash.mockResolvedValue('hashedpassword');

    const fakeUser = {
      password: 'plainpassword',
      isModified: jest.fn().mockReturnValue(true)
    };

    await mockPreSaveFn.call(fakeUser, jest.fn());

    expect(fakeUser.isModified).toHaveBeenCalledWith('password');
    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 'salt10');
    expect(fakeUser.password).toBe('hashedpassword');
  });

  test('should throw error when password hashing fails', async () => {
    bcrypt.genSalt.mockRejectedValue(new Error('bcrypt failed'));

    const fakeUser = {
      password: 'plainpassword',
      isModified: jest.fn().mockReturnValue(true)
    };

    await expect(mockPreSaveFn.call(fakeUser, jest.fn()))
      .rejects
      .toThrow('bcrypt failed');
  });

  test('should sign JWT token', () => {
    jwt.sign.mockReturnValue('mock.jwt.token');

    const fakeUser = {
      _id: 'user123'
    };

    const token = mockUserSchema.methods.getSignedJwtToken.call(fakeUser);

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'user123' },
      'test-secret',
      { expiresIn: '30d' }
    );

    expect(token).toBe('mock.jwt.token');
  });

  test('should compare entered password with hashed password', async () => {
    bcrypt.compare.mockResolvedValue(true);

    const fakeUser = {
      password: 'hashedpassword'
    };

    const result = await mockUserSchema.methods.matchPassword.call(
      fakeUser,
      'plainpassword'
    );

    expect(bcrypt.compare).toHaveBeenCalledWith('plainpassword', 'hashedpassword');
    expect(result).toBe(true);
  });
});