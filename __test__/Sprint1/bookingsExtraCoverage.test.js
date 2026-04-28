jest.mock('../../models/Booking', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('../../models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../../services/notificationService', () => ({
  sendBookingCreatedNotification: jest.fn(),
  sendBookingUpdatedNotification: jest.fn(),
  sendBookingDeletedNotification: jest.fn(),
}));

const Booking = require('../../models/Booking');
const User = require('../../models/User');

const {
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
} = require('../../controllers/bookings');

const {
  sendBookingCreatedNotification,
  sendBookingUpdatedNotification,
  sendBookingDeletedNotification,
} = require('../../services/notificationService');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const onePopulate = (result) => ({
  populate: jest.fn().mockResolvedValue(result),
});

const twoPopulate = (result) => ({
  populate: jest.fn().mockReturnValue({
    populate: jest.fn().mockResolvedValue(result),
  }),
});

const twoPopulateUpdate = (result) => ({
  populate: jest.fn().mockReturnValue({
    populate: jest.fn().mockResolvedValue(result),
  }),
});

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString();
};

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString();
};

describe('Sprint1 extra coverage for bookings.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  describe('getBooking', () => {
    test('should get booking successfully as admin', async () => {
      const booking = {
        _id: 'booking1',
        user: { toString: () => 'user1' },
        dentist: { _id: { toString: () => 'dentist1' } },
      };

      Booking.findById.mockReturnValue(onePopulate(booking));

      const req = {
        params: { id: 'booking1' },
        user: { id: 'admin1', role: 'admin' },
      };
      const res = mockRes();

      await getBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: booking,
      });
    });

    test('should return 404 when booking not found', async () => {
      Booking.findById.mockReturnValue(onePopulate(null));

      const req = {
        params: { id: 'booking1' },
        user: { id: 'user1', role: 'user' },
      };
      const res = mockRes();

      await getBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Booking not found',
      });
    });

    test('should return 403 when user accesses other user booking', async () => {
      const booking = {
        user: { toString: () => 'anotherUser' },
        dentist: { _id: { toString: () => 'dentist1' } },
      };

      Booking.findById.mockReturnValue(onePopulate(booking));

      const req = {
        params: { id: 'booking1' },
        user: { id: 'user1', role: 'user' },
      };
      const res = mockRes();

      await getBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should return 403 when dentist accesses other dentist booking', async () => {
      const booking = {
        user: { toString: () => 'user1' },
        dentist: { _id: { toString: () => 'anotherDentist' } },
      };

      Booking.findById.mockReturnValue(onePopulate(booking));

      const req = {
        params: { id: 'booking1' },
        user: { id: 'dentist1', role: 'dentist' },
      };
      const res = mockRes();

      await getBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should return 403 for unknown role', async () => {
      const booking = {
        user: { toString: () => 'user1' },
        dentist: { _id: { toString: () => 'dentist1' } },
      };

      Booking.findById.mockReturnValue(onePopulate(booking));

      const req = {
        params: { id: 'booking1' },
        user: { id: 'x1', role: 'unknown' },
      };
      const res = mockRes();

      await getBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should return 500 when getBooking throws error', async () => {
      process.env.NODE_ENV = 'development';
      jest.spyOn(console, 'error').mockImplementation(() => {});

      Booking.findById.mockImplementation(() => {
        throw new Error('DB error');
      });

      const req = {
        params: { id: 'booking1' },
        user: { id: 'user1', role: 'user' },
      };
      const res = mockRes();

      await getBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot find booking',
      });

      console.error.mockRestore();
    });
  });

  describe('createBooking', () => {
    test('should return 400 when account has been deleted', async () => {
      User.findById.mockResolvedValueOnce({ isDeleted: true });

      const req = {
        user: { id: 'user1' },
        body: { bookingDate: tomorrow(), dentist: 'dentist1' },
      };
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account has been deleted',
      });
    });

    test('should return 400 when account has been banned', async () => {
      User.findById.mockResolvedValueOnce({ isDeleted: false, isBanned: true });

      const req = {
        user: { id: 'user1' },
        body: { bookingDate: tomorrow(), dentist: 'dentist1' },
      };
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account has been banned',
      });
    });

    test('should return 400 when user already has existing booking', async () => {
      User.findById.mockResolvedValueOnce({ isDeleted: false, isBanned: false });
      Booking.findOne.mockResolvedValueOnce({ _id: 'existing' });

      const req = {
        user: { id: 'user1' },
        body: { bookingDate: tomorrow(), dentist: 'dentist1' },
      };
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 400 when missing bookingDate or dentist', async () => {
      User.findById.mockResolvedValueOnce({ isDeleted: false, isBanned: false });
      Booking.findOne.mockResolvedValueOnce(null);

      const req = {
        user: { id: 'user1' },
        body: {},
      };
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide booking date and dentist',
      });
    });

    test('should return 400 when dentist is not available', async () => {
      User.findById
        .mockResolvedValueOnce({ isDeleted: false, isBanned: false })
        .mockResolvedValueOnce(null);

      Booking.findOne.mockResolvedValueOnce(null);

      const req = {
        user: { id: 'user1' },
        body: { bookingDate: tomorrow(), dentist: 'dentist1' },
      };
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Dentist is not available',
      });
    });

    test('should return 409 when dentist already has booking on selected date', async () => {
      User.findById
        .mockResolvedValueOnce({ isDeleted: false, isBanned: false })
        .mockResolvedValueOnce({ _id: 'dentist1', isDeleted: false, isBanned: false });

      Booking.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ _id: 'conflict' });

      const req = {
        user: { id: 'user1' },
        body: { bookingDate: tomorrow(), dentist: 'dentist1' },
      };
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test('should return 400 when booking date is in the past', async () => {
      User.findById
        .mockResolvedValueOnce({ isDeleted: false, isBanned: false })
        .mockResolvedValueOnce({ _id: 'dentist1', isDeleted: false, isBanned: false });

      Booking.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const req = {
        user: { id: 'user1' },
        body: { bookingDate: yesterday(), dentist: 'dentist1' },
      };
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot create a booking in the past',
      });
    });

    test('should create booking successfully', async () => {
      const user = {
        _id: 'user1',
        name: 'Patient',
        email: 'patient@example.com',
        telephone: '0812345678',
        isDeleted: false,
        isBanned: false,
      };

      const dentist = {
        _id: 'dentist1',
        name: 'Dentist',
        email: 'dentist@example.com',
        isDeleted: false,
        isBanned: false,
      };

      const booking = {
        _id: 'booking1',
        bookingDate: tomorrow(),
        user: 'user1',
        dentist: 'dentist1',
      };

      User.findById
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(dentist);

      Booking.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      Booking.create.mockResolvedValue(booking);

      const req = {
        user: { id: 'user1' },
        body: { bookingDate: booking.bookingDate, dentist: 'dentist1' },
      };
      const res = mockRes();

      await createBooking(req, res);

      expect(Booking.create).toHaveBeenCalled();
      expect(sendBookingCreatedNotification).toHaveBeenCalledWith(dentist, user, booking);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should return 500 when createBooking throws error', async () => {
      User.findById.mockRejectedValue(new Error('DB error'));

      const req = {
        user: { id: 'user1' },
        body: { bookingDate: tomorrow(), dentist: 'dentist1' },
      };
      const res = mockRes();

      await createBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot create booking',
      });
    });
  });

  describe('updateBooking', () => {
    test('should return 404 when booking not found', async () => {
      Booking.findById.mockReturnValue(twoPopulate(null));

      const req = {
        params: { id: 'booking1' },
        user: { id: 'user1', role: 'user' },
        body: {},
      };
      const res = mockRes();

      await updateBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 when user is not owner', async () => {
      const booking = {
        user: { _id: { toString: () => 'anotherUser' } },
        dentist: { _id: { toString: () => 'dentist1' } },
        bookingDate: tomorrow(),
      };

      Booking.findById.mockReturnValue(twoPopulate(booking));

      const req = {
        params: { id: 'booking1' },
        user: { id: 'user1', role: 'user' },
        body: {},
      };
      const res = mockRes();

      await updateBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should return 403 when dentist is not owner', async () => {
      const booking = {
        user: { _id: { toString: () => 'user1' } },
        dentist: { _id: { toString: () => 'anotherDentist' } },
        bookingDate: tomorrow(),
      };

      Booking.findById.mockReturnValue(twoPopulate(booking));

      const req = {
        params: { id: 'booking1' },
        user: { id: 'dentist1', role: 'dentist' },
        body: {},
      };
      const res = mockRes();

      await updateBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should return 403 for unknown role', async () => {
      const booking = {
        user: { _id: { toString: () => 'user1' } },
        dentist: { _id: { toString: () => 'dentist1' } },
        bookingDate: tomorrow(),
      };

      Booking.findById.mockReturnValue(twoPopulate(booking));

      const req = {
        params: { id: 'booking1' },
        user: { id: 'x1', role: 'unknown' },
        body: {},
      };
      const res = mockRes();

      await updateBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should return 409 when update has conflict', async () => {
      const booking = {
        user: { _id: { toString: () => 'user1' } },
        dentist: { _id: 'dentist1' },
        bookingDate: tomorrow(),
      };

      Booking.findById.mockReturnValue(twoPopulate(booking));
      Booking.findOne.mockResolvedValue({ _id: 'conflict' });

      const req = {
        params: { id: 'booking1' },
        user: { id: 'admin1', role: 'admin' },
        body: { bookingDate: tomorrow(), dentist: 'dentist1' },
      };
      const res = mockRes();

      await updateBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test('should return 400 when update date is in the past', async () => {
      const booking = {
        user: { _id: { toString: () => 'user1' } },
        dentist: { _id: 'dentist1' },
        bookingDate: tomorrow(),
      };

      Booking.findById.mockReturnValue(twoPopulate(booking));
      Booking.findOne.mockResolvedValue(null);

      const req = {
        params: { id: 'booking1' },
        user: { id: 'admin1', role: 'admin' },
        body: { bookingDate: yesterday(), dentist: 'dentist1' },
      };
      const res = mockRes();

      await updateBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot update a booking to a past date',
      });
    });

    test('should update booking successfully and notify dentist when user updates', async () => {
      const oldBooking = {
        user: { _id: { toString: () => 'user1' } },
        dentist: { _id: 'dentist1' },
        bookingDate: tomorrow(),
      };

      const updatedBooking = {
        _id: 'booking1',
        bookingDate: tomorrow(),
        user: { _id: 'user1', name: 'Patient', email: 'patient@example.com' },
        dentist: { _id: 'dentist1', name: 'Dentist', email: 'dentist@example.com' },
      };

      Booking.findById.mockReturnValue(twoPopulate(oldBooking));
      Booking.findOne.mockResolvedValue(null);
      Booking.findByIdAndUpdate.mockReturnValue(twoPopulateUpdate(updatedBooking));

      const req = {
        params: { id: 'booking1' },
        user: { id: 'user1', role: 'user' },
        body: { bookingDate: tomorrow(), dentist: 'dentist1' },
      };
      const res = mockRes();

      await updateBooking(req, res);

      expect(sendBookingUpdatedNotification).toHaveBeenCalledWith(
        updatedBooking.dentist,
        updatedBooking,
        updatedBooking.user,
        'user'
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should update booking successfully and notify user when dentist updates', async () => {
      const oldBooking = {
        user: { _id: { toString: () => 'user1' } },
        dentist: { _id: { toString: () => 'dentist1' } },
        bookingDate: tomorrow(),
      };

      const updatedBooking = {
        _id: 'booking1',
        bookingDate: tomorrow(),
        user: { _id: 'user1', name: 'Patient', email: 'patient@example.com' },
        dentist: { _id: 'dentist1', name: 'Dentist', email: 'dentist@example.com' },
      };

      Booking.findById.mockReturnValue(twoPopulate(oldBooking));
      Booking.findOne.mockResolvedValue(null);
      Booking.findByIdAndUpdate.mockReturnValue(twoPopulateUpdate(updatedBooking));

      const req = {
        params: { id: 'booking1' },
        user: { id: 'dentist1', role: 'dentist' },
        body: { bookingDate: tomorrow() },
      };
      const res = mockRes();

      await updateBooking(req, res);

      expect(sendBookingUpdatedNotification).toHaveBeenCalledWith(
        updatedBooking.user,
        updatedBooking,
        updatedBooking.dentist,
        'dentist'
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 500 when updateBooking throws error', async () => {
      Booking.findById.mockImplementation(() => {
        throw new Error('DB error');
      });

      const req = {
        params: { id: 'booking1' },
        user: { id: 'admin1', role: 'admin' },
        body: {},
      };
      const res = mockRes();

      await updateBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot update booking',
      });
    });
  });

  describe('deleteBooking extra', () => {
    test('should delete booking successfully and notify user when dentist deletes', async () => {
      const booking = {
        _id: 'booking1',
        bookingDate: tomorrow(),
        user: { _id: { toString: () => 'user1' }, name: 'Patient', email: 'patient@example.com' },
        dentist: { _id: { toString: () => 'dentist1' }, name: 'Dentist', email: 'dentist@example.com' },
        deleteOne: jest.fn().mockResolvedValue(true),
      };

      Booking.findById.mockReturnValue(twoPopulate(booking));

      const req = {
        params: { id: 'booking1' },
        user: { id: 'dentist1', role: 'dentist' },
      };
      const res = mockRes();

      await deleteBooking(req, res);

      expect(booking.deleteOne).toHaveBeenCalled();
      expect(sendBookingDeletedNotification).toHaveBeenCalledWith(
        booking.user,
        booking,
        booking.dentist,
        'dentist'
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});