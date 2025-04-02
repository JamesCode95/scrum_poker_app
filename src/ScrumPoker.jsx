import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { votesRef, usersRef, set, update, onValue, onChildAdded, onChildRemoved } from './firebaseConfig';

const POINTS = [1, 2, 3, 5, 8, 13];

export default function ScrumPoker() {
  const [votes, setVotes] = useState({});
  const [users, setUsers] = useState([]);
  const [reveal, setReveal] = useState(false);
  const [name, setName] = useState("");
  const [selectedVote, setSelectedVote] = useState(null); 

  // Listen for changes from Firebase
  useEffect(() => {
    const fetchVotes = onValue(votesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setVotes(data.votes || {});
        setReveal(data.revealVotes || false);
      }
    });

    // Listen for users being added or removed in real-time
    const fetchUsers = onChildAdded(usersRef, (snapshot) => {
      const userName = snapshot.key;
      setUsers((prevUsers) => [...prevUsers, userName]); 
    });

    const removeUserListener = onChildRemoved(usersRef, (snapshot) => {
      const userName = snapshot.key;
      setUsers((prevUsers) => prevUsers.filter(user => user !== userName));
    });

    return () => {
      fetchVotes();
      removeUserListener();
    };
  }, []);

  const handleVote = (point) => {
    if (name) {
      update(votesRef, {
        [`votes/${name}`]: point,
      });

      setSelectedVote(point); 
    }
  };

  const handleJoin = () => {
    if (name) {
      let uniqueName = name;

      if (users.includes(name)) {
        let counter = 1;
        while (users.includes(`${name}${counter}`)) {
          counter++;
        }
        uniqueName = `${name}${counter}`;
      }

      update(usersRef, {
        [uniqueName]: true,
      });
      setName(uniqueName);
    }
  };

  const clearVotes = () => {
    set(votesRef, {
      votes: {},
      revealVotes: false,
    });

    setSelectedVote(null);
  };

  const clearUsers = () => {
    setUsers([]);
    set(usersRef, {});
  };

  const cleanSession = () => {
    setUsers([]);
    setVotes({});
    setSelectedVote(null);
    set(usersRef, {});
    set(votesRef, { votes: {}, revealVotes: false });
  };

  // Toggle revealVotes state between true and false
  const revealVotesHandler = () => {
    const newRevealState = !reveal;
    setReveal(newRevealState);

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

      {/* voting results/user cards */}
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
