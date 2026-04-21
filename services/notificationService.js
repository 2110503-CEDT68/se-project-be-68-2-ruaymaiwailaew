const { Resend } = require('resend');

// Initialize Resend only if API key is available
let resend = null;
if (process.env.MAIL_API) {
    resend = new Resend(process.env.MAIL_API);
}

const logError = (err) => {
    if (process.env.NODE_ENV !== 'test') {
        console.log('Email sending error:', err);
    }
};

/**
 * Send booking created notification to dentist
 * @param {Object} dentist - Dentist user object
 * @param {Object} user - User object
 * @param {Object} booking - Booking object
 */
exports.sendBookingCreatedNotification = async (dentist, user, booking) => {
    if (!resend) {
        if (process.env.NODE_ENV !== 'test') {
            logError('Resend API key not configured');
        }
        return;
    }
    
    try {
        const bookingDate = new Date(booking.bookingDate).toLocaleDateString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        await resend.emails.send({
            from: 'noreply@ruaydentist.65737776.xyz',
            to: dentist.email,
            subject: 'มีการจองนัดหมอใหม่',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2c3e50;">มีการจองนัดหมอใหม่</h2>
                    <p>สวัสดีคุณ ${dentist.name},</p>
                    <p>มีผู้ใช้งานจองนัดหมอกับคุณ</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>รายละเอียดการจอง:</strong></p>
                        <p><strong>ชื่อผู้ใช้:</strong> ${user.name}</p>
                        <p><strong>เบอร์โทรศัพท์:</strong> ${user.telephone}</p>
                        <p><strong>อีเมล:</strong> ${user.email}</p>
                        <p><strong>วันที่จอง:</strong> ${bookingDate}</p>
                    </div>
                    
                    <p>กรุณาเข้าสู่ระบบเพื่อดูรายละเอียดเพิ่มเติม</p>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">ข้อความนี้ถูกส่งอัตโนมัติจากระบบจัดการนัดหมอ</p>
                </div>
            `
        });
    } catch (err) {
        logError(err);
    }
};

/**
 * Send booking updated notification
 * @param {Object} recipient - Recipient user object
 * @param {Object} booking - Booking object
 * @param {Object} otherUser - The other party (dentist or user)
 * @param {String} role - 'dentist' or 'user' (who made the update)
 */
exports.sendBookingUpdatedNotification = async (recipient, booking, otherUser, role) => {
    if (!resend) {
        if (process.env.NODE_ENV !== 'test') {
            logError('Resend API key not configured');
        }
        return;
    }
    
    try {
        const bookingDate = new Date(booking.bookingDate).toLocaleDateString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const subject = role === 'user' 
            ? 'คุณแพทย์ได้แก้ไขนัดหมอของคุณแล้ว'
            : 'ผู้ใช้ได้แก้ไขนัดหมอแล้ว';

        const message = role === 'user'
            ? `คุณแพทย์ ${otherUser.name} ได้แก้ไขนัดหมอของคุณ`
            : `${otherUser.name} ได้แก้ไขนัดหมอแล้ว`;

        await resend.emails.send({
            from: 'noreply@ruaydentist.65737776.xyz',
            to: recipient.email,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2c3e50;">แจ้งการแก้ไขนัดหมอ</h2>
                    <p>สวัสดีคุณ ${recipient.name},</p>
                    <p>${message}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>รายละเอียดการจองที่อัปเดต:</strong></p>
                        <p><strong>วันที่จอง:</strong> ${bookingDate}</p>
                        <p><strong>ตัวแทนคนเดียว:</strong> ${otherUser.name}</p>
                    </div>
                    
                    <p>กรุณาเข้าสู่ระบบเพื่อดูรายละเอียดเพิ่มเติม</p>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">ข้อความนี้ถูกส่งอัตโนมัติจากระบบจัดการนัดหมอ</p>
                </div>
            `
        });
    } catch (err) {
        logError(err);
    }
};

/**
 * Send booking deleted notification
 * @param {Object} recipient - Recipient user object
 * @param {Object} booking - Booking object
 * @param {Object} otherUser - The other party (dentist or user)
 * @param {String} role - 'dentist' or 'user' (who made the deletion)
 */
exports.sendBookingDeletedNotification = async (recipient, booking, otherUser, role) => {
    if (!resend) {
        if (process.env.NODE_ENV !== 'test') {
            logError('Resend API key not configured');
        }
        return;
    }
    
    try {
        const bookingDate = new Date(booking.bookingDate).toLocaleDateString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const subject = role === 'user'
            ? 'คุณแพทย์ได้ยกเลิกนัดหมอของคุณแล้ว'
            : 'ผู้ใช้ได้ยกเลิกนัดหมอแล้ว';

        const message = role === 'user'
            ? `คุณแพทย์ ${otherUser.name} ได้ยกเลิกนัดหมอของคุณ`
            : `${otherUser.name} ได้ยกเลิกนัดหมอแล้ว`;

        await resend.emails.send({
            from: 'noreply@ruaydentist.65737776.xyz',
            to: recipient.email,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #e74c3c;">แจ้งการยกเลิกนัดหมอ</h2>
                    <p>สวัสดีคุณ ${recipient.name},</p>
                    <p>${message}</p>
                    
                    <div style="background-color: #ffe6e6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>รายละเอียดนัดหมอที่ยกเลิก:</strong></p>
                        <p><strong>วันที่จอง:</strong> ${bookingDate}</p>
                        <p><strong>ตัวแทนคนเดียว:</strong> ${otherUser.name}</p>
                    </div>
                    
                    <p>หากคุณมีคำถามใด ๆ โปรดติดต่อระบบ</p>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">ข้อความนี้ถูกส่งอัตโนมัติจากระบบจัดการนัดหมอ</p>
                </div>
            `
        });
    } catch (err) {
        logError(err);
    }
};
