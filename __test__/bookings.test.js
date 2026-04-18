// bookings.test.js
const { updateBooking } = require('../controllers/bookings');
const Booking = require('../models/Booking');

jest.mock('../models/Booking');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('updateBooking', () => {
    afterEach(() => jest.clearAllMocks());

    // TC1: Booking not found → 404
    test('should return 404 if booking not found', async () => {
        Booking.findById.mockResolvedValue(null);

        const req = { params: { id: 'nonexistent_id' }, user: { id: 'u1', role: 'user' }, body: {} };
        const res = mockRes();

        await updateBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    // TC2: Admin can update booking any booking → 200
    test('should allow admin to update any booking', async () => {
        const fakeBooking = { _id: 'b1', user: 'u1', dentist: 'd1' };
        Booking.findById.mockResolvedValue(fakeBooking);
        Booking.findByIdAndUpdate.mockResolvedValue({ ...fakeBooking, bookingDate: '2025-01-01' });

        const req = {
            params: { id: 'b1' },
            user: { id: 'admin1', role: 'admin' },
            body: { bookingDate: '2025-01-01' }
        };
        const res = mockRes();

        await updateBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    // TC3: User update own booking → 200
    test('should allow user to update their own booking', async () => {
        const fakeBooking = { _id: 'b1', user: { toString: () => 'u1' }, dentist: 'd1' };
        Booking.findById.mockResolvedValue(fakeBooking);
        Booking.findByIdAndUpdate.mockResolvedValue({ ...fakeBooking, bookingDate: '2025-02-01' });

        const req = {
            params: { id: 'b1' },
            user: { id: 'u1', role: 'user' },
            body: { bookingDate: '2025-02-01' }
        };
        const res = mockRes();

        await updateBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    // TC4: User try update other booking → 403
    test('should return 403 if user tries to update another user booking', async () => {
        const fakeBooking = { _id: 'b1', user: { toString: () => 'u2' }, dentist: 'd1' };
        Booking.findById.mockResolvedValue(fakeBooking);

        const req = {
            params: { id: 'b1' },
            user: { id: 'u1', role: 'user' },
            body: {}
        };
        const res = mockRes();

        await updateBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    // TC5: Dentist update own booking → 200
    test('should allow dentist to update their own booking', async () => {
        const fakeBooking = { _id: 'b1', user: 'u1', dentist: { toString: () => 'd1' } };
        Booking.findById.mockResolvedValue(fakeBooking);
        Booking.findByIdAndUpdate.mockResolvedValue({ ...fakeBooking, bookingDate: '2025-03-01' });

        const req = {
            params: { id: 'b1' },
            user: { id: 'd1', role: 'dentist' },
            body: { bookingDate: '2025-03-01' }
        };
        const res = mockRes();

        await updateBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    // TC6: Dentist try update booking other dentist -> 403
    test('should return 403 if dentist tries to update another dentist booking', async () => {
        const fakeBooking = { _id: 'b1', user: 'u1', dentist: { toString: () => 'd2' } };
        Booking.findById.mockResolvedValue(fakeBooking);

        const req = {
            params: { id: 'b1' },
            user: { id: 'd1', role: 'dentist' },
            body: {}
        };
        const res = mockRes();

        await updateBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    // TC7: Database error → 500
    test('should return 500 if database throws error', async () => {
        Booking.findById.mockRejectedValue(new Error('DB error'));

        const req = {
            params: { id: 'b1' },
            user: { id: 'u1', role: 'user' },
            body: {}
        };
        const res = mockRes();

        await updateBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});