export default function ArtistPage({ params }: { params: { id: string } }) {
  return <div>Artist Page for ID: {params.id}</div>;
}
