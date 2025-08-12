// pages/_app.js
import { AuthProvider } from "../context/AuthContext";
import "../styles/global.css";
import Layout from "../components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
