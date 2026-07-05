import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { fetchEvents } from "../lib/eventApi";

export function EventSearchPage() {
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadEvents = async () => {
      setStatus("loading");
      setError("");

      try {
        const nextEvents = await fetchEvents({}, { signal: controller.signal });
        setEvents(nextEvents);
        setStatus("ready");
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(loadError.message);
        setStatus("error");
      }
    };

    loadEvents();

    return () => {
      controller.abort();
    };
  }, []);

  const visibleEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return events;
    }

    return events.filter((event) =>
      [event.title, event.address].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [events, query]);

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 10px 30px rgba(99, 102, 241, 0.15);
          }
          50% {
            box-shadow: 0 20px 50px rgba(99, 102, 241, 0.3);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.6s ease-out forwards;
        }

        .event-card {
          animation: fadeInUp 0.6s ease-out backwards;
        }

        .event-card:nth-child(1) { animation-delay: 0.1s; }
        .event-card:nth-child(2) { animation-delay: 0.2s; }
        .event-card:nth-child(3) { animation-delay: 0.3s; }
        .event-card:nth-child(4) { animation-delay: 0.4s; }
        .event-card:nth-child(5) { animation-delay: 0.5s; }
        .event-card:nth-child(6) { animation-delay: 0.6s; }
        .event-card:nth-child(7) { animation-delay: 0.7s; }
        .event-card:nth-child(8) { animation-delay: 0.8s; }
        .event-card:nth-child(9) { animation-delay: 0.9s; }

        .event-card:hover {
          animation: pulse-glow 2s ease-in-out infinite !important;
          transform: translateY(-12px) scale(1.02);
        }

        .arrow-icon {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .event-card:hover .arrow-icon {
          transform: translateX(8px) rotate(20deg);
        }

        .heat-badge {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .event-card:hover .heat-badge {
          transform: scale(1.1) rotate(-5deg);
        }
      `}</style>

      <div className="space-y-6">
        {/* ヘッダーセクション */}
        <section className="rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-8 text-white shadow-lg animate-fade-in-up">
          <p className="text-base font-semibold uppercase tracking-widest opacity-90">イベント検索</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h1 className="text-5xl font-black tracking-tight">イベント一覧</h1>
            <input
              className="w-full rounded-2xl border-0 bg-white/20 px-4 py-3 text-white placeholder-white/60 outline-none focus:bg-white/30 transition-all duration-300 md:max-w-xs hover:bg-white/25"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="🔍 場所 / イベント名"
              type="search"
              value={query}
            />
          </div>
        </section>

        {/* ローディング状態 */}
        {status === "loading" && (
          <p className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-700">
            イベントを読み込み中です。
          </p>
        )}

        {/* エラー状態 */}
        {status === "error" && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </p>
        )}

        {/* 検索結果なし */}
        {status === "ready" && visibleEvents.length === 0 && (
          <p className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-700">
            表示できるイベントがありません。
          </p>
        )}

        {/* イベントカードグリッド */}
        <div className="grid gap-5 md:grid-cols-3">
          {visibleEvents.map((event) => (
            <Link
              className="event-card group relative overflow-hidden rounded-3xl transition-all duration-300 cursor-pointer"
              key={event.id}
              to={`/${event.id}`}
            >
              {/* 背景グラデーション */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-300"></div>
              <div className="absolute inset-0 border border-indigo-200 rounded-3xl group-hover:border-indigo-400 transition-all duration-300"></div>
              <div className="absolute inset-0 shadow-md group-hover:shadow-2xl rounded-3xl transition-all duration-300"></div>
              
              {/* コンテンツ */}
              <div className="relative p-5 z-10">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="flex-1 text-2xl font-black text-indigo-900 group-hover:text-teal-600 transition-colors duration-300">{event.title}</h2>
                  <span className="heat-badge inline-block rounded-full bg-gradient-to-br from-rose-400 to-rose-500 px-4 py-2 text-base font-bold text-white whitespace-nowrap">
                    {event.heat}℃
                  </span>
                </div>
                
                <p className="text-base text-indigo-700 mb-4 group-hover:text-indigo-800 transition-colors">{event.address}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-indigo-200">
                  <span className="text-base font-bold text-indigo-600">👥 {event.participants}人</span>
                  <span className="arrow-icon text-teal-600 font-bold text-lg">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
}
