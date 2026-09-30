import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WorkspacePage from "@/app/components/room/WorkspacePage";
import { APP_METADATA, APP_SLUGS, idFromPath } from "@/app/lib/apps";
import { SITE_NAME } from "@/app/lib/constants";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(APP_SLUGS).map((app) => ({ app }));
}

export async function generateMetadata({ params }: { params: Promise<{ app: string }> }): Promise<Metadata> {
  const { app } = await params;
  const id = idFromPath(`/${app}`);
  if (!id) notFound();
  const { title, description } = APP_METADATA[id];
  return {
    title,
    description,
    alternates: { canonical: `/${app}` },
    // Child openGraph/twitter objects replace the root layout's (including the file-based
    // share images), so repeat the shared fields and point at the root image routes.
    openGraph: {
      title,
      description,
      url: `/${app}`,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/twitter-image", width: 1200, height: 630, alt: SITE_NAME }],
    },
  };
}

export default async function AppPage({ params }: { params: Promise<{ app: string }> }) {
  const { app } = await params;
  const id = idFromPath(`/${app}`);
  if (!id) notFound();
  return <WorkspacePage initialApp={id} />;
}
