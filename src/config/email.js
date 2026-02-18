import { Resend } from "resend";

// Inicializar Resend con la API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Plantilla del email de recupero
export const enviarEmailRecupero = async (email, token) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/recuperar-password?token=${token}&email=${email}`;

  try {
    const data = await resend.emails.send({
      from: "Gimnasio Vikingo <onboarding@resend.dev>",
      to: email,
      subject: "Recuperación de contraseña - Gimnasio Vikingo",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #c9a227;">Recuperación de contraseña</h2>
          <p>Has solicitado recuperar tu contraseña para el panel de administración del Gimnasio Vikingo.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #c9a227; color: #000; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Restablecer contraseña
            </a>
          </p>
          <p>Este enlace expirará en 1 hora.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">
            Gimnasio Vikingo - Sistema de gestión
          </p>
        </div>
      `,
    });

    console.log(`📧 Email de recupero enviado a ${email}:`, data);
    return true;
  } catch (error) {
    console.error("❌ Error al enviar email:", error.message);
    
    // Si es error de Resend (dominio no verificado o límite alcanzado)
    if (error.message?.includes('validation_error') || error.message?.includes('only send testing emails')) {
      console.log("\n═══════════════════════════════════════════");
      console.log("📧 ENLACE DE RECUPERO DE CONTRASEÑA:");
      console.log(`   ${resetUrl}`);
      console.log("═══════════════════════════════════════════\n");
      return true; // Retornamos true para que el flujo continúe
    }
    
    return false;
  }
};
