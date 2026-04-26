jest.mock('../../models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  find: jest.fn(),
}));

const User = require('../../models/User');
const {
  register,
  login,
  me,
  logout,
  unbanUser,
  getUsers,
  updateProfile,
} = require('../../controllers/auth');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Sprint2 extra coverage for auth controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.JWT_COOKIE_EXPIRE = '30';
    process.env.JWT_EXPIRE = '30d';
    process.env.JWT_SECRET = 'testsecret';
    process.env.NODE_ENV = 'test';

    req = {
      body: {},
      user: {
        id: 'user123',
        role: 'user',
      },
    };

    res = mockResponse();
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    test('should return 400 when privacy policy is not accepted', async () => {
      req.body = {
        name: 'Test User',
        telephone: '0812345678',
        email: 'test@example.com',
        password: 'password123',
        privacyPolicyAccepted: false,
      };

      await register(req, res, next);

      expect(User.findOne).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please accept the privacy policy to register',
      });
    });

    test('should return 409 when email already exists', async () => {
      req.body = {
        name: 'Test User',
        telephone: '0812345678',
        email: 'test@example.com',
        password: 'password123',
        privacyPolicyAccepted: true,
      };

      User.findOne.mockResolvedValue({
        email: 'test@example.com',
        isDeleted: false,
      });

      await register(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(User.create).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already in use',
      });
    });

    test('should return 409 when email belongs to deleted account', async () => {
      req.body = {
        name: 'Test User',
        telephone: '0812345678',
        email: 'deleted@example.com',
        password: 'password123',
        privacyPolicyAccepted: true,
      };

      User.findOne.mockResolvedValue({
        email: 'deleted@example.com',
        isDeleted: true,
      });

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          'This email was previously registered and deleted. Please contact support to reactivate.',
      });
    });

    test('should register dentist successfully and set secure cookie in production', async () => {
      process.env.NODE_ENV = 'production';

      req.body = {
        name: 'Dr Test',
        telephone: '0812345678',
        email: 'dentist@example.com',
        password: 'password123',
        role: 'dentist',
        privacyPolicyAccepted: true,
        yearsOfExperience: 5,
        areaOfExpertise: 'Orthodontics',
      };

      const mockUser = {
        _id: 'dentist123',
        role: 'dentist',
        getSignedJwtToken: jest.fn().mockReturnValue('mock_token'),
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      await register(req, res, next);

      expect(User.create).toHaveBeenCalledWith({
        name: 'Dr Test',
        telephone: '0812345678',
        email: 'dentist@example.com',
        password: 'password123',
        role: 'dentist',
        privacyPolicyAccepted: true,
        yearsOfExperience: 5,
        areaOfExpertise: 'Orthodontics',
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'mock_token',
        expect.objectContaining({
          expires: expect.any(Date),
          httpOnly: true,
          secure: true,
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
        token: 'mock_token',
      });
    });

    test('should return 400 when register throws error', async () => {
      req.body = {
        name: 'Test User',
        telephone: '0812345678',
        email: 'test@example.com',
        password: 'password123',
        privacyPolicyAccepted: true,
      };

      User.findOne.mockRejectedValue(new Error('Register error'));

      jest.spyOn(console, 'error').mockImplementation(() => {});

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Register error',
      });
    });
  });

  describe('login', () => {
    test('should return 400 when email or password is missing', async () => {
      req.body = {
        email: 'test@example.com',
      };

      await login(req, res, next);

      expect(User.findOne).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide an email and password',
      });
    });

    test('should return 401 when user is not found', async () => {
      req.body = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials',
      });
    });

    test('should return 403 when account is deleted', async () => {
      req.body = {
        email: 'deleted@example.com',
        password: 'password123',
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          isDeleted: true,
        }),
      });

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'This account has been deleted',
      });
    });

    test('should return 403 when account is banned without reason', async () => {
      req.body = {
        email: 'banned@example.com',
        password: 'password123',
      };

      const mockUser = {
        isDeleted: false,
        isBanned: true,
        banReason: null,
        matchPassword: jest.fn(),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await login(req, res, next);

      expect(mockUser.matchPassword).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'This account has been banned',
      });
    });

    test('should return 401 when password is invalid', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        isDeleted: false,
        isBanned: false,
        matchPassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await login(req, res, next);

      expect(mockUser.matchPassword).toHaveBeenCalledWith('wrongpassword');

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid password',
      });
    });

    test('should return 200 when login is successful', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        isDeleted: false,
        isBanned: false,
        matchPassword: jest.fn().mockResolvedValue(true),
        getSignedJwtToken: jest.fn().mockReturnValue('login_token'),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'login_token',
        expect.objectContaining({
          expires: expect.any(Date),
          httpOnly: true,
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
        token: 'login_token',
      });
    });

    test('should return 500 when login throws error', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      User.findOne.mockImplementation(() => {
        throw new Error('Login error');
      });

      jest.spyOn(console, 'error').mockImplementation(() => {});

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Login error',
      });
    });
  });

  describe('me', () => {
    test('should return current user successfully', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        isDeleted: false,
        isBanned: false,
      };

      User.findById.mockResolvedValue(mockUser);

      await me(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    test('should return 400 when current user is deleted', async () => {
      User.findById.mockResolvedValue({
        _id: 'user123',
        isDeleted: true,
      });

      await me(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'This account has been deleted',
      });
    });

    test('should return 404 when current user is not found', async () => {
      User.findById.mockResolvedValue(null);

      await me(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No user found with this id',
      });
    });

    test('should return 403 when current user is banned with reason', async () => {
      User.findById.mockResolvedValue({
        _id: 'user123',
        isDeleted: false,
        isBanned: true,
        banReason: 'Bad behavior',
      });

      await me(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'This account has been banned: Bad behavior',
      });
    });
  });

  describe('logout', () => {
    test('should clear cookie and logout successfully', async () => {
      await logout(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'none',
        expect.objectContaining({
          expires: expect.any(Date),
          httpOnly: true,
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
        data: {},
      });
    });
  });

  describe('unbanUser', () => {
    test('should return 400 when userId is not provided', async () => {
      req.body = {};

      await unbanUser(req, res, next);

      expect(User.findById).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide userId',
      });
    });

    test('should return 404 when user to unban is not found', async () => {
      req.body = {
        userId: 'missing123',
      };

      User.findById.mockResolvedValue(null);

      await unbanUser(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('missing123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    test('should return 400 when user is not banned', async () => {
      req.body = {
        userId: 'user123',
      };

      User.findById.mockResolvedValue({
        _id: 'user123',
        isBanned: false,
      });

      await unbanUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'This user is not banned',
      });
    });

    test('should unban user successfully', async () => {
      req.body = {
        userId: 'user123',
      };

      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        role: 'user',
        isBanned: true,
        bannedAt: new Date(),
        banReason: 'Old reason',
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById.mockResolvedValue(mockUser);

      await unbanUser(req, res, next);

      expect(mockUser.isBanned).toBe(false);
      expect(mockUser.bannedAt).toBe(null);
      expect(mockUser.banReason).toBe(null);
      expect(mockUser.save).toHaveBeenCalledTimes(1);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'user has been unbanned successfully',
        data: {
          userId: 'user123',
          email: 'user@example.com',
        },
      });
    });

    test('should return 500 when unbanUser throws error', async () => {
      req.body = {
        userId: 'user123',
      };

      User.findById.mockRejectedValue(new Error('Unban error'));

      jest.spyOn(console, 'error').mockImplementation(() => {});

      await unbanUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unban error',
      });
    });
  });

  describe('getUsers', () => {
    test('should get all non-deleted users and dentists successfully', async () => {
      const users = [
        { _id: 'user1', role: 'user', isDeleted: false },
        { _id: 'dentist1', role: 'dentist', isDeleted: false },
      ];

      const selectMock = jest.fn().mockResolvedValue(users);

      User.find.mockReturnValue({
        select: selectMock,
      });

      await getUsers(req, res, next);

      expect(User.find).toHaveBeenCalledWith({
        role: { $in: ['user', 'dentist'] },
        isDeleted: false,
      });
      expect(selectMock).toHaveBeenCalledWith('-password');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: users,
      });
    });

    test('should return 500 when getUsers throws error', async () => {
      User.find.mockImplementation(() => {
        throw new Error('Get users error');
      });

      jest.spyOn(console, 'log').mockImplementation(() => {});

      await getUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot retrieve users and dentists',
      });
    });
  });
  test('TC6: should return 404 when user is not found', async () => {
  req.body = {
    name: 'New Name',
    password: 'correctpassword',
  };

  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue(null),
  });

  await updateProfile(req, res, next);

  expect(User.findById).toHaveBeenCalledWith('user123');
  expect(User.findByIdAndUpdate).not.toHaveBeenCalled();

  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: 'User not found',
  });
});
});