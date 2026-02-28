import { useEffect } from 'react';

interface DataInitializerProps {
  children: React.ReactNode;
}

export default function DataInitializer({ children }: DataInitializerProps) {
  useEffect(() => {
    // Data is now seeded on the backend via Prisma
  }, []);

  return <>{children}</>;
}
