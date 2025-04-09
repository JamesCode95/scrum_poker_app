import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import {
  db,
  votesRef,
  usersRef,
  ref,
  set,
  update,
  onValue,
  onChildAdded,
  onChildRemoved,
  remove
} from "./firebaseConfig";
import { v4 as uuidv4 } from "uuid";

const POINTS = [1, 2, 3, 5, 8, 13];
const DANIEL_NAMES = ["daniel", "dk", "daniel k", "dan", "daniel kaczorek"];

export default function ScrumPoker() {
  const [votes, setVotes] = useState({});
  const [users, setUsers] = useState([]);
  const [reveal, setReveal] = useState(false);
  const [name, setName] = useState("");
  const [selectedVote, setSelectedVote] = useState(null);
  const [role, setRole] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [showDanielModal, setShowDanielModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [guid, setGuid] = useState("");

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userData="));

    if (cookie) {
      const decoded = decodeURIComponent(cookie.split("=")[1]);
      const [storedName, storedRole, storedGuid] = decoded.split("|");

      setGuid(storedGuid); 

      onValue(usersRef, (snapshot) => {
        const usersData = snapshot.val();
        if (usersData && usersData[storedGuid]) {
          const { name: firebaseName, role: firebaseRole } = usersData[storedGuid];
          setName(firebaseName);
          setRole(firebaseRole);
          setHasJoined(true);
        } else {
          document.cookie = "userData=; path=/; max-age=0";
        }
      }, { onlyOnce: true });
    }
  }, []);

  useEffect(() => {
    const unsubscribeVotes = onValue(votesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setVotes(data.votes || {});
        setReveal(data.revealVotes || false);
      }
    });

    const addUser = onChildAdded(usersRef, (snapshot) => {
      const userData = snapshot.val();
      setUsers((prevUsers) => {
        if (!prevUsers.some((u) => u.name === userData.name)) {
          return [...prevUsers, userData];
        }
        return prevUsers;
      });
    });

    const removeUser = onChildRemoved(usersRef, (snapshot) => {
      const userData = snapshot.val();
      setUsers((prevUsers) => prevUsers.filter((user) => user.name !== userData.name));
      unsubscribeVotes();
    });

    return () => {
      unsubscribeVotes();
      addUser();
      removeUser();
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

  const handleJoin = async () => {
    if (name && role) {
      const lowerName = name.toLowerCase();
      if (DANIEL_NAMES.some((dn) => lowerName.includes(dn))) {
        setShowDanielModal(true);
        return;
      }
  
      if (users.some((u) => u.name === name)) {
        alert("This name is already taken. Please choose a different name.");
        return;
      }
  
      const newGuid = uuidv4();
      const cookieValue = `${name}|${role}|${newGuid}`;
      document.cookie = `userData=${encodeURIComponent(cookieValue)}; path=/; max-age=31536000; SameSite=None; Secure`;
  
      setGuid(newGuid);
  
      await update(usersRef, {
        [newGuid]: {
          name,
          role,
        },
      });
  
      setName(name);
      setRole(role);
      setHasJoined(true);
    }
  };  

  const handleLogout = () => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userData="));

    if (cookie) {
      const decoded = decodeURIComponent(cookie.split("=")[1]);
      const [, , guid] = decoded.split("|");
      if (guid) {
        remove(ref(db, `users/${guid}`));
      }
    }

    document.cookie = "userData=; path=/; max-age=0";
    window.location.reload();
  };

  const clearVotes = () => {
    set(votesRef, {
      votes: {},
      revealVotes: false,
    });
    setSelectedVote(null);
    setShowStats(false);
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
    setShowStats(false);
  };

  const revealVotesHandler = () => {
    const newRevealState = !reveal;
    setReveal(newRevealState);
    set(votesRef, {
      votes,
      revealVotes: newRevealState,
    });

    if (newRevealState) {
      setShowStats(true);
    }
  };

  const voteStats = () => {
    const voteValues = Object.values(votes);
    const countByVote = {};
    voteValues.forEach((v) => {
      countByVote[v] = (countByVote[v] || 0) + 1;
    });
    const avg = voteValues.reduce((a, b) => a + b, 0) / voteValues.length || 0;
    const closest = POINTS.reduce((prev, curr) =>
      Math.abs(curr - avg) < Math.abs(prev - avg) ? curr : prev
    );
    const allSame = voteValues.every((v) => v === voteValues[0]);
    return { countByVote, avg, closest, allSame };
  };

  if (showDanielModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Not you again...</h2>
          <p className="text-lg mb-6">Get out of here Daniel...</p>
          <img
            src="https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif"
            alt="Shoo Daniel"
            className="mx-auto rounded-lg"
          />
          <button
            onClick={() => setShowDanielModal(false)}
            className="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Fine, I'll behave
          </button>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="bg-gray-100 min-h-screen flex flex-col justify-center items-center p-6">
        <h1 className="text-3xl font-bold mb-4">Welcome to Scrum Poker</h1>
        <input
          className="p-2 border rounded-md text-lg w-64 mb-4"
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="p-2 border rounded-md text-lg w-64 mb-4"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Select Role</option>
          <option value="Dev">Developer</option>
          <option value="Platform">Platform</option>
        </select>
        <button
          className="p-2 bg-gray-800 text-white rounded-md w-64 hover:bg-gray-900 transition"
          onClick={handleJoin}
          disabled={!name || !role}
        >
          Join Session
        </button>
      </div>
    );
  }

  const { countByVote, avg, closest, allSame } = voteStats();
  const devUsers = users.filter((u) => u.role.toLowerCase().includes("dev"));

  return (
    <div className="bg-gray-100 p-6 md:p-8 max-w-4xl mx-auto rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <button
          onClick={handleLogout}
          className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Leave Session
        </button>
      </div>

      {allSame && reveal && <Confetti />}

      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Scrum Poker</h1>
        <p className="text-lg text-gray-600 mb-2">
          Welcome, {name} ({role})
        </p>
      </motion.div>

      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {role === "Dev" && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {POINTS.map((point) => (
              <button
                key={point}
                onClick={() => handleVote(point)}
                className={`p-4 rounded-lg text-xl transition ${selectedVote === point
                    ? "border-4 border-orange-500"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
              >
                {point}
              </button>
            ))}
          </div>
        )}

        {role === "Platform" && (
          <>
            <button
              className="p-3 bg-gray-500 text-white rounded-lg m-2 w-80 hover:bg-gray-600 transition"
              onClick={revealVotesHandler}
            >
              {reveal ? "Hide Votes" : "Reveal Votes"}
            </button>

            <button
              className="p-3 bg-gray-500 text-white rounded-lg m-2 w-80 hover:bg-gray-600 transition"
              onClick={clearVotes}
            >
              Clear Votes
            </button>

            <button
              className="p-3 bg-gray-500 text-white rounded-lg m-2 w-80 hover:bg-gray-600 transition"
              onClick={clearUsers}
            >
              Clear Users
            </button>

            <button
              className="p-3 bg-gray-500 text-white rounded-lg m-2 w-80 hover:bg-gray-600 transition"
              onClick={cleanSession}
            >
              Clean Session
            </button>
          </>
        )}
      </motion.div>

      {showStats && (
        <motion.div
          className="bg-white p-4 rounded-lg shadow mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-lg font-semibold">📊 Voting Stats</p>
          <p>Average: {avg.toFixed(2)}</p>
          <p>Closest Option: {closest}</p>
          <p>Vote Counts:</p>
          <ul className="list-disc pl-6">
            {Object.entries(countByVote).map(([point, count]) => (
              <li key={point}>
                {point}: {count}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <motion.div
        className="space-y-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {devUsers.map((user) => (
          <div
            key={user.name}
            className="p-4 border rounded-lg bg-white text-lg font-semibold text-gray-800 shadow-md"
          >
            <div className="flex justify-between items-center">
              <span>{user.name}</span>
              <span className="text-gray-600">
                {reveal || user.name === name ? votes[user.name] : "?"}
              </span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
