export const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 sm:py-8 lg:max-w-7xl lg:px-8">{children}</div>
    </div>
  );
};
