import WorkspacePage from "@/app/components/room/WorkspacePage";

export const revalidate = 3600;

export default function Home() {
  return <WorkspacePage />;
}
