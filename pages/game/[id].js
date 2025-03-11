import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import supabase from "../../lib/supabase";

export default function GamePage() {
  const router = useRouter();
  const { id } = router.query;

  const [game, setGame] = useState(null);
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    if (id) fetchGame();
  }, [id]);

  async function fetchGame() {
    const { data, error } = await supabase.from("games").select("*").eq("id", id).single();
    if (error) {
      console.error("Error fetching game:", error);
      return;
    }

    let parsedPlayers = typeof data.players === "string" ? JSON.parse(data.players) : data.players || [];

    setGame({ ...data, players: parsedPlayers });

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user;
    if (currentUser) {
      let foundPlayer = parsedPlayers.find((p) => p.id === currentUser.id) || {
        id: currentUser.id,
        name: currentUser.user_metadata?.full_name || "Unknown Player",
        hand: [],
      };
      setPlayer(foundPlayer);
    }
  }

  async function shuffleDeck() {
    if (!game) return;

    console.log("Shuffling deck...");
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    let newDeck = [];

    for (let suit of suits) {
      for (let value of values) {
        const formattedValue = value === "10" ? "0" : value;
        const imageUrl = `https://deckofcardsapi.com/static/img/${formattedValue}${suit.charAt(0).toUpperCase()}.png`;
        newDeck.push({ suit, value, image: imageUrl });
      }
    }

    newDeck = newDeck.sort(() => Math.random() - 0.5);

    const { error } = await supabase.from("games").update({ deck: newDeck, last_dealt_index: null }).eq("id", game.id);

    if (error) {
      console.error("Error saving shuffled deck:", error);
    } else {
      setGame({ ...game, deck: newDeck, last_dealt_index: null });
    }
  }

  async function dealCard(type) {
    if (!game || game.deck.length === 0) {
      alert("No cards left! Shuffle the deck.");
      return;
    }

    let nextPlayerIndex = game.last_dealt_index !== undefined ? (game.last_dealt_index + 1) % game.players.length : 0;
    const recipient = game.players[nextPlayerIndex];

    if (!recipient) return;

    const card = { ...game.deck.pop(), type };
    const updatedPlayers = game.players.map((p, index) =>
      index === nextPlayerIndex ? { ...p, hand: [...(p.hand || []), card] } : p
    );

    const { error } = await supabase
      .from("games")
      .update({ players: updatedPlayers, deck: game.deck, last_dealt_index: nextPlayerIndex })
      .eq("id", game.id);

    if (!error) setGame({ ...game, players: updatedPlayers, deck: game.deck, last_dealt_index: nextPlayerIndex });
  }

  async function endHand() {
    if (!game) return;

    const { error } = await supabase
      .from("games")
      .update({ players: game.players.map((p) => ({ ...p, hand: [] })), deck: [] })
      .eq("id", game.id);

    if (!error) fetchGame();
  }

  async function revealHand(playerId) {
    if (!game) return;

    const updatedPlayers = game.players.map((p) =>
      p.id === playerId ? { ...p, hand: p.hand.map((card) => ({ ...card, type: "face-up" })) } : p
    );

    const { error } = await supabase.from("games").update({ players: updatedPlayers }).eq("id", game.id);

    if (!error) setGame({ ...game, players: updatedPlayers });
  }

  async function joinGame() {
  if (!game || !player) return;

  console.log(`${player.name} is joining the game...`);

  const updatedPlayers = [...game.players, { id: player.id, name: player.name, hand: [] }];

  const { error } = await supabase
    .from("games")
    .update({ players: updatedPlayers })
    .eq("id", game.id);

  if (error) {
    console.error("Error joining game:", error);
  } else {
    console.log(`${player.name} joined the game!`);
    setGame({ ...game, players: updatedPlayers });
  }
}

  async function togglePeek(playerId) {
    if (!game) return;

    const updatedPlayers = game.players.map((p) =>
      p.id === playerId ? { ...p, hand: p.hand.map((card) => ({ ...card, peeked: !card.peeked })) } : p
    );

    const { error } = await supabase.from("games").update({ players: updatedPlayers }).eq("id", game.id);

    if (!error) setGame({ ...game, players: updatedPlayers });
  }

  if (!game) return <h2>Loading game...</h2>;

  return (
    <div>
      <h1>Game: {game.name}</h1>

      <h2>Players:</h2>
      <ul>
        {game.players.length > 0 ? (
          game.players.map((p) => (
            <li key={p.id} style={{ fontWeight: p.id === game.dealer_id ? "bold" : "normal", marginBottom: "20px" }}>
              {p.id === game.dealer_id ? `${p.name} (Dealer)` : p.name}

              {/* Player Cards */}
              {p.hand && p.hand.length > 0 && (
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  {p.hand.map((card, index) => (
                    <img
                      key={index}
                      src={card.peeked || card.type === "face-up" ? card.image : "https://deckofcardsapi.com/static/img/back.png"}
                      alt={card.peeked || card.type === "face-up" ? `${card.value} of ${card.suit}` : "Face-down card"}
                      style={{ width: "50px", height: "75px" }}
                    />
                  ))}
                </div>
              )}

              {/* Buttons (Below Cards, Above Back to Lobby) */}
              {p.id === player?.id && (
                <div style={{ marginTop: "10px", textAlign: "left" }}>
                  <button style={{ marginRight: "10px" }} onClick={() => revealHand(p.id)}>
                    Reveal Hand
                  </button>
                  <button onClick={() => togglePeek(p.id)}>Peek</button>
                </div>
              )}
            </li>
          ))
        ) : (
          <p>No players in the game yet.</p>
        )}
      </ul>

      {/* Show Join Game button if the user is not in the game */}
{!game.players.some((p) => p.id === player?.id) && (
  <button onClick={joinGame}>Join Game</button>
)}

      {/* Dealer Controls */}
      {player?.id === game.dealer_id && (
        <div style={{ marginTop: "20px" }}>
          <button onClick={shuffleDeck}>Shuffle Deck</button>
          <button onClick={() => dealCard("face-up")}>Deal Face-Up</button>
          <button onClick={() => dealCard("face-down")}>Deal Face-Down</button>
          <button onClick={endHand}>End Hand</button>
        </div>
      )}

      {/* Back to Lobby Button */}
      <button style={{ marginTop: "20px", textAlign: "left" }} onClick={() => router.push("/lobby")}>
        Back to Lobby
      </button>
    </div>
  );
}