import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import supabase from "../lib/supabase";

export default function Lobby() {
  const [games, setGames] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [gameName, setGameName] = useState("");
  const [numDecks, setNumDecks] = useState(1);
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(7);
  const router = useRouter();
  const [user, setUser] = useState(null);
useEffect(() => {
  async function fetchUserAndGames() {
    const { data, error } = await supabase.auth.getUser();

    if (data?.user) {
      const userId = data.user.id;

      // Fetch user metadata (including full_name)
      const { data: userDetails, error: userError } = await supabase.auth.getUser();

      let userName = "Guest"; // Default for anonymous users

      if (userDetails?.user?.user_metadata?.full_name) {
        userName = userDetails.user.user_metadata.full_name; // Use full name if available
      } else if (data.user.email) {
        userName = data.user.email; // Fallback to email for registered users
      }

      setUser({
        ...data.user,
        name: userName,
      });
    } else {
      router.push("/auth"); // Redirect to login if not logged in
    }

    fetchGames();
  }

  fetchUserAndGames();
}, []);

  async function handleLogout() {
  await supabase.auth.signOut();
  router.push("/auth"); // Redirect to login screen
}

  async function fetchGames() {
    let { data, error } = await supabase.from("games").select("*");
    if (error) console.error("Error fetching games:", error);
    else setGames(data);
  }

async function createGame() {
  console.log("Attempting to create a game...");

  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user || !user.user) {
    console.error("Authentication error:", authError || "No user found!");
    return;
  }

  console.log("User authenticated:", user.user);

const dealerName = user.user.user_metadata?.full_name || user.user.email || "Unknown Player";
console.log("Dealer Name Being Stored:", dealerName); // Debugging log

const newGame = {
  name: gameName || `Game ${Date.now()}`,
  status: "open",
  dealer_id: user.user.id,
  min_players: minPlayers,
  max_players: maxPlayers,
  num_decks: numDecks,
  players: [{ id: user.user.id, name: dealerName }],
  deck: []
};

  console.log("New game data:", newGame);

  const { error } = await supabase.from("games").insert([newGame]);

  if (error) {
    console.error("Supabase Insert Error:", error);
  } else {
    console.log("Game created successfully!");
    setShowForm(false);
    fetchGames(); // Refresh game list
  }
}
  return (
    <div style={{ padding: "20px" }}>
      <h1>Game Lobby</h1>

      {user && (
  <div>
    {user && <p>Welcome, {user.name}</p>}
    <button onClick={handleLogout}>Logout</button>
  </div>
)}

      {!showForm ? (
        <button onClick={() => setShowForm(true)}>Create Game</button>
      ) : (
        <div>
          <h2>Create a New Game</h2>
          <input
            type="text"
            placeholder="Game Name"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
          />
          <label>Decks:</label>
          <select value={numDecks} onChange={(e) => setNumDecks(Number(e.target.value))}>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <label>Min Players:</label>
          <input
            type="number"
            value={minPlayers}
            min="2"
            max="7"
            onChange={(e) => setMinPlayers(Number(e.target.value))}
          />
          <label>Max Players:</label>
          <input
            type="number"
            value={maxPlayers}
            min={minPlayers}
            max="7"
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
          />

          <button onClick={createGame}>Start Game</button>
          <button onClick={() => setShowForm(false)}>Cancel</button>
        </div>
      )}

      <h2>Open Games:</h2>
      <ul>
        {games.map((game) => (
          <li key={game.id} onClick={() => router.push(`/game/${game.id}`)}
              style={{ cursor: "pointer", textDecoration: "underline" }}>
            {game.name} - {game.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
