import React from "react";

export const TimeBadge: React.FC<{ hours: string; minutes: string; seconds: string; hasEnded?: boolean }> = ({
  hours,
  minutes,
  seconds,
  hasEnded = false,
}) => {
  if (hasEnded) {
    return <div className="bg-red-100 text-red-800 px-1 rounded text-center text-sm">Ended</div>;
  } else if (hours === "0" && minutes === "0" && seconds === "0") {
    return <div className="bg-blue-100 text-blue-800 px-1 rounded text-center text-sm">Processing</div>;
  }
  return (
    <div className="bg-blue-100 text-blue-800 px-1 rounded text-sm text-center">
      <p>
        {hours}:{minutes.length >= 2 ? minutes : "0" + minutes}:{seconds.length >= 2 ? seconds : "0" + seconds}
      </p>
    </div>
  );
};
