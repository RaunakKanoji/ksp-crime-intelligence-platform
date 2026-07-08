import FirDetailView from "@/components/fir/FirDetailView";

export default function FirDetailPage({ params }: { params: { id: string } }) {
  return <FirDetailView firId={decodeURIComponent(params.id)} />;
}
