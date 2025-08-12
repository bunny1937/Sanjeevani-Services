// pages/api/test-auth.js
import { getServerSession } from "next-auth/next";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Import your auth options (you might want to move this to a separate file)
const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Your authorization logic here
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export default async function handler(req, res) {
  try {
    // Test environment variables
    const envCheck = {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "Present" : "Missing",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL
        ? process.env.NEXTAUTH_URL
        : "Not set",
      MONGODB_URI: process.env.MONGODB_URI ? "Present" : "Missing",
      NODE_ENV: process.env.NODE_ENV,
    };

    // Test session
    let sessionTest = null;
    let sessionError = null;

    try {
      sessionTest = await getServerSession(req, res, authOptions);
    } catch (error) {
      sessionError = error.message;
    }

    // Test database connection (if you have a test function)
    let dbTest = "Not tested";
    try {
      // You might want to import and test your connectDB function here
      dbTest = "Connection test not implemented";
    } catch (error) {
      dbTest = `Error: ${error.message}`;
    }

    res.status(200).json({
      message: "Authentication test endpoint",
      timestamp: new Date().toISOString(),
      environment: envCheck,
      session: sessionTest
        ? {
            authenticated: true,
            user: sessionTest.user,
          }
        : {
            authenticated: false,
            error: sessionError,
          },
      database: dbTest,
      nextAuthVersion: "5.x", // Update based on your version
    });
  } catch (error) {
    console.error("Test auth error:", error);
    res.status(500).json({
      error: "Test authentication failed",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
