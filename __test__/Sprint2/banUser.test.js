jest.mock('../../models/User', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
}));

const { banUser, login } = require('../../controllers/auth');
const User = require('../../models/User');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('US2-4: Ban User', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_COOKIE_EXPIRE = '1';
    process.env.NODE_ENV = 'test';
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('AC1 - Admin bans a user successfully', () => {
    test('TC1: should ban user and return 200 with success message', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        role: 'user',
        isBanned: false,
        bannedAt: null,
        banReason: null,
        save: jest.fn().mockResolvedValue(true),
      };

      const req = {
        body: {
          userId: 'user123',
          reason: 'Violated policy',
        },
      };

      const res = mockRes();

      User.findById.mockResolvedValue(mockUser);

      await banUser(req, res);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.isBanned).toBe(true);
      expect(mockUser.bannedAt).toBeInstanceOf(Date);
      expect(mockUser.banReason).toBe('Violated policy');
      expect(mockUser.save).toHaveBeenCalledTimes(1);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'user has been banned successfully',
        data: {
          userId: 'user123',
          email: 'user@example.com',
          bannedAt: mockUser.bannedAt,
          banReason: 'Violated policy',
        },
      });
    });

    test('TC2: should use "No reason provided" when reason is not given', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        role: 'user',
        isBanned: false,
        bannedAt: null,
        banReason: null,
        save: jest.fn().mockResolvedValue(true),
      };

      const req = {
        body: {
          userId: 'user123',
        },
      };

      const res = mockRes();

      User.findById.mockResolvedValue(mockUser);

      await banUser(req, res);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.isBanned).toBe(true);
      expect(mockUser.bannedAt).toBeInstanceOf(Date);
      expect(mockUser.banReason).toBe('No reason provided');
      expect(mockUser.save).toHaveBeenCalledTimes(1);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'user has been banned successfully',
        data: {
          userId: 'user123',
          email: 'user@example.com',
          bannedAt: mockUser.bannedAt,
          banReason: 'No reason provided',
        },
      });
    });

    test('TC3: should return 400 when userId is not provided', async () => {
      const req = {
        body: {},
      };

      const res = mockRes();

      await banUser(req, res);

      expect(User.findById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide userId',
      });
    });

    test('TC4: should return 404 when user is not found', async () => {
      const req = {
        body: {
          userId: 'nonexistent',
        },
      };

      const res = mockRes();

      User.findById.mockResolvedValue(null);

      await banUser(req, res);

      expect(User.findById).toHaveBeenCalledWith('nonexistent');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    test('TC5: should return 400 when user is already banned', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'banned@example.com',
        role: 'user',
        isBanned: true,
        save: jest.fn(),
      };

      const req = {
        body: {
          userId: 'user123',
        },
      };

      const res = mockRes();

      User.findById.mockResolvedValue(mockUser);

      await banUser(req, res);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.save).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'This user is already banned',
      });
    });

    test('TC6: should return 500 when an unexpected error occurs', async () => {
      const req = {
        body: {
          userId: 'user123',
        },
      };

      const res = mockRes();

      User.findById.mockRejectedValue(new Error('DB error'));

      await banUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'DB error',
      });
      expect(console.error).toHaveBeenCalledWith('DB error');
    });
  });

  describe('AC2 - Banned user attempts to login', () => {
    test('TC7: should deny login and return 403 when user is banned with ban reason', async () => {
      const mockUser = {
        isDeleted: false,
        isBanned: true,
        banReason: 'Violated policy',
        matchPassword: jest.fn(),
      };

      const req = {
        body: {
          email: 'banned@example.com',
          password: 'password123',
        },
      };

      const res = mockRes();

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        email: 'banned@example.com',
      });
      expect(mockUser.matchPassword).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'This account has been banned: Violated policy',
      });
    });

    test('TC8: should deny login and return 403 when user is banned without ban reason', async () => {
      const mockUser = {
        isDeleted: false,
        isBanned: true,
        banReason: null,
        matchPassword: jest.fn(),
      };

      const req = {
        body: {
          email: 'banned@example.com',
          password: 'password123',
        },
      };

      const res = mockRes();

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        email: 'banned@example.com',
      });
      expect(mockUser.matchPassword).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'This account has been banned',
      });
    });

    test('TC9: should allow login when user is not banned', async () => {
      const mockUser = {
        isDeleted: false,
        isBanned: false,
        matchPassword: jest.fn().mockResolvedValue(true),
        getSignedJwtToken: jest.fn().mockReturnValue('mock_token'),
      };

      const req = {
        body: {
          email: 'normal@example.com',
          password: 'password123',
        },
      };

      const res = mockRes();

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        email: 'normal@example.com',
      });
      expect(mockUser.matchPassword).toHaveBeenCalledWith('password123');
      expect(mockUser.getSignedJwtToken).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'mock_token',
        expect.objectContaining({
          httpOnly: true,
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: 'mock_token',
        data: mockUser,
      });
    });
  });
});