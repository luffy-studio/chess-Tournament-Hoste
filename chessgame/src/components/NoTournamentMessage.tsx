import { Eye } from 'lucide-react';

export function NoTournamentMessage() {
  return (
    <section className="rounded-2xl border bg-white p-12 text-center">
      <Eye className="h-16 w-16 mx-auto mb-4 text-zinc-400" />
      <h2 className="text-xl font-semibold mb-2">No Active Tournament</h2>
      <p className="text-zinc-600">Waiting for the admin to create a tournament...</p>
    </section>
  );
}
