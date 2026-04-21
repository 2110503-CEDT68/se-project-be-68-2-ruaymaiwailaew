const { deleteBooking } = require('../controllers/bookings');
const Booking = require('../models/Booking');

jest.mock('../models/Booking');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// Helper: mock findById to return a value via .populate().populate() chain
const mockFindById = (resolvedValue) => {
    const inner = { populate: jest.fn().mockResolvedValue(resolvedValue) };
    const outer = { populate: jest.fn().mockReturnValue(inner) };
    Booking.findById.mockReturnValue(outer);
};

describe('deleteBooking', () => {
    afterEach(() => jest.clearAllMocks());

    // TC1: Booking not found → 404
    test('should return 404 if booking not found', async () => {
        mockFindById(null);

        const req = { params: { id: 'nonexistent_id' }, user: { id: 'u1', role: 'user' } };
        const res = mockRes();

        await deleteBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    // TC2: Admin can delete any booking → 200
    test('should allow admin to delete any booking', async () => {
        const fakeBooking = {
            _id: 'b1',
            user: { _id: { toString: () => 'u1' } },
            dentist: { _id: { toString: () => 'd1' } },
            deleteOne: jest.fn().mockResolvedValue({})
        };
        mockFindById(fakeBooking);

        const req = { params: { id: 'b1' }, user: { id: 'admin1', role: 'admin' } };
        const res = mockRes();

        await deleteBooking(req, res);

        expect(fakeBooking.deleteOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: {} }));
    });

    // TC3: User delete own booking → 200
    test('should allow user to delete their own booking', async () => {
        const fakeBooking = {
            _id: 'b1',
            user: { _id: { toString: () => 'u1' } },
            dentist: { _id: { toString: () => 'd1' } },
            deleteOne: jest.fn().mockResolvedValue({})
        };
        mockFindById(fakeBooking);

        const req = { params: { id: 'b1' }, user: { id: 'u1', role: 'user' } };
        const res = mockRes();

        await deleteBooking(req, res);

        expect(fakeBooking.deleteOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // TC4: User try delete other booking → 403
    test('should return 403 if user tries to delete another user booking', async () => {
        const fakeBooking = {
            _id: 'b1',
            user: { _id: { toString: () => 'u2' } },
            dentist: { _id: { toString: () => 'd1' } },
            deleteOne: jest.fn()
        };
        mockFindById(fakeBooking);

        const req = { params: { id: 'b1' }, user: { id: 'u1', role: 'user' } };
        const res = mockRes();

        await deleteBooking(req, res);

        expect(fakeBooking.deleteOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    // TC5: Dentist delete own booking → 200
    test('should allow dentist to delete their own booking', async () => {
        const fakeBooking = {
            _id: 'b1',
            user: { _id: { toString: () => 'u1' } },
            dentist: { _id: { toString: () => 'd1' } },
            deleteOne: jest.fn().mockResolvedValue({})
        };
        mockFindById(fakeBooking);

        const req = { params: { id: 'b1' }, user: { id: 'd1', role: 'dentist' } };
        const res = mockRes();

        await deleteBooking(req, res);

        expect(fakeBooking.deleteOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // TC6: Dentist try delete other dentist booking → 403
    test('should return 403 if dentist tries to delete another dentist booking', async () => {
        const fakeBooking = {
            _id: 'b1',
            user: { _id: { toString: () => 'u1' } },
            dentist: { _id: { toString: () => 'd2' } },
            deleteOne: jest.fn()
        };
        mockFindById(fakeBooking);

        const req = { params: { id: 'b1' }, user: { id: 'd1', role: 'dentist' } };
        const res = mockRes();

        await deleteBooking(req, res);

        expect(fakeBooking.deleteOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    // TC7: Unknown role → 403
    test('should return 403 for unknown role', async () => {
        const fakeBooking = {
            _id: 'b1',
            user: { _id: { toString: () => 'u1' } },
            dentist: { _id: { toString: () => 'd1' } },
            deleteOne: jest.fn()
        };
        mockFindById(fakeBooking);

        const req = { params: { id: 'b1' }, user: { id: 'x1', role: 'unknown' } };
        const res = mockRes();

        await deleteBooking(req, res);

        expect(fakeBooking.deleteOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    // TC8: Database error → 500
    test('should return 500 if database throws error', async () => {
        const inner = { populate: jest.fn().mockRejectedValue(new Error('DB error')) };
        const outer = { populate: jest.fn().mockReturnValue(inner) };
        Booking.findById.mockReturnValue(outer);

        const req = { params: { id: 'b1' }, user: { id: 'u1', role: 'user' } };
        const res = mockRes();

        await deleteBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
});