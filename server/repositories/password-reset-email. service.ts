type SendPasswordResetOtpEmailInput = {
  email: string;
  otp: string;
  expiresInMinutes: number;
};

export async function sendPasswordResetOtpEmail(input: SendPasswordResetOtpEmailInput) {
  console.log("📧 DEV PASSWORD RESET OTP EMAIL");
  console.log(`To: ${input.email}`);
  console.log(`Your Future Force Academy password reset OTP is: ${input.otp}`);
  console.log(`This OTP will expire in ${input.expiresInMinutes} minutes.`);

  return {
    success: true,
    provider: "console-dev",
  };
}