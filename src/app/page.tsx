"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  CalendarRange,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sun,
  BookOpen,
  Stethoscope,
  Users,
  PartyPopper,
} from "lucide-react";
import {
  SUBJECTS,
  DAYS,
  TIME_SLOTS,
  SEMESTER,
  WEEKS,
  getWeekNumber,
  getWeekStartDate,
  getWeekDates,
  getWeekMonday,
  getWeekDays,
  getDaySchedule,
  getWeekSchedule,
  addDays,
  type SubjectKey,
  type DaySchedule,
} from "@/lib/schedule-data";

type View = "today" | "week" | "semester";

// ── Форматирование дат ──────────────────────────────────────────────
const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const WEEKDAYS_RU_FULL = [
  "Воскресенье", "Понедельник", "Вторник", "Среда",
  "Четверг", "Пятница", "Суббота",
];
const WEEKDAYS_RU_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function formatDateLong(d: Date): string {
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
}
function formatDateShort(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Карточка предмета ───────────────────────────────────────────────
function SubjectCard({
  subjectKey,
  time,
  label,
  room,
  compact,
  onClick,
}: {
  subjectKey: SubjectKey;
  time?: string;
  label?: string;
  room?: string;
  compact?: boolean;
  onClick?: () => void;
}) {
  const s = SUBJECTS[subjectKey];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl ${s.bgSoft} ring-1 ${s.ring} p-4 transition-all hover:scale-[1.01] hover:shadow-md active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`font-semibold ${compact ? "text-sm" : "text-base"} ${s.text} leading-snug`}>
              {compact ? s.short : s.name}
            </h3>
          </div>
          {label && (
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {time && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {time}
              </span>
            )}
            {room && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {room}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Шапка приложения ────────────────────────────────────────────────
function AppHeader() {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-30">
      <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold leading-tight truncate">
            Расписание
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            {SEMESTER.group} · {SEMESTER.semester} семестр
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {SEMESTER.course} курс
          </p>
          <p className="text-xs font-medium text-muted-foreground">{SEMESTER.year}</p>
        </div>
      </div>
    </header>
  );
}

// ── Экран «Сегодня» ─────────────────────────────────────────────────
function TodayView({ onSelectSubject }: { onSelectSubject: (k: SubjectKey) => void }) {
  const today = useMemo(() => new Date(), []);
  // Сдвиг дней от сегодня: 0 = сегодня, +1 = завтра, -1 = вчера
  const [offset, setOffset] = useState(0);
  const [swipeDir, setSwipeDir] = useState(0);

  const currentDate = useMemo(() => addDays(today, offset), [today, offset]);
  const schedule = useMemo(() => getDaySchedule(currentDate), [currentDate]);
  const weekNumber = schedule.weekNumber;

  const isToday = offset === 0;
  const isFuture = offset > 0;

  const relLabel = offset === 0 ? "Сегодня" : offset === 1 ? "Завтра" : offset === -1 ? "Вчера" : offset > 0 ? `Через ${offset} дн.` : `${Math.abs(offset)} дн. назад`;

  const goPrev = () => {
    setSwipeDir(-1);
    setOffset((o) => o - 1);
  };
  const goNext = () => {
    setSwipeDir(1);
    setOffset((o) => o + 1);
  };

  const noClasses =
    weekNumber < 1 || schedule.isWeekend || (!schedule.practice && schedule.lectures.length === 0);

  return (
    <div className="px-4 pt-5 pb-28 space-y-5">
      {/* Шапка дня с навигацией */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={goPrev}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors shrink-0"
          aria-label="Предыдущий день"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 text-center min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {WEEKDAYS_RU_FULL[currentDate.getDay()]}
          </p>
          <h2 className="text-2xl font-bold tracking-tight capitalize mt-0.5">
            {formatDateLong(currentDate)}
          </h2>
        </div>
        <button
          onClick={goNext}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors shrink-0"
          aria-label="Следующий день"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Бейджи: относительная дата + номер недели */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            isToday
              ? "bg-teal-500 text-white"
              : isFuture
              ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300"
              : "bg-stone-100 dark:bg-stone-800/50 text-stone-600 dark:text-stone-300"
          }`}
        >
          {isToday && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
          {relLabel}
        </span>
        {weekNumber >= 1 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 dark:bg-teal-950/40 px-3 py-1 text-xs font-medium text-teal-700 dark:text-teal-300">
            <CalendarDays className="h-3.5 w-3.5" />
            Неделя {weekNumber} из {SEMESTER.totalWeeks}
          </span>
        )}
      </div>

      {/* Подсказка о свайпе */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70">
        <ChevronLeft className="h-3 w-3" />
        <span>Свайп влево/вправо — листать дни</span>
        <ChevronRight className="h-3 w-3" />
      </div>

      {/* Контент с поддержкой свайпа */}
      <div
        className="touch-pan-y"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).dataset.startX = String(e.clientX);
        }}
        onPointerUp={(e) => {
          const el = e.currentTarget as HTMLElement;
          const startX = parseFloat(el.dataset.startX ?? "0");
          const dx = e.clientX - startX;
          if (Math.abs(dx) > 60) {
            if (dx < 0) goNext();
            else goPrev();
          }
          delete el.dataset.startX;
        }}
      >
        <AnimatePresence mode="wait" custom={swipeDir} initial={false}>
          <motion.div
            key={offset}
            custom={swipeDir}
            variants={{
              enter: (dir: number) => ({
                x: dir > 0 ? 80 : -80,
                opacity: 0,
              }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({
                x: dir > 0 ? -80 : 80,
                opacity: 0,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <DayContent
              schedule={schedule}
              onSelectSubject={onSelectSubject}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Заметки */}
      <div className="rounded-2xl bg-muted/40 p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Полезно знать
        </p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {SEMESTER.notes.map((n, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 rounded-full bg-muted-foreground/60 shrink-0" />
              {n}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Содержимое одного дня (практика + лекции) ───────────────────────
function DayContent({
  schedule,
  onSelectSubject,
}: {
  schedule: DaySchedule;
  onSelectSubject: (k: SubjectKey) => void;
}) {
  const noClasses =
    schedule.weekNumber < 1 ||
    schedule.isWeekend ||
    (!schedule.practice && schedule.lectures.length === 0);

  if (schedule.isHoliday && schedule.holidayNote) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-8 text-center">
        <PartyPopper className="mx-auto h-10 w-10 text-amber-400" />
        <p className="mt-3 font-semibold">{schedule.holidayNote}</p>
        <p className="mt-1 text-sm text-muted-foreground">Занятий нет</p>
      </div>
    );
  }

  if (noClasses) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
        <Sun className="mx-auto h-10 w-10 text-amber-400" />
        <p className="mt-3 font-semibold">Выходной день</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Занятий в этот день нет. Хорошего отдыха!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {TIME_SLOTS.map((slot) => {
        let content: React.ReactNode = null;
        if (slot.kind === "practice") {
          if (!schedule.practice) {
            content = (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                Практическое занятие не запланировано
              </div>
            );
          } else {
            content = (
              <SubjectCard
                subjectKey={schedule.practice}
                time={slot.time}
                label="Практическое занятие"
                onClick={() => onSelectSubject(schedule.practice!)}
              />
            );
          }
        } else {
          const lecture = schedule.lectures.find((l) => l.slot === slot.kind);
          if (!lecture) {
            content = (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                Лекция не запланирована
              </div>
            );
          } else {
            content = (
              <SubjectCard
                subjectKey={lecture.subject}
                time={slot.time}
                label="Лекция"
                room={lecture.room}
                onClick={() => onSelectSubject(lecture.subject)}
              />
            );
          }
        }
        return (
          <motion.div
            key={slot.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {content}
          </motion.div>
        );
      })}
      {schedule.note && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Примечание: </span>
            {schedule.note}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Экран «Неделя» ──────────────────────────────────────────────────
function WeekView({ onSelectSubject }: { onSelectSubject: (k: SubjectKey) => void }) {
  const today = useMemo(() => new Date(), []);
  const initialWeek = useMemo(() => Math.max(1, getWeekNumber(today)), [today]);
  const [week, setWeek] = useState(initialWeek);

  const weekData = useMemo(() => WEEKS.find((w) => w.week === week), [week]);
  // Используем все 6 дней недели Пн–Сб (даже если в какой-то день нет занятий)
  const weekDays = useMemo(() => getWeekDays(week), [week]);
  const monday = useMemo(() => getWeekMonday(week), [week]);

  const canPrev = week > 1;
  const canNext = week < SEMESTER.totalWeeks;

  return (
    <div className="px-4 pt-5 pb-28">
      {/* Переключатель недель */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => canPrev && setWeek((w) => w - 1)}
          disabled={!canPrev}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border disabled:opacity-30 hover:bg-muted transition-colors"
          aria-label="Предыдущая неделя"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold">Неделя {week}</p>
          <p className="text-xs text-muted-foreground">{weekData?.period ?? ""}</p>
        </div>
        <button
          onClick={() => canNext && setWeek((w) => w + 1)}
          disabled={!canNext}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border disabled:opacity-30 hover:bg-muted transition-colors"
          aria-label="Следующая неделя"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {week === initialWeek && (
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-teal-50 dark:bg-teal-950/40 px-3 py-1 text-xs font-medium text-teal-700 dark:text-teal-300">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
          Текущая неделя
        </div>
      )}

      {weekData?.note && (
        <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Примечание недели: </span>
            {weekData.note}
          </p>
        </div>
      )}

      {/* Дни недели Пн–Сб по порядку */}
      <div className="space-y-4">
        {weekDays.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Нет данных для этой недели
          </div>
        ) : (
          weekDays.map((date, idx) => {
            const schedule = getDaySchedule(date);
            const isToday = date.toDateString() === today.toDateString();
            return (
              <DayRow
                key={idx}
                date={date}
                schedule={schedule}
                isToday={isToday}
                onSelectSubject={onSelectSubject}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function DayRow({
  date,
  schedule,
  isToday,
  onSelectSubject,
}: {
  date: Date;
  schedule: DaySchedule;
  isToday: boolean;
  onSelectSubject: (k: SubjectKey) => void;
}) {
  const dayIdx = date.getDay();
  const dayName = WEEKDAYS_RU_SHORT[dayIdx];
  const dayFull = WEEKDAYS_RU_FULL[dayIdx];

  return (
    <div
      className={`rounded-2xl border p-3.5 transition-colors ${
        isToday
          ? "border-teal-300 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
              isToday
                ? "bg-teal-500 text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {dayName}
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">{dayFull}</p>
            <p className="text-[11px] text-muted-foreground">{formatDateShort(date)}</p>
          </div>
        </div>
        {isToday && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">
            Сегодня
          </span>
        )}
      </div>

      {schedule.isHoliday && schedule.holidayNote ? (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2.5">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
            {schedule.holidayNote}
          </p>
        </div>
      ) : !schedule.practice && schedule.lectures.length === 0 ? (
        <p className="text-xs text-muted-foreground italic px-1 py-2">
          Выходной
        </p>
      ) : (
        <div className="space-y-2">
          {schedule.practice && (
            <button
              onClick={() => onSelectSubject(schedule.practice!)}
              className="w-full text-left"
            >
              <MiniSubject
                subjectKey={schedule.practice}
                time="09:00"
                kind="Практика"
              />
            </button>
          )}
          {schedule.lectures.map((lec, i) => (
            <button
              key={i}
              onClick={() => onSelectSubject(lec.subject)}
              className="w-full text-left"
            >
              <MiniSubject
                subjectKey={lec.subject}
                time={lec.slot === "lecture1" ? "14:00" : "16:00"}
                kind="Лекция"
                room={lec.room}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniSubject({
  subjectKey,
  time,
  kind,
  room,
}: {
  subjectKey: SubjectKey;
  time: string;
  kind: string;
  room?: string;
}) {
  const s = SUBJECTS[subjectKey];
  return (
    <div className={`flex items-center gap-2.5 rounded-xl ${s.bgSoft} ring-1 ${s.ring} px-3 py-2`}>
      <span className={`h-2 w-2 rounded-full ${s.dot} shrink-0`} />
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold ${s.text} truncate`}>{s.short}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {kind}{room ? ` · ${room}` : ""}
        </p>
      </div>
      <span className="text-[10px] font-medium text-muted-foreground shrink-0">{time}</span>
    </div>
  );
}

// ── Экран «Семестр» ─────────────────────────────────────────────────
function SemesterView({ onSelectSubject }: { onSelectSubject: (k: SubjectKey) => void }) {
  const today = useMemo(() => new Date(), []);
  const currentWeek = useMemo(() => getWeekNumber(today), [today]);
  const [selected, setSelected] = useState<SubjectKey | null>(null);

  return (
    <div className="px-4 pt-5 pb-28">
      <div className="mb-4">
        <h2 className="text-lg font-bold">Семестр целиком</h2>
        <p className="text-sm text-muted-foreground">
          Практические занятия по неделям. Нажмите на предмет для подробностей.
        </p>
      </div>

      {/* Легенда предметов */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {Object.values(SUBJECTS).map((s) => (
          <button
            key={s.key}
            onClick={() => setSelected(s.key)}
            className={`inline-flex items-center gap-1.5 rounded-full ${s.bgSoft} ring-1 ${s.ring} px-2.5 py-1 text-[11px] font-medium ${s.text} transition-transform hover:scale-105`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.short}
          </button>
        ))}
      </div>

      {/* Сетка недель */}
      <div className="space-y-2.5">
        {WEEKS.map((weekData) => {
          const w = weekData.week;
          // Все 6 дней недели Пн–Сб по порядку
          const weekDays = getWeekDays(w);
          const monday = getWeekMonday(w);
          const isCurrent = w === currentWeek;
          return (
            <div
              key={w}
              className={`rounded-2xl border p-3 ${
                isCurrent
                  ? "border-teal-300 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/15"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 min-w-7 px-2 items-center justify-center rounded-md text-xs font-bold ${
                      isCurrent
                        ? "bg-teal-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {w}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {monday ? formatDateShort(monday) : ""}
                  </span>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-semibold uppercase text-teal-600 dark:text-teal-400">
                    Сейчас
                  </span>
                )}
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {weekDays.map((date, idx) => {
                  const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                  const subj = weekData.days[isoDate];
                  if (!subj) {
                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-1 rounded-lg bg-muted/30 py-1.5"
                      >
                        <span className="text-[9px] font-medium text-muted-foreground/70">
                          {WEEKDAYS_RU_SHORT[date.getDay()]}
                        </span>
                        <span className="text-[9px] text-muted-foreground/40">—</span>
                      </div>
                    );
                  }
                  const s = SUBJECTS[subj];
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelected(subj)}
                      title={`${WEEKDAYS_RU_FULL[date.getDay()]}: ${s.name}`}
                      className={`flex flex-col items-center gap-1 rounded-lg ${s.bgSoft} ring-1 ${s.ring} py-1.5 transition-transform hover:scale-105`}
                    >
                      <span className="text-[9px] font-medium text-muted-foreground">
                        {WEEKDAYS_RU_SHORT[date.getDay()]}
                      </span>
                      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    </button>
                  );
                })}
              </div>
              {weekData.note && (
                <p className="mt-2 text-[10px] text-amber-700 dark:text-amber-400">
                  {weekData.note}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <SubjectDetailSheet
          subjectKey={selected}
          onClose={() => setSelected(null)}
          onShowFull={() => {
            onSelectSubject(selected);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

// ── Детали предмета (нижний лист) ───────────────────────────────────
function SubjectDetailSheet({
  subjectKey,
  onClose,
  onShowFull,
}: {
  subjectKey: SubjectKey;
  onClose: () => void;
  onShowFull?: () => void;
}) {
  const s = SUBJECTS[subjectKey];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-background rounded-t-3xl sm:rounded-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto"
      >
        {/* Ручка */}
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />

        <div className="flex items-start gap-3">
          <span className={`h-3 w-3 mt-1.5 rounded-full ${s.dot}`} />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold leading-tight">{s.name}</h3>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              Аббревиатура
            </p>
            <p className="text-sm font-medium mt-0.5">{s.abbr}</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              Цвет
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${s.dot}`} />
              <span className="text-sm font-medium capitalize">{s.color}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-muted/50 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
            Время занятий
          </p>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>Практика: {SEMESTER.practiceTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Лекции: 14:00–15:40, 16:00–17:40</span>
            </div>
          </div>
        </div>

        {onShowFull && (
          <button
            onClick={onShowFull}
            className="mt-4 w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Подробнее
          </button>
        )}
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted transition-colors"
        >
          Закрыть
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Нижняя навигация ────────────────────────────────────────────────
function BottomNav({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const items: { key: View; label: string; icon: typeof Sun }[] = [
    { key: "today", label: "Сегодня", icon: Sun },
    { key: "week", label: "Неделя", icon: CalendarDays },
    { key: "semester", label: "Семестр", icon: CalendarRange },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-2xl px-2 py-1.5 grid grid-cols-3 gap-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = view === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`relative flex flex-col items-center gap-0.5 py-2 rounded-xl transition-colors ${
                active ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-teal-500"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── Корневой компонент ──────────────────────────────────────────────
export default function Home() {
  const [view, setView] = useState<View>(() => {
    if (typeof window === "undefined") return "today";
    const h = window.location.hash.replace("#", "");
    if (h === "week" || h === "semester" || h === "today") return h;
    return "today";
  });
  const [detailSubject, setDetailSubject] = useState<SubjectKey | null>(null);

  // Синхронизируем hash с выбранным разделом
  useEffect(() => {
    if (typeof window !== "undefined") window.location.hash = view;
  }, [view]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 mx-auto w-full max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            {view === "today" && <TodayView onSelectSubject={setDetailSubject} />}
            {view === "week" && <WeekView onSelectSubject={setDetailSubject} />}
            {view === "semester" && <SemesterView onSelectSubject={setDetailSubject} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {detailSubject && (
          <SubjectDetailSheet
            subjectKey={detailSubject}
            onClose={() => setDetailSubject(null)}
          />
        )}
      </AnimatePresence>

      <BottomNav view={view} onChange={setView} />
    </div>
  );
}
