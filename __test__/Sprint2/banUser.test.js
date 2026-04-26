const { banUser, login } = require('../../controllers/auth');
const User = require('../../models/User');

jest.mock('../../models/User');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockUserInstance = {
    getSignedJwtToken: jest.fn().mockReturnValue('mock_token'),
};

describe('US2-4: Ban User', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_COOKIE_EXPIRE = '1';
        process.env.NODE_ENV = 'test';
    });

    // AC1: Admin ban user complete
    describe('AC1 - Admin bans a user successfully', () => {
        // TC1: ban complete with reason
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
                body: { userId: 'user123', reason: 'Violated policy' },
            };
            const res = mockRes();

            User.findById.mockResolvedValue(mockUser);

            await banUser(req, res);

            expect(mockUser.isBanned).toBe(true);
            expect(mockUser.banReason).toBe('Violated policy');
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'user has been banned successfully',
                })
            );
        });
        // TC2: ban complete with no reason
        test('TC2: should use "No reason provided" when reason is not given', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'user@example.com',
                role: 'user',
                isBanned: false,
                save: jest.fn().mockResolvedValue(true),
            };

            const req = {
                body: { userId: 'user123' },
            };
            const res = mockRes();

            User.findById.mockResolvedValue(mockUser);

            await banUser(req, res);

            expect(mockUser.banReason).toBe('No reason provided');
            expect(res.status).toHaveBeenCalledWith(200);
        });
        // TC3: no userId
        test('TC3: should return 400 when userId is not provided', async () => {
            const req = { body: {} };
            const res = mockRes();

            await banUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Please provide userId' })
            );
        });
        // TC4: user not found
        test('TC4: should return 404 when user is not found', async () => {
            const req = { body: { userId: 'nonexistent' } };
            const res = mockRes();

            User.findById.mockResolvedValue(null);

            await banUser(req, res);
        
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'User not found' })
            );
        });
        // TC5: user already banned
        test('TC5: should return 400 when user is already banned', async () => {
            const mockUser = {
                _id: 'user123',
                isBanned: true,
            };
        
            const req = { body: { userId: 'user123' } };
            const res = mockRes();
        
            User.findById.mockResolvedValue(mockUser);
        
            await banUser(req, res);
        
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'This user is already banned' })
            );
        });
        // TC6: something when wrong
        test('TC6: should return 500 when an unexpected error occurs', async () => {
            const req = { body: { userId: 'user123' } };
            const res = mockRes();
        
            User.findById.mockRejectedValue(new Error('DB error'));
        
            await banUser(req, res);
        
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false })
            );
        });
        
    });
        
});
