import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { votesRef, usersRef, set, update, onValue } from './firebaseConfig'; // Import Firebase v9 methods

const POINTS = [1, 2, 3, 5, 8, 13];

export default function ScrumPoker() {
  const [votes, setVotes] = useState({});
  const [users, setUsers] = useState([]);
  const [reveal, setReveal] = useState(false);
  const [name, setName] = useState("");
  const [selectedVote, setSelectedVote] = useState(null); // Track the user's selected vote

  // Listen for vote changes from Firebase
  useEffect(() => {
    // Fetch votes and revealVotes state
    onValue(votesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setVotes(data.votes || {});
        setReveal(data.revealVotes || false);
      }
    });

    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsers(Object.keys(data)); // Extract user names
      }
    });

    return () => {
      // Firebase cleanup (not needed in v9, as we aren't using off method)
    };
  }, []);

  const handleVote = (point) => {
    if (name) {
      update(votesRef, {
        [`votes/${name}`]: point,
      });
      setSelectedVote(point); // Update the selected vote for the user
    }
  };

  const handleJoin = () => {
    if (name) {
      let uniqueName = name;
      // Check if the user already exists
      if (users.includes(name)) {
        let counter = 1;
        while (users.includes(`${name}${counter}`)) {
          counter++;
        }
        uniqueName = `${name}${counter}`; // Append number to make it unique
      }

      update(usersRef, {
        [uniqueName]: true,
      });
      setName(uniqueName); // Update the name with the unique one
    }
  };

  const clearVotes = () => {
    setVotes({});
    setReveal(false);
    setSelectedVote(null); // Reset selected vote (remove highlight/border)
    set(votesRef, { votes: {}, revealVotes: false }); // Clear votes and reset reveal state in Firebase
  };

  const clearUsers = () => {
    setUsers([]);
    set(usersRef, {}); // Clear users from Firebase
  };

  const cleanSession = () => {
    setUsers([]);
    setVotes({});
    setSelectedVote(null); // Reset selected vote (remove highlight/border)
    set(usersRef, {}); // Clear users from Firebase
    set(votesRef, { votes: {}, revealVotes: false }); // Clear votes and reset reveal state in Firebase
  };

  // Toggle revealVotes state between true and false
  const revealVotesHandler = () => {
    const newRevealState = !reveal;  // Toggle the reveal state
    setReveal(newRevealState);  // Update the local state

    // Update the revealVotes state in Firebase
    set(votesRef, { 
      votes, 
      revealVotes: newRevealState 
    });
  };

  return (
    <div className="bg-gray-100 p-6 md:p-8 max-w-4xl mx-auto rounded-lg shadow-lg">
      {/* Title & Join Section */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Scrum Poker</h1>
        <div className="mb-4 flex justify-center items-center space-x-2">
          <input
            className="p-2 border rounded-md text-lg w-64"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className="p-2 bg-blue-500 text-white rounded-md text-lg hover:bg-blue-600 transition"
            onClick={handleJoin}
          >
            Join
          </button>
        </div>
      </motion.div>

      {/* Voting Section */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, scale: 0 }} 
        animate={{ opacity: 1, scale: 1}} 
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-3 gap-4 mb-6">
          {POINTS.map((point) => (
            <button
              key={point}
              onClick={() => handleVote(point)}
              className={`p-4 rounded-lg text-xl transition ${selectedVote === point ? 'border-4 border-orange-500' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              {point}
            </button>
          ))}
        </div>

        {/* Reveal Votes button */}
        <button
          className="p-3 bg-gray-500 text-white rounded-lg m-2 w-80 hover:bg-gray-600 transition"
          onClick={revealVotesHandler}
        >
          {reveal ? "Hide Votes" : "Reveal Votes"}
        </button>

        {/* Clear Votes button */}
        <button
          className="p-3 bg-gray-500 text-white rounded-lg m-2 w-80 hover:bg-gray-600 transition"
          onClick={clearVotes}
        >
          Clear Votes
        </button>

        {/* Clear Users button */}
        <button
          className="p-3 bg-gray-500 text-white rounded-lg m-2 w-80 hover:bg-gray-600 transition"
          onClick={clearUsers}
        >
          Clear Users
        </button>

        {/* Clean Session button */}
        <button
          className="p-3 bg-gray-500 text-white rounded-lg m-2 w-80 hover:bg-gray-600 transition"
          onClick={cleanSession}
        >
          Clean Session
        </button>
      </motion.div>

      {/* Displaying votes for each user */}
      <motion.div 
        className="space-y-4 mb-8"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.5 }}
      >
        {users.map((user) => (
          <div key={user} className="p-4 border rounded-lg bg-white text-lg font-semibold text-gray-800 shadow-md">
            <div className="flex justify-between items-center">
              <span>{user}</span>
              {/* Display the vote only if reveal is true or the user is viewing their own vote */}
              <span className="text-gray-600">
                {reveal || votes[user] === selectedVote ? votes[user] : "?"}
              </span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}