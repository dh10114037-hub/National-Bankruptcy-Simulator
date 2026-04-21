import type { SpecNotif } from '../../types/speculator';

interface Props {
  notifications: SpecNotif[];
  onDismiss: (id: string) => void;
}

const NOTIF_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  profit:               { border: 'border-emerald-300', bg: 'bg-white',       icon: '💰' },
  loss:                 { border: 'border-red-300',     bg: 'bg-red-50',      icon: '📉' },
  liquidation:          { border: 'border-red-400',     bg: 'bg-red-50',      icon: '⚠' },
  manipulation_success: { border: 'border-amber-300',   bg: 'bg-amber-50',    icon: '✔' },
  manipulation_fail:    { border: 'border-gray-300',    bg: 'bg-white',       icon: '✘' },
  intel:                { border: 'border-blue-300',    bg: 'bg-blue-50',     icon: '🕵️' },
};

export function SpecNotifications({ notifications, onDismiss }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-[340px]">
      {notifications.slice(0, 5).map((n) => {
        const style = NOTIF_STYLES[n.type] ?? NOTIF_STYLES.intel;
        return (
          <div
            key={n.id}
            className={`relative px-4 py-3 rounded-xl border shadow-lg ${style.border} ${style.bg} animate-slide-in-right`}
          >
            <div className="flex items-start gap-3">
              <span className="text-base shrink-0">{style.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium leading-snug ${
                  n.type === 'profit' ? 'text-emerald-700' :
                  n.type === 'liquidation' ? 'text-red-600' :
                  'text-gray-700'
                }`}>
                  {n.message}
                </p>
                {n.amount !== undefined && (
                  <p className={`font-mono font-bold mt-0.5 text-base ${n.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {n.amount >= 0 ? '+' : ''}${Math.abs(n.amount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </p>
                )}
              </div>
              <button
                onClick={() => onDismiss(n.id)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0"
              >×</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
