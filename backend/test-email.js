require('dotenv').config();
const { sendEmail } = require('./services/emailService');

async function test() {
    const result = await sendEmail(
        'andresvergararobles@gmail.com',
        'Prueba de correo',
        '<h1>Hola!</h1><p>Este es un correo de prueba desde el Sistema de Gestión de Equipos.</p>'
    );
    console.log(result);
}

test();