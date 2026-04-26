// __tests__/getBookings.test.js
const { getBookings } = require('../../controllers/bookings');
const Booking = require('../../models/Booking');

jest.mock('../../models/Booking');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// Mock populate chain
const mockPopulate = (returnValue) => {
    const chain = { populate: jest.fn() };
    chain.populate.mockReturnValue(chain);
    chain.populate.mockResolvedValueOnce(returnValue);
    return chain;
};

describe('getBookings', () => {
    afterEach(() => jest.clearAllMocks());

    // TC1: Dentist view own booking → 200
    test('should return only dentist own bookings', async () => {
        const fakeBookings = [
            { _id: 'b1', dentist: 'd1', user: 'u1', bookingDate: '2025-01-01' },
            { _id: 'b2', dentist: 'd1', user: 'u2', bookingDate: '2025-01-02' }
        ];

        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBookings)
            })
        });

        const req = { user: { id: 'd1', role: 'dentist' } };
        const res = mockRes();

        await getBookings(req, res);

        expect(Booking.find).toHaveBeenCalledWith({ dentist: 'd1' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            count: 2,
            data: fakeBookings
        }));
    });

    // TC2: Dentist doesn't have booking → 200 + empty array
    test('should return empty array if dentist has no bookings', async () => {
        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue([])
            })
        });

        const req = { user: { id: 'd1', role: 'dentist' } };
        const res = mockRes();

        await getBookings(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            count: 0,
            data: []
        }));
    });

    // TC3: Admin view all booking → 200
    test('should return all bookings for admin', async () => {
        const fakeBookings = [
            { _id: 'b1', dentist: 'd1', user: 'u1' },
            { _id: 'b2', dentist: 'd2', user: 'u2' }
        ];

        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBookings)
            })
        });

        const req = { user: { id: 'admin1', role: 'admin' } };
        const res = mockRes();

        await getBookings(req, res);

        expect(Booking.find).toHaveBeenCalledWith();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            count: 2
        }));
    });

    // TC4: User view own booking → 200
    test('should return only user own bookings', async () => {
        const fakeBookings = [
            { _id: 'b1', dentist: 'd1', user: 'u1' }
        ];

        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBookings)
            })
        });

        const req = { user: { id: 'u1', role: 'user' } };
        const res = mockRes();

        await getBookings(req, res);

        expect(Booking.find).toHaveBeenCalledWith({ user: 'u1' });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // TC5: Database error → 500
    test('should return 500 if database throws error', async () => {
        Booking.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('DB error'))
            })
        });

        const req = { user: { id: 'd1', role: 'dentist' } };
        const res = mockRes();

        await getBookings(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: 'Cannot find bookings'
        }));
    });
});