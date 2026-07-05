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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">イベント検索</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">
            イベント一覧
          </h1>
        </div>
        <input
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 md:max-w-xs"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="場所 / イベント名"
          type="search"
          value={query}
        />
      </div>

      {status === "loading" ? (
        <p className="rounded-md border border-stone-200 bg-white p-4 text-sm text-stone-600">
          イベントを読み込み中です。
        </p>
      ) : null}

      {status === "error" ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {status === "ready" && visibleEvents.length === 0 ? (
        <p className="rounded-md border border-stone-200 bg-white p-4 text-sm text-stone-600">
          表示できるイベントがありません。
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {visibleEvents.map((event) => (
          <Link
            className="rounded-md border border-stone-200 bg-white p-4 hover:border-teal-500"
            key={event.id}
            to={`/${event.id}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-stone-950">{event.title}</h2>
              <span className="rounded-md bg-rose-50 px-2 py-1 text-sm font-semibold text-rose-700">
                {event.heat}
              </span>
            </div>
            <p className="mt-2 text-sm text-stone-600">{event.address}</p>
            <p className="mt-4 text-sm text-stone-600">
              参加 {event.participants}人
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
