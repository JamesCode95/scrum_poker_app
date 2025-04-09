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
const DANIEL_NAMES = ["diddy", "diddy k", "dk", "d k", "danielk", "daniel k", "dan", "dan k", "daniel kaczorek", "kaczorek"];

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
  const [countdown, setCountdown] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [shake, setShake] = useState(false);
  const [isVotingAllowed, setIsVotingAllowed] = useState(true);
  const [showFunnyPopup, setShowFunnyPopup] = useState(false);
  const [funnyGif, setFunnyGif] = useState("");

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
        setCountdown(data.countdown || 0);
        setShowCountdown((data.countdown || 0) > 0);
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
    });

    return () => {
      unsubscribeVotes();
    };
  }, []);

  useEffect(() => {
    // only trigger shake if we previously had a selected vote and now votes are empty
    if (selectedVote !== null && Object.keys(votes).length === 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setSelectedVote(null);
      setIsVotingAllowed(false);
    }
  }, [votes]);

  useEffect(() => {
    if (countdown > 0) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          const newVal = prev - 1;
          update(votesRef, { countdown: newVal });
          return newVal;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setShowCountdown(false);
      setIsVotingAllowed(!isVotingAllowed);
    }
  }, [countdown]);

  useEffect(() => {
    if (shake) {
      const timeout = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [shake]);

  const startCountdown = (seconds = 10) => {
    setIsVotingAllowed(false);
    setShowCountdown(true);
    update(votesRef, { countdown: seconds });

    const interval = setInterval(() => {
      setCountdown((prev) => {
        const newVal = prev - 1;
        update(votesRef, { countdown: newVal });
        return newVal;
      });
    }, 1000);

    setTimeout(() => {
      setIsVotingAllowed(!isVotingAllowed);
      clearInterval(interval);
    }, seconds * 1000);
  };

  const handleVote = (point) => {
    if (name) {
      const voteValues = Object.values(votes);
  
      if (voteValues.length > 0) {
        const minVote = Math.min(...voteValues);
        const selectedVoteIndex = POINTS.indexOf(point);
        const minVoteIndex = POINTS.indexOf(minVote);

        if (selectedVoteIndex > minVoteIndex + 2) {
          setFunnyGif("https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWp1cTk5amtwdG91bTNtbTExbXU1YnZqN2tlaGVxeHFoYmliZWJzdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/pICj6JWqVpm5aapOIS/giphy.gif");  // Use a fun gif here
          setShowFunnyPopup(true);
        }
      }
  
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
      countdown: 0,
    });

    setSelectedVote(null);
    setShowStats(false);
    setIsVotingAllowed(false);
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
    set(votesRef, { votes: {}, revealVotes: false, countdown: 0 });
    setShowStats(false);
  };

  const revealVotesHandler = () => {
    const newRevealState = !reveal;
    setReveal(newRevealState);
    set(votesRef, {
      votes,
      revealVotes: newRevealState,
      countdown: 0,
    });

    setShowStats(newRevealState);
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

  if (showFunnyPopup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-100">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Are you sure about that vote?</h2>
          <img
            src={funnyGif}
            alt="Funny Gif"
            className="mx-auto rounded-lg mb-4"
          />
          <button
            onClick={() => {
              setShowFunnyPopup(false);
            }}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Yes, I'm sure!
          </button>
        </div>
      </div>
    );
  }
  
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
          <option value="CMS">CMS Developer/Tester</option>
          <option value="ECOM">Commerce Developer/Tester</option>
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
  const devUsers = users.filter((u) => u.role.toLowerCase().includes("cms"));

  return (

    <motion.div
      className="bg-gray-100 p-6 md:p-8 max-w-4xl mx-auto rounded-lg shadow-lg"
      animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
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

      {showCountdown && (
        <motion.div
          className="text-4xl font-bold text-center text-red-600 mb-4"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          Voting starts in: {countdown}s
        </motion.div>
      )}

      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {role === "ECOM" || role === "CMS" && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {POINTS.map((point) => (
              <motion.button
                key={`vote-${point}`}
                onClick={() => handleVote(point)}
                disabled={!isVotingAllowed || showCountdown}
                className={`p-4 rounded-lg text-xl transition ${selectedVote !== null && selectedVote === point
                  ? "border-4 border-orange-500"
                  : `bg-blue-500 text-white ${!isVotingAllowed || showCountdown ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"}`
                  }`}
                animate={shake && selectedVote === point ? {
                  x: [-10, 10, -10, 10, -6, 6, -3, 3, 0],
                  rotate: [-5, 5, -5, 5, -2, 2, 0],
                } : {}}
                transition={{ duration: 0.6, type: "spring", stiffness: 300 }}
              >
                {point}
              </motion.button>
            ))}
          </div>
        )}

        {role === "Platform" && (
          <>
            <button
              className="p-3 bg-gray-500 text-white rounded-lg m-2 w-80 hover:bg-gray-600 transition"
              onClick={() => startCountdown(3)}
            >
              Start Countdown to Vote
            </button>

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
            className={`p-4 border rounded-lg text-lg font-semibold text-gray-800 shadow-md 
              ${role === "Platform" && votes[user.name] ? 'bg-green-100 border-green-500' : 'bg-white border-gray-300'}`
            }
          >
            <div className="flex justify-between items-center">
              <span>{user.name}</span>
              <span className="text-gray-600">
                {reveal || user.name === name
                  ? votes[user.name] || "?"
                  : "?"}
              </span>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
