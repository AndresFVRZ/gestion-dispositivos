const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Sistema de Gestión de Equipos" <${process.env.SMTP_FROM}>`,
            to,
            subject,
            html,
        });
        console.log('✅ Email enviado:', info.messageId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendEmail };