"use client";

import { useNavigate, useSearchParams } from "react-router-dom";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Filter, Calendar, MapPin, Search, ShieldQuestion, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/lib/i18n";

function FilterSelect({
  icon: Icon,
  value,
  onChange,
  children,
}: {
  icon: typeof Filter;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface px-3.5 py-2 text-sm hover:border-foreground/20 transition-colors">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-foreground outline-none cursor-pointer text-[13px] font-medium"
      >
        {children}
      </select>
    </div>
  );
}

export function CasesFilter({
  stations,
  crimeTypes,
}: {
  stations: { id: string; name: string; districtName?: string | null }[];
  crimeTypes: string[];
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const hasWideScope = user?.capabilities?.scopeLevel !== "STATION";

  const currentCrimeType = searchParams.get("crimeType") || "All Crimes";
  const currentStatus = searchParams.get("status") || "All Statuses";
  const currentStation = searchParams.get("stationId") || "all";
  const currentDate = searchParams.get("date") || "all";
  const hasPendingMatches = searchParams.get("hasPendingMatches") === "true";
  const currentQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(currentQuery);

  useEffect(() => setQuery(currentQuery), [currentQuery]);

  const updateFilters = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "All Crimes" || value === "All Statuses" || value === null) {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      navigate(`/cases?${params.toString()}`);
    },
    [navigate, searchParams]
  );

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    updateFilters("q", query.trim() || null);
  };

  const duplicateStationNames = new Set(
    stations
      .filter((station, index) => stations.findIndex((candidate) => candidate.name === station.name) !== index)
      .map((station) => station.name)
  );

  const statusOptions = [
    { value: "All Statuses", label: t("cases.filter.allStatuses") },
    { value: "OPEN", label: t("dossier.status.OPEN") },
    { value: "UNDER_INVESTIGATION", label: t("dossier.status.UNDER_INVESTIGATION") },
    { value: "CHARGESHEETED", label: t("dossier.status.CHARGESHEETED") },
    { value: "CLOSED", label: t("dossier.status.CLOSED") },
  ];

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={submitSearch} className="flex items-center gap-2 rounded-2xl border border-hairline bg-surface p-2 shadow-sm">
        <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
          placeholder={t("cases.filter.searchPlaceholder")}
          aria-label="Search cases"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              updateFilters("q", null);
            }}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("cases.filter.clearSearch")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button type="submit" className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-2">
          {t("cases.filter.searchButton")}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-hairline bg-surface p-3 shadow-sm">
        <FilterSelect icon={Filter} value={currentCrimeType} onChange={(v) => updateFilters("crimeType", v)}>
          <option value="All Crimes">{t("cases.filter.allCrimes")}</option>
          {crimeTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </FilterSelect>

        <FilterSelect icon={ShieldQuestion} value={currentStatus} onChange={(v) => updateFilters("status", v)}>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </FilterSelect>

        {hasWideScope && (
          <FilterSelect icon={MapPin} value={currentStation} onChange={(v) => updateFilters("stationId", v)}>
            <option value="all">{t("cases.filter.allLocations")}</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}{duplicateStationNames.has(station.name) && station.districtName ? ` · ${station.districtName}` : ""}
              </option>
            ))}
          </FilterSelect>
        )}

        <FilterSelect icon={Calendar} value={currentDate} onChange={(v) => updateFilters("date", v)}>
          <option value="all">{t("cases.filter.allTime")}</option>
          <option value="today">{t("cases.filter.today")}</option>
          <option value="week">{t("cases.filter.thisWeek")}</option>
          <option value="month">{t("cases.filter.thisMonth")}</option>
        </FilterSelect>
      </div>
      {hasPendingMatches && (
        <div className="flex items-center">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber/10 px-2.5 py-1 text-xs font-medium text-amber border border-amber/20">
            {t("cases.filter.pendingMatches")}
            <button onClick={() => updateFilters("hasPendingMatches", null)} className="ml-1 hover:text-amber/70" title={t("cases.filter.clearFilter")}>
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
