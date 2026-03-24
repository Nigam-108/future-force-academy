type SendSignupOtpEmailInput = {
  email: string;
  firstName: string;
  otp: string;
  expiresInMinutes: number;
};

export async function sendSignupOtpEmail(input: SendSignupOtpEmailInput) {
  console.log("📧 DEV SIGNUP OTP EMAIL");
  console.log(`To: ${input.email}`);
  console.log(`Hello ${input.firstName}, your Future Force Academy OTP is: ${input.otp}`);
  console.log(`This OTP will expire in ${input.expiresInMinutes} minutes.`);

  return {
    success: true,
    provider: "console-dev",
  };
}