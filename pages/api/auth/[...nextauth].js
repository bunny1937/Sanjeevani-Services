// pages/api/auth/[...nextauth].js
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  try {
    // Import NextAuth at runtime
    const NextAuth = require("next-auth");

    // Handle different export patterns
    const NextAuthHandler = NextAuth.default || NextAuth;

    if (typeof NextAuthHandler !== "function") {
      console.error("NextAuth import failed:", typeof NextAuthHandler);
      return res.status(500).json({ error: "NextAuth setup error" });
    }

    const authOptions = {
      providers: [
        {
          id: "credentials",
          name: "Credentials",
          type: "credentials",
          credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
          },
          async authorize(credentials) {
            try {
              if (!credentials?.email || !credentials?.password) {
                console.log("❌ Missing credentials");
                return null;
              }

              console.log("🔍 Attempting to authenticate:", credentials.email);

              await connectDB();

              const user = await User.findOne({
                email: credentials.email,
              });

              if (!user) {
                console.log("❌ User not found");
                return null;
              }

              const isPasswordValid = await bcrypt.compare(
                credentials.password,
                user.password
              );

              if (!isPasswordValid) {
                console.log("❌ Invalid password");
                return null;
              }

              console.log("✅ User authenticated successfully");
              return {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
              };
            } catch (error) {
              console.error("❌ Authorization error:", error);
              return null;
            }
          },
        },
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
      debug: true,
    };

    return NextAuthHandler(req, res, authOptions);
  } catch (error) {
    console.error("NextAuth error:", error);
    return res.status(500).json({
      error: "Authentication setup failed",
      details: error.message,
    });
  }
}
