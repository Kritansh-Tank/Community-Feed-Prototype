'use client';

import { useEffect, useState } from 'react';
import { getLeaderboard } from '@/lib/api';
import { Trophy } from 'lucide-react';

interface UserKarma {
  id: number;
  username: string;
  karma: number;
}

export function Leaderboard() {
  const [users, setUsers] = useState<UserKarma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await getLeaderboard();
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <div className="p-4 bg-gray-900 rounded-xl animate-pulse h-64"></div>;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6 text-yellow-500">
        <Trophy size={20} />
        <h2 className="font-bold text-lg uppercase tracking-wider">Top 5 (Last 24h)</h2>
      </div>
      <div className="space-y-4">
        {users.length === 0 && <p className="text-gray-500 text-sm">No activity in the last 24h.</p>}
        {users.map((user, index) => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                index === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'
              }`}>
                {index + 1}
              </span>
              <span className="text-gray-200 font-medium">{user.username}</span>
            </div>
            <div className="text-right">
              <span className="text-green-400 font-bold block">{user.karma}</span>
              <span className="text-[10px] text-gray-500 uppercase">Karma</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
