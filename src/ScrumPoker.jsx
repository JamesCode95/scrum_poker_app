import { useState } from "react";
import { motion } from "framer-motion";

const POINTS = [1, 2, 3, 5, 8, 13];

export default function ScrumPoker() {
  const [votes, setVotes] = useState({});
  const [reveal, setReveal] = useState(false);
  const [name, setName] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  const handleVote = (point) => {
    if (name) {
      if (votes[name]) {
        // If the user already voted, show warning
        setWarningMessage("Not today satan! No changing your mind...");
      } else {
        setVotes((prev) => ({ ...prev, [name]: point }));
        setWarningMessage(""); // Clear any warnings
      }
    }
  };

  const clearVotes = () => {
    setVotes({});
    setReveal(false);
    setWarningMessage(""); // Clear any warning on reset
  };

  const toggleReveal = () => {
    setReveal((prev) => !prev);
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl text-center">
        <h1 className="text-3xl font-bold mb-6 text-blue-500">Scrum Poker</h1>
        
        <input
          className="mb-6 p-3 border-2 border-gray-300 rounded w-full text-lg"
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-3 gap-4 mb-6">
          {POINTS.map((point) => (
            <motion.button
              key={point}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 bg-blue-500 text-white rounded-xl text-lg font-semibold"
              onClick={() => handleVote(point)}
            >
              {point}
            </motion.button>
          ))}
        </div>

        {warningMessage && (
          <div className="mb-4 text-red-500 font-semibold">
            {warningMessage}
          </div>
        )}

        <div className="flex justify-center gap-4 mb-6">
          <button
            className="bg-green-500 text-white py-2 px-4 rounded-xl font-semibold text-lg"
            onClick={toggleReveal}
          >
            {reveal ? "Hide Votes" : "Reveal Votes"}
          </button>
          <button
            className="bg-red-500 text-white py-2 px-4 rounded-xl font-semibold text-lg"
            onClick={clearVotes}
          >
            Clear Votes
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {Object.entries(votes).map(([user, point]) => (
            <div
              key={user}
              className="p-4 bg-gray-200 border-2 border-gray-400 rounded-lg text-lg font-bold"
            >
              {user}: {reveal ? point : "?"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}