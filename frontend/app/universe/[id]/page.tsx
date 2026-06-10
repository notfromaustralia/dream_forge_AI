import { redirect } from "next/navigation";

export default async function UniverseIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/universe/${id}/overview`);
}
