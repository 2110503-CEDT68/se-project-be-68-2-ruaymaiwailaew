describe('notificationService coverage', () => {
  let mockSend;

  const dentist = {
    name: 'Dr. Dentist',
    email: 'dentist@example.com',
  };

  const user = {
    name: 'Patient',
    email: 'patient@example.com',
    telephone: '0812345678',
  };

  const booking = {
    bookingDate: new Date('2026-05-01T10:00:00.000Z'),
  };

  const loadService = (hasMailApi = true) => {
    jest.resetModules();

    mockSend = jest.fn();

    if (hasMailApi) {
      process.env.MAIL_API = 'test-api-key';
    } else {
      delete process.env.MAIL_API;
    }

    jest.doMock('resend', () => ({
      Resend: jest.fn().mockImplementation(() => ({
        emails: {
          send: mockSend,
        },
      })),
    }));

    return require('../../services/notificationService');
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.MAIL_API;
  });

  test('should return early when MAIL_API is not configured for all notification functions', async () => {
    process.env.NODE_ENV = 'development';
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const service = loadService(false);

    await service.sendBookingCreatedNotification(dentist, user, booking);
    await service.sendBookingUpdatedNotification(dentist, booking, user, 'user');
    await service.sendBookingDeletedNotification(dentist, booking, user, 'user');

    expect(mockSend).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('should send booking created notification successfully', async () => {
    mockSend = jest.fn().mockResolvedValue({ id: 'email1' });

    const service = loadService(true);
    mockSend.mockResolvedValue({ id: 'email1' });

    await service.sendBookingCreatedNotification(dentist, user, booking);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@ruaydentist.65737776.xyz',
        to: dentist.email,
        subject: 'มีการจองนัดหมอใหม่',
        html: expect.stringContaining(user.name),
      })
    );
  });

  test('should handle booking created notification error', async () => {
    process.env.NODE_ENV = 'development';
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const service = loadService(true);
    mockSend.mockRejectedValue(new Error('email error'));

    await service.sendBookingCreatedNotification(dentist, user, booking);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Email sending error:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  test('should send booking updated notification when role is dentist', async () => {
    const service = loadService(true);
    mockSend.mockResolvedValue({ id: 'email1' });

    await service.sendBookingUpdatedNotification(user, booking, dentist, 'dentist');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: 'คุณแพทย์ได้แก้ไขนัดหมอของคุณแล้ว',
        html: expect.stringContaining(dentist.name),
      })
    );
  });

  test('should send booking updated notification when role is user', async () => {
    const service = loadService(true);
    mockSend.mockResolvedValue({ id: 'email1' });

    await service.sendBookingUpdatedNotification(dentist, booking, user, 'user');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: dentist.email,
        subject: 'ผู้ใช้ได้แก้ไขนัดหมอแล้ว',
        html: expect.stringContaining(user.name),
      })
    );
  });

  test('should handle booking updated notification error', async () => {
    process.env.NODE_ENV = 'development';
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const service = loadService(true);
    mockSend.mockRejectedValue(new Error('email error'));

    await service.sendBookingUpdatedNotification(dentist, booking, user, 'user');

    expect(consoleSpy).toHaveBeenCalledWith(
      'Email sending error:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  test('should send booking deleted notification when role is dentist', async () => {
    const service = loadService(true);
    mockSend.mockResolvedValue({ id: 'email1' });

    await service.sendBookingDeletedNotification(user, booking, dentist, 'dentist');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: 'คุณแพทย์ได้ยกเลิกนัดหมอของคุณแล้ว',
        html: expect.stringContaining(dentist.name),
      })
    );
  });

  test('should send booking deleted notification when role is user', async () => {
    const service = loadService(true);
    mockSend.mockResolvedValue({ id: 'email1' });

    await service.sendBookingDeletedNotification(dentist, booking, user, 'user');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: dentist.email,
        subject: 'ผู้ใช้ได้ยกเลิกนัดหมอแล้ว',
        html: expect.stringContaining(user.name),
      })
    );
  });

  test('should handle booking deleted notification error', async () => {
    process.env.NODE_ENV = 'development';
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const service = loadService(true);
    mockSend.mockRejectedValue(new Error('email error'));

    await service.sendBookingDeletedNotification(dentist, booking, user, 'user');

    expect(consoleSpy).toHaveBeenCalledWith(
      'Email sending error:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});