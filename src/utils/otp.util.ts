import prisma from "../config/prisma";
export const generateOtp = async (userId: string) => {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    await prisma.otp.create({
      data: {
        userId,
        code: otpCode,
      },
    });
    return otpCode;
  } catch (error) {
    console.error("Error creating OTP:", error);
    throw new Error("Unable to generate OTP. Please try again later.");
  }
};
