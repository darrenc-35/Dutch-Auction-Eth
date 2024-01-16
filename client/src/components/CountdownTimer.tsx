import { useEffect, useState } from "react";
import { calculateTimeLeft } from "../utils/utils";
import { TimeBadge } from "./TimeBadge";

export const CountdownTimer: React.FC<{ targetDate: number; hasEnded?: boolean }> = ({
  targetDate,
  hasEnded = false,
}) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(async () => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return <TimeBadge hasEnded={hasEnded} hours={timeLeft.hours} minutes={timeLeft.minutes} seconds={timeLeft.seconds} />;
};
