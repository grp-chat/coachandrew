(function () {
  "use strict";

  function initScoreboard() {
    const $ = id => document.getElementById(id);

    // Check that the existing HTML elements are available.
    const requiredIds = [
      "redScore", "blueScore", "redBar", "blueBar",
      "redCard", "blueCard", "redStatus", "blueStatus",
      "redName", "blueName", "leader", "difference",
      "timer", "startTimer", "resetTimer",
      "redInput", "blueInput", "roundInput",
      "applySettings", "finishMatch", "closeAnnouncement",
      "announcement", "winnerName", "resetMatch",
      "nextRound", "fullscreen", "arena", "particles"
    ];

    const missing = requiredIds.filter(id => !$(id));

    if (missing.length) {
      console.error("Scoreboard HTML elements missing:", missing);
      return;
    }

    const state = {
      red: 0,
      blue: 0,
      round: 1,
      running: false,
      startedAt: 0,
      elapsedBeforeStart: 0,
      timerId: null
    };

    // SCORE FRAME HIGHLIGHT TIMERS
    const highlightTimers = {};
    const originalFrameStyles = {};


function highlightScoreFrame(team) {
  const frame = document.querySelector(
    "#" + team + "Card .score-frame"
  );

  if (!frame) return;

  clearTimeout(highlightTimers[team]);

  frame.classList.remove("highlight-active");
  void frame.offsetWidth;
  frame.classList.add("highlight-active");

  highlightTimers[team] = setTimeout(function () {
    frame.classList.remove("highlight-active");
    delete highlightTimers[team];
  }, 6000);
}

    function formatScore(number) {
      return String(number);
    }

    // UPDATE SCORES AND LEADERBOARD
    function renderScores(changedTeam) {
      $("redScore").textContent = formatScore(state.red);
      $("blueScore").textContent = formatScore(state.blue);

      ["red", "blue"].forEach(team => {
        const score = $(team + "Score");

        if (team === changedTeam) {
          score.classList.remove("pop");
          void score.offsetWidth;
          score.classList.add("pop");
        }
      });

      const total = state.red + state.blue;
      const redPercent = total > 0
        ? state.red / total * 100
        : 50;

      $("redBar").style.width = redPercent + "%";
      $("blueBar").style.width = (100 - redPercent) + "%";

      $("redCard").classList.toggle(
        "leader-card", state.red > state.blue
      );

      $("blueCard").classList.toggle(
        "leader-card", state.blue > state.red
      );

      $("redStatus").textContent =
        state.red > state.blue ? "IN THE LEAD" :
        state.red < state.blue ? "CHASING" :
        "READY TO STACK";

      $("blueStatus").textContent =
        state.blue > state.red ? "IN THE LEAD" :
        state.blue < state.red ? "CHASING" :
        "READY TO STACK";

      if (state.red === state.blue) {
        $("leader").textContent = "IT'S A TIE!";
        $("difference").textContent =
          "Both teams are neck and neck";
        $("leader").style.color = "#ffcf55";
      } else {
        const team = state.red > state.blue ? "red" : "blue";
        const gap = Math.abs(state.red - state.blue);

        $("leader").textContent =
          $(team + "Name").textContent;

        $("difference").textContent =
          gap + " point" + (gap === 1 ? "" : "s") + " ahead";

        $("leader").style.color =
          team === "red" ? "#ff5267" : "#39aaff";
      }
    }

    // SCORE BUTTONS
    function addPoints(team, delta) {
      if (team !== "red" && team !== "blue") return;

      const previousScore = state[team];

      state[team] = Math.max(0, state[team] + delta);

      renderScores(team);

      // Highlight only when the team's score actually increases.
      if (state[team] > previousScore) {
        highlightScoreFrame(team);
      }
    }

    document.querySelectorAll("[data-team]").forEach(button => {
      button.addEventListener("click", function () {
        addPoints(
          button.dataset.team,
          Number(button.dataset.delta)
        );
      });
    });

    // MATCH CLOCK
    function getElapsed() {
      return state.elapsedBeforeStart +
        (state.running
          ? performance.now() - state.startedAt
          : 0);
    }

    function renderTimer() {
      const seconds = Math.floor(getElapsed() / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainder = seconds % 60;

      $("timer").textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(remainder).padStart(2, "0");
    }

    function startTimer() {
      if (state.running) {
        state.elapsedBeforeStart = getElapsed();
        state.running = false;

        clearInterval(state.timerId);
        state.timerId = null;

        $("startTimer").textContent = "▶ RESUME";
        $("timer").classList.remove("running");

        renderTimer();
        return;
      }

      state.startedAt = performance.now();
      state.running = true;

      $("startTimer").textContent = "Ⅱ PAUSE";
      $("timer").classList.add("running");

      state.timerId = setInterval(renderTimer, 200);
    }

    function resetTimer() {
      state.running = false;

      clearInterval(state.timerId);
      state.timerId = null;

      state.startedAt = 0;
      state.elapsedBeforeStart = 0;

      $("startTimer").textContent = "▶ START";
      $("timer").classList.remove("running");

      renderTimer();
    }

    $("startTimer").addEventListener("click", startTimer);
    $("resetTimer").addEventListener("click", resetTimer);

    // TEAM NAMES AND ROUND
    function applySettings() {
      $("redName").textContent =
        ($("redInput").value.trim() || "RED TEAM").toUpperCase();

      $("blueName").textContent =
        ($("blueInput").value.trim() || "BLUE TEAM").toUpperCase();

      state.round = Math.max(
        1,
        Math.min(99, Number($("roundInput").value) || 1)
      );

      $("roundInput").value = state.round;

      renderScores();
    }

    $("applySettings").addEventListener("click", applySettings);

    // WINNER ANNOUNCEMENT
    function declareWinner() {
      let winner;
      let winnerColor;

      if (state.red === state.blue) {
        winner = "IT'S A DRAW!";
        winnerColor = "#ffcf55";
      } else if (state.red > state.blue) {
        winner = $("redName").textContent;
        winnerColor = "#ff5267";
      } else {
        winner = $("blueName").textContent;
        winnerColor = "#39aaff";
      }

      $("winnerName").textContent = winner;
      $("winnerName").style.color = winnerColor;

      $("announcement").classList.add("show");
    }

    function closeAnnouncement() {
      $("announcement").classList.remove("show");
    }

    $("finishMatch").addEventListener("click", declareWinner);

    $("closeAnnouncement").addEventListener(
      "click", closeAnnouncement
    );

    // RESET ALL SCORES
    $("resetMatch").addEventListener("click", function () {
      if (!confirm("Reset both scores and return to Round 1?")) {
        return;
      }

      state.red = 0;
      state.blue = 0;
      state.round = 1;

      $("roundInput").value = 1;

      closeAnnouncement();
      resetTimer();
      applySettings();
      renderScores();
    });

    // NEXT ROUND
    $("nextRound").addEventListener("click", function () {
      state.round = Math.min(99, state.round + 1);
      $("roundInput").value = state.round;

      closeAnnouncement();
      applySettings();
    });

    // FULLSCREEN
    $("fullscreen").addEventListener("click", async function () {
      try {
        if (!document.fullscreenElement) {
          await $("arena").requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (error) {
        alert("Please use your browser's full-screen button.");
      }
    });

    // KEYBOARD SHORTCUTS
    document.addEventListener("keydown", function (event) {
      if (event.repeat) return;

      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          event.target.tagName
        )
      ) return;

      if (event.code === "Space") {
        event.preventDefault();
        startTimer();
      }

      if (event.key.toLowerCase() === "a") {
        addPoints("red", 1);
      }

      if (event.key.toLowerCase() === "l") {
        addPoints("blue", 1);
      }

      if (event.key.toLowerCase() === "f") {
        $("fullscreen").click();
      }

      if (event.key === "Escape") {
        closeAnnouncement();
      }
    });

    // FLOATING NEON PARTICLES
    const particles = $("particles");

    for (let i = 0; i < 45; i++) {
      const particle = document.createElement("span");

      particle.className = "particle";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.top = (40 + Math.random() * 60) + "%";

      particle.style.setProperty(
        "--duration",
        (4 + Math.random() * 8) + "s"
      );

      particle.style.setProperty(
        "--delay",
        (-Math.random() * 10) + "s"
      );

      particle.style.background =
        Math.random() > 0.5 ? "#ff405b" : "#28aaff";

      particles.appendChild(particle);
    }

    // INITIAL DISPLAY
    renderScores();
    renderTimer();

    console.log("Stacking League scoreboard initialized.");
  }

  // Wait until HTML elements exist.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScoreboard);
  } else {
    initScoreboard();
  }
})();