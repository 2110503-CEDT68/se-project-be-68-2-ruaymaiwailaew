jest.mock('../../models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const User = require('../../models/User');
const { updateProfile } = require('../../controllers/auth');
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('US2-2 Edit Profile - updateProfile Unit Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        id: 'user123',
        role: 'user'
      },
      body: {}
    };

    res = mockResponse();
    next = jest.fn();
  });

  test('TC1: should update profile successfully when user submits valid profile data', async () => {
    req.body = {
      name: 'New Name',
      telephone: '0812345678',
      password: 'correctpassword'
    };

    const mockUser = {
      _id: 'user123',
      name: 'Old Name',
      telephone: '0800000000',
      matchPassword: jest.fn().mockResolvedValue(true)
    };

    const updatedUser = {
      _id: 'user123',
      name: 'New Name',
      telephone: '0812345678'
    };

    const selectMock = jest.fn().mockResolvedValue(mockUser);
    User.findById.mockReturnValue({ select: selectMock });
    User.findByIdAndUpdate.mockResolvedValue(updatedUser);

    await updateProfile(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(selectMock).toHaveBeenCalledWith('+password');
    expect(mockUser.matchPassword).toHaveBeenCalledWith('correctpassword');

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'user123',
      {
        name: 'New Name',
        telephone: '0812345678'
      },
      {
        new: true,
        runValidators: true
      }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  });

  test('TC2: should update dentist profile successfully when areaOfExpertise and yearsOfExperience are provided', async () => {
    req.user.role = 'dentist';
    req.body = {
      areaOfExpertise: 'Orthodontics',
      yearsOfExperience: 5,
      password: 'correctpassword'
    };

    const mockUser = {
      _id: 'dentist123',
      role: 'dentist',
      matchPassword: jest.fn().mockResolvedValue(true)
    };

    const updatedUser = {
      _id: 'dentist123',
      role: 'dentist',
      areaOfExpertise: 'Orthodontics',
      yearsOfExperience: 5
    };

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });
    User.findByIdAndUpdate.mockResolvedValue(updatedUser);

    await updateProfile(req, res, next);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'user123',
      {
        areaOfExpertise: 'Orthodontics',
        yearsOfExperience: 5
      },
      {
        new: true,
        runValidators: true
      }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  });

  test('TC3: should return 400 when password is not provided', async () => {
    req.body = {
      name: 'New Name',
      telephone: '0812345678'
    };

    await updateProfile(req, res, next);

    expect(User.findById).not.toHaveBeenCalled();
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Please provide your password to confirm'
    });
  });

  test('TC4: should return 400 when no profile field is provided to update', async () => {
    req.body = {
      password: 'correctpassword'
    };

    await updateProfile(req, res, next);

    expect(User.findById).not.toHaveBeenCalled();
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Please provide at least one field to update'
    });
  });

  test('TC5: should return 401 when password is incorrect', async () => {
    req.body = {
      name: 'New Name',
      password: 'wrongpassword'
    };

    const mockUser = {
      _id: 'user123',
      matchPassword: jest.fn().mockResolvedValue(false)
    };

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    await updateProfile(req, res, next);

    expect(mockUser.matchPassword).toHaveBeenCalledWith('wrongpassword');
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Incorrect password'
    });
  });
});