export const absValue = (num) => (num ^ (num >> 31)) - (num >> 31);
export const calculatePriceStep = (range) => {
  const steps = [0.01, 0.05, 0.1, 0.5, 1, 5, 10];
  return steps.find((step) => range / step <= 10) || 20;
};

export const formatPrice = (price) => price?.toFixed(2) ?? "0.00";
export const formatVolume = (volume) => volume?.toLocaleString() ?? "0";
export const formatDate = (timestamp) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
