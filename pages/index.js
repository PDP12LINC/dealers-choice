import { useState } from "react";
import { useRouter } from "next/router";
import supabase from "../lib/supabase";

export default function Auth() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLoginWithEmail() {
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/lobby");
    }
  }

  async function handleSignUpWithEmail() {
    setError("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      alert("Signup successful! Please check your email to confirm your account.");
    }
  }

  async function handleLoginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) {
      console.error("Google Login Error:", error.message);
    }
  }

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Login or Sign Up</h2>

      {/* Email & Password Login */}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", margin: "10px auto", padding: "8px" }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", margin: "10px auto", padding: "8px" }}
      />
      <button onClick={handleLoginWithEmail} style={{ marginRight: "10px" }}>Login</button>
      <button onClick={handleSignUpWithEmail}>Sign Up</button>

      {/* Google Login */}
      <hr style={{ margin: "20px" }} />
      <button onClick={handleLoginWithGoogle}>Sign in with Google</button>

      {/* Error Message */}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}