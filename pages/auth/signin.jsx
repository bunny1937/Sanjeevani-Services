// pages/auth/signin.jsx
import { useState } from "react";
import { signIn, getCsrfToken, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import styles from "./signin.module.css";

export default function SignIn({ csrfToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        router.push("/");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
        <h2 className={styles.title}>Client Login</h2>

        {error && <div className={styles.error}>{error}</div>}

        <label>Email</label>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.input}
          disabled={loading}
        />

        <label>Password</label>
        <input
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.input}
          disabled={loading}
        />

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  // If user is already logged in, redirect to dashboard
  if (session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const csrfToken = await getCsrfToken(context);

  return {
    props: {
      csrfToken: csrfToken ?? null,
    },
  };
}
