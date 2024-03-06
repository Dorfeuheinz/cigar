// Timer.js
import React, { useState, useEffect } from "react";

const Timer = () => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  function toggle() {
    setIsActive(!isActive);
  }

  function reset() {
    setSeconds(0);
    setIsActive(false);
    setRetryCount(0);
  }

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1);
        setRetryCount((prevCount) => prevCount + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
      if (retryCount >= 10) {
        // No valid response received, switch back to Off state
        setIsActive(false);
        setRetryCount(0);
      }
    }

    return () => clearInterval(interval);
  }, [isActive, seconds, retryCount]);

  return (
    <div>
      <div>{seconds}s</div>
      <div>
        <button
          className={`-${isActive ? "active" : "inactive"}`}
          onClick={toggle}
        >
          {isActive ? "Pause" : "Start"}
        </button>
        <button className="button" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
};

export default Timer;
