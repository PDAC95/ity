import dynamic from 'next/dynamic';

const LandingPage = dynamic(
  () => import('@/components/landing/vixan/LandingPage'),
  { ssr: false }
);

export default function Home() {
  return <LandingPage />;
}
