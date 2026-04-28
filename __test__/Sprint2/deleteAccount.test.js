jest.mock('../../models/User', () => ({
  findById: jest.fn(),
}));

const User = require('../../models/User');
const { deleteAccount } = require('../../controllers/auth');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

describe('US2-3 Delete Account - deleteAccount Unit Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        id: 'user123',
        role: 'user',
      },
      body: {},
    };

    res = mockResponse();
    next = jest.fn();
  });

  test('TC1: should delete account successfully when user provides correct password', async () => {
    req.body = {
      password: 'correctpassword',
    };

    const mockUser = {
      _id: 'user123',
      isDeleted: false,
      deletedAt: null,
      matchPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    };

    const selectMock = jest.fn().mockResolvedValue(mockUser);
    User.findById.mockReturnValue({ select: selectMock });

    await deleteAccount(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(selectMock).toHaveBeenCalledWith('+password');
    expect(mockUser.matchPassword).toHaveBeenCalledWith('correctpassword');

    expect(mockUser.matchPassword.mock.invocationCallOrder[0])
      .toBeLessThan(mockUser.save.mock.invocationCallOrder[0]);

    expect(mockUser.isDeleted).toBe(true);
    expect(mockUser.deletedAt).toBeInstanceOf(Date);
    expect(mockUser.save).toHaveBeenCalledTimes(1);

    expect(res.cookie).toHaveBeenCalledWith('token', 'none', {
      expires: new Date(0),
      httpOnly: true,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Account deleted successfully',
      data: {},
    });
  });

  test('TC2: should return 400 when password is not provided', async () => {
    req.body = {};

    await deleteAccount(req, res, next);

    expect(User.findById).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Please provide your password to confirm account deletion',
    });
  });

  test('TC3: should return 404 when user is not found', async () => {
    req.body = {
      password: 'correctpassword',
    };

    const selectMock = jest.fn().mockResolvedValue(null);
    User.findById.mockReturnValue({ select: selectMock });

    await deleteAccount(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(selectMock).toHaveBeenCalledWith('+password');

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User not found',
    });
  });

  test('TC4: should return 410 when account has already been deleted', async () => {
    req.body = {
      password: 'correctpassword',
    };

    const mockUser = {
      _id: 'user123',
      isDeleted: true,
      matchPassword: jest.fn(),
      save: jest.fn(),
    };

    const selectMock = jest.fn().mockResolvedValue(mockUser);
    User.findById.mockReturnValue({ select: selectMock });

    await deleteAccount(req, res, next);

    expect(mockUser.matchPassword).not.toHaveBeenCalled();
    expect(mockUser.save).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'This account has already been deleted',
    });
  });

  test('TC5: should return 401 and must not delete account when password is incorrect', async () => {
    req.body = {
      password: 'wrongpassword',
    };

    const mockUser = {
      _id: 'user123',
      isDeleted: false,
      deletedAt: null,
      matchPassword: jest.fn().mockResolvedValue(false),
      save: jest.fn().mockResolvedValue(true),
    };

    const selectMock = jest.fn().mockResolvedValue(mockUser);
    User.findById.mockReturnValue({ select: selectMock });

    await deleteAccount(req, res, next);

    expect(mockUser.matchPassword).toHaveBeenCalledWith('wrongpassword');

    expect(mockUser.isDeleted).toBe(false);
    expect(mockUser.deletedAt).toBe(null);
    expect(mockUser.save).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Incorrect password',
    });
  });

  test('TC6: should return 500 when database error occurs', async () => {
    req.body = {
      password: 'correctpassword',
    };

    User.findById.mockImplementation(() => {
      throw new Error('Database error');
    });

    jest.spyOn(console, 'error').mockImplementation(() => {});

    await deleteAccount(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Database error',
    });

    console.error.mockRestore();
  });
});


