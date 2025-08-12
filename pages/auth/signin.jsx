// pages/auth/signin.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import styles from "./auth.module.css";

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn(formData.email, formData.password);

    if (result.success) {
      router.push("/");
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.formContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.error}>
                <span className={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? <span className={styles.spinner}></span> : "Sign In"}
            </button>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className={styles.link}>
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
