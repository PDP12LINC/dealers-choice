import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import supabase from "../lib/supabase";

export default function Auth() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false); // ✅ Fix: Force UI update on load

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
    console.log("Google login button clicked...");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/lobby" },
    });

    if (error) {
      console.error("Google Login Error:", error.message);
      alert(`Google Login Error: ${error.message}`);
    } else {
      console.log("Google Login Success:", data);
    }
  }

async function handleAnonymousLogin() {
  console.log("Anonymous login button clicked...");

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("Anonymous Login Error:", error.message);
    alert(`Anonymous Login Error: ${error.message}`);
    return;
  }

  console.log("Anonymous Login Success:", data);

  // Generate a unique guest name
  const guestNumber = Math.floor(100 + Math.random() * 900); // Random number between 100-999
  const guestName = `Guest_${guestNumber}`;

  // Save the guest name to Supabase
  const { error: nameError } = await supabase.auth.updateUser({
    data: { full_name: guestName },
  });

  if (nameError) {
    console.error("Error updating anonymous user name:", nameError.message);
  } else {
    console.log(`Assigned anonymous user name: ${guestName}`);
  }

  router.push("/lobby");
}

  if (!isLoaded) return <h2>Loading...</h2>; // ✅ Fix: Prevents stale UI

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

      <hr style={{ margin: "20px" }} />
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
  <button onClick={handleLoginWithGoogle}>Sign in with Google</button>
  <button onClick={handleAnonymousLogin}>Sign in Anonymously</button>
</div>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}