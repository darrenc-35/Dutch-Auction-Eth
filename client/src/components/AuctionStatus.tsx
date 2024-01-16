export const AuctionStatus = ({
  startTime,
  endTime,
  hasEnded = false,
}: {
  startTime: number;
  endTime: number;
  hasEnded: boolean;
}) => {
  if (hasEnded) {
    return <span className="bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Ended</span>;
  }

  const current = new Date();
  const [startDate, endDate] = [new Date(startTime * 1000), new Date(endTime * 1000)];
  if (startDate <= current && current <= endDate) {
    return <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Ongoing</span>;
  }
  return <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Processing</span>;
};
