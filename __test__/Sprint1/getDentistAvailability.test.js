// __tests__/getDentistAvailability.test.js
const { getDentistAvailability } = require('../../controllers/bookings');
const Booking = require('../../models/Booking');

jest.mock('../../models/Booking');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('getDentistAvailability', () => {
    afterEach(() => jest.clearAllMocks());

    // TC1: Date fetch → 200 + all booking list
    test('should return all bookings with dentist and user info', async () => {
        const fakeBookings = [
            {
                _id: 'b1',
                bookingDate: '2025-01-01',
                dentist: { name: 'Dr.Smith', yearsOfExperience: 5, areaOfExpertise: 'Orthodontics' },
                user: { name: 'John', email: 'john@email.com' }
            },
            {
                _id: 'b2',
                bookingDate: '2025-01-02',
                dentist: { name: 'Dr.Jane', yearsOfExperience: 3, areaOfExpertise: 'Implants' },
                user: { name: 'Mary', email: 'mary@email.com' }
            }
        ];

        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBookings)
            })
        });

        const req = {};
        const res = mockRes();

        await getDentistAvailability(req, res);

        expect(Booking.find).toHaveBeenCalledWith();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            count: 2,
            data: fakeBookings
        }));
    });

    // TC2: Doesn't have booking → 200 + empty array
    test('should return empty array when no bookings exist', async () => {
        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue([])
            })
        });

        const req = {};
        const res = mockRes();

        await getDentistAvailability(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            count: 0,
            data: []
        }));
    });

    // TC3: Check populate dentist with correct field
    test('should populate dentist with correct fields', async () => {
        const populateMock = jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([])
        });
        Booking.find.mockReturnValue({ populate: populateMock });

        const req = {};
        const res = mockRes();

        await getDentistAvailability(req, res);

        expect(populateMock).toHaveBeenCalledWith(expect.objectContaining({
            path: 'dentist',
            select: 'name yearsOfExperience areaOfExpertise isDeleted isBanned'
        }));
    });

    // TC4: Check populate user with correct field
    test('should populate user with correct fields', async () => {
        const innerPopulateMock = jest.fn().mockResolvedValue([]);
        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({ populate: innerPopulateMock })
        });

        const req = {};
        const res = mockRes();

        await getDentistAvailability(req, res);

        expect(innerPopulateMock).toHaveBeenCalledWith(expect.objectContaining({
            path: 'user',
            select: 'name email isDeleted isBanned'
        }));
    });

    // TC5: Public endpoint — No req.user → OK
    test('should work without req.user (public endpoint)', async () => {
        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue([])
            })
        });

        const req = {}; // no user
        const res = mockRes();

        await getDentistAvailability(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    // TC6: Database error → 500
    test('should return 500 if database throws error', async () => {
        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('DB error'))
            })
        });

        const req = {};
        const res = mockRes();

        await getDentistAvailability(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: 'Cannot find bookings'
        }));
    });
});