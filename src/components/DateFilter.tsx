import { useSearchParams } from "react-router-dom";
import { dateRange } from "../lib/utils";
export function useRange() {
  const [params] = useSearchParams();
  const fallback = dateRange(7);
  return {
    from: params.get("from") ?? fallback.from,
    to: params.get("to") ?? fallback.to,
  };
}
export function DateFilter() {
  const [params, setParams] = useSearchParams();
  const range = useRange();
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next);
  }
  return (
    <div className="date-filter">
      <label>
        From
        <input
          aria-label="From date"
          type="date"
          value={range.from}
          max={range.to}
          onChange={(e) => change("from", e.target.value)}
        />
      </label>
      <label>
        To
        <input
          aria-label="To date"
          type="date"
          value={range.to}
          min={range.from}
          max={dateRange(0).to}
          onChange={(e) => change("to", e.target.value)}
        />
      </label>
    </div>
  );
}
