import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import markerGreen from "../../assets/studify/marker_green_large.png";
import markerPurple from "../../assets/studify/marker_purple_large.png";
import dotsBlue from "../../assets/studify/dots_blue.png";
import dotsGreen from "../../assets/studify/dots_green.png";
import dotsPurple from "../../assets/studify/dots_purple.png";
import dotsRed from "../../assets/studify/dots_red.png";
import raysPurple from "../../assets/studify/decor_rays_purple.png";
import iconArrow from "../../assets/studify/icon_arrow_up_right.png";
import iconBook from "../../assets/studify/icon_book_blue.png";
import iconCalendar from "../../assets/studify/icon_calendar_purple.png";
import iconCheck from "../../assets/studify/icon_check_purple.png";
import iconChemistry from "../../assets/studify/icon_chemistry_green.png";
import iconDeadline from "../../assets/studify/icon_deadline_red.png";
import iconEnglish from "../../assets/studify/icon_english_yellow.png";
import iconLightning from "../../assets/studify/icon_lightning_yellow.png";
import iconMath from "../../assets/studify/icon_math_purple.png";
import iconPhysics from "../../assets/studify/icon_physics_blue.png";
import iconProgress from "../../assets/studify/icon_progress_green.png";

const studyPlan = [
  { title: "Mathematics", time: "2:00 PM", done: true },
  { title: "Physics", time: "4:00 PM", done: true },
  { title: "Chemistry", time: "6:00 PM", done: true },
  { title: "English", time: "8:00 PM", done: false },
];

const deadlines = [
  { title: "Math Assignment", date: "May 18", color: "bg-[#ff375f]", text: "text-[#ff375f]" },
  { title: "Physics Lab Report", date: "May 20", color: "bg-[#ff8a00]", text: "text-[#ff6b00]" },
  { title: "Chemistry Quiz", date: "May 22", color: "bg-[#f3b700]", text: "text-[#f59e0b]" },
  { title: "English Essay", date: "May 25", color: "bg-[#34b263]", text: "text-[#179343]" },
];

const subjects = [
  {
    title: "Mathematics",
    icon: iconMath,
    className: "bg-[#eee4fb]",
  },
  {
    title: "Physics",
    icon: iconPhysics,
    className: "bg-[#e3f1ff]",
  },
  {
    title: "Chemistry",
    icon: iconChemistry,
    className: "bg-[#e6f4df]",
  },
  {
    title: "English",
    icon: iconEnglish,
    className: "bg-[#fff1cf]",
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <main className="overflow-hidden">
        <section className="mx-auto grid min-h-[720px] w-full max-w-[1600px] gap-12 px-5 py-10 sm:px-10 lg:grid-cols-[420px_minmax(720px,1fr)] lg:items-center lg:gap-x-28 lg:px-10 lg:py-[60px] min-[1400px]:grid-cols-[420px_760px] min-[1400px]:justify-between min-[1400px]:gap-x-0 min-[1400px]:px-10">
          <div className="relative z-10 w-full max-w-[350px] sm:max-w-full lg:max-w-[520px]">
            <h1 className="text-[clamp(3.35rem,14vw,5.5rem)] font-black leading-[0.96]">
              <span className="block">Study</span>
              <span className="relative -ml-2 block w-fit px-3 py-1">
                <img
                  src={markerPurple}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-x-0 top-1/2 -z-10 h-[0.9em] w-full -translate-y-1/2"
                />
                smarter.
              </span>
              <span className="block">Get</span>
              <span className="relative -ml-2 block w-fit px-3 py-1">
                <img
                  src={markerGreen}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-x-0 top-1/2 -z-10 h-[0.9em] w-full -translate-y-1/2"
                />
                ahead.
              </span>
            </h1>

            <p className="mt-8 max-w-[340px] text-xl leading-[1.45] text-[#4b5566] sm:max-w-[390px] sm:text-[22px]">
              Plan your study, organize your notes, and track your progress - all in one place.
            </p>

            <div className="mt-9 flex">
              <Link
                to="/dashboard"
                className="inline-flex h-16 w-full items-center justify-center gap-5 rounded-[8px] bg-[#6f2bd9] px-7 text-lg font-bold whitespace-nowrap text-white shadow-[0_12px_24px_rgba(111,43,217,0.22)] transition hover:bg-[#5c20bd] sm:w-auto"
              >
                Get Started Free
                <img src={iconArrow} alt="" aria-hidden="true" className="size-7" />
              </Link>
            </div>
          </div>

          <div className="relative min-h-[590px] min-w-0 max-w-[350px] sm:max-w-none lg:min-h-[640px] min-[1400px]:w-[760px] min-[1400px]:justify-self-end">
            <img
              src={raysPurple}
              alt=""
              aria-hidden="true"
              className="absolute left-[6%] top-[-18px] hidden w-[84px] lg:block"
            />
            <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(350px,1fr)_minmax(350px,1fr)] xl:gap-7">
              <HeroCardShell dots={dotsPurple} dotsSide="left">
                <StudyPlanCard />
              </HeroCardShell>
              <HeroCardShell dots={dotsRed} dotsSide="right">
                <DeadlinesCard />
              </HeroCardShell>
              <HeroCardShell dots={dotsGreen} dotsSide="left">
                <ProgressCard />
              </HeroCardShell>
              <HeroCardShell dots={dotsBlue} dotsSide="right">
                <SubjectsCard />
              </HeroCardShell>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto mb-10 grid w-[calc(100%-40px)] max-w-[1280px] gap-8 rounded-[8px] bg-[#fbf7fd] px-7 py-8 shadow-[0_20px_60px_rgba(96,60,120,0.08)] sm:grid-cols-2 sm:px-12 lg:grid-cols-[1fr_1px_1fr] lg:px-[140px]"
        >
          <FeatureItem
            icon={iconCheck}
            title="Stay Organized"
            text="Keep all your study materials in one place."
            accent="bg-[#6f2bd9]"
          />
          <div className="hidden bg-[#d9d2df] lg:block" />
          <FeatureItem
            icon={iconLightning}
            title="Built for Students"
            text="Tools designed to fit your study routine."
            accent="bg-[#f3b700]"
          />
        </section>
      </main>
    </div>
  );
}

function HeroCardShell({
  children,
  dots,
  dotsSide,
}: {
  children: ReactNode;
  dots: string;
  dotsSide: "left" | "right";
}) {
  const dotsPosition = dotsSide === "left" ? "left-[-34px] top-[34%]" : "right-[-34px] top-[56%]";

  return (
    <div className="relative min-w-0">
      <img
        src={dots}
        alt=""
        aria-hidden="true"
        className={`absolute ${dotsPosition} z-0 hidden w-[112px] -translate-y-1/2 opacity-80 lg:block`}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function StudyPlanCard() {
  return (
    <article className="min-w-0 rounded-[8px] border-2 border-[#7432de] bg-white p-6 shadow-[0_22px_50px_rgba(21,18,30,0.08)]">
      <CardTitle icon={iconCalendar} title="Study Plan" />
      <div className="mt-6 grid gap-3">
        {studyPlan.map((item) => (
          <div
            key={item.title}
            className="flex h-[60px] items-center gap-4 rounded-[8px] bg-[#fbfbfc] px-3 shadow-[0_9px_20px_rgba(15,23,42,0.04)]"
          >
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                item.done ? "bg-[#7330d5] text-white" : "border-2 border-[#8c96a5]"
              }`}
            >
              {item.done ? <span className="text-lg leading-none">✓</span> : null}
            </span>
            <span>
              <span className="block text-base font-bold">{item.title}</span>
              <span className="block text-sm font-medium text-[#4b5566]">{item.time}</span>
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function DeadlinesCard() {
  return (
    <article className="min-w-0 rounded-[8px] border-2 border-[#ff3658] bg-white p-6 shadow-[0_22px_50px_rgba(21,18,30,0.08)]">
      <CardTitle icon={iconDeadline} title="Deadlines" />
      <div className="mt-6 grid gap-3">
        {deadlines.map((item) => (
          <div
            key={item.title}
            className="flex h-[54px] items-center justify-between rounded-[8px] bg-[#fff8f7] px-4"
          >
            <span className="flex min-w-0 items-center gap-4">
              <span className={`size-2.5 shrink-0 rounded-full ${item.color}`} />
              <span className="truncate text-base font-semibold">{item.title}</span>
            </span>
            <span className={`ml-4 shrink-0 text-base font-semibold ${item.text}`}>
              {item.date}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function ProgressCard() {
  return (
    <article className="min-w-0 rounded-[8px] border-2 border-[#2aad4b] bg-white p-6 shadow-[0_22px_50px_rgba(21,18,30,0.08)]">
      <CardTitle icon={iconProgress} title="Progress" />
      <div className="mt-5 flex items-center gap-2 text-sm font-semibold">
        This Week <span className="text-lg leading-none text-[#4b5566]">⌄</span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="relative size-[128px] rounded-full bg-[conic-gradient(#2fa640_0_78%,#e4f3e4_78%_100%)] p-3">
          <div className="flex size-full items-center justify-center rounded-full bg-white text-3xl font-black">
            78%
          </div>
        </div>

        <dl className="grid gap-4 text-base">
          <div>
            <dt className="font-medium text-[#697386]">Goal</dt>
            <dd className="text-lg font-black">20h</dd>
          </div>
          <div>
            <dt className="font-medium text-[#697386]">Studied</dt>
            <dd className="text-lg font-black">15.6h</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function SubjectsCard() {
  return (
    <article className="min-w-0 rounded-[8px] border-2 border-[#228af2] bg-white p-6 shadow-[0_22px_50px_rgba(21,18,30,0.08)]">
      <CardTitle icon={iconBook} title="Subjects" />
      <div className="mt-5 grid grid-cols-2 gap-4">
        {subjects.map((subject) => (
          <div
            key={subject.title}
            className={`flex h-[54px] items-center gap-3 rounded-[8px] px-4 ${subject.className}`}
          >
            <img src={subject.icon} alt="" aria-hidden="true" className="size-8 shrink-0" />
            <span className="truncate text-sm font-semibold">{subject.title}</span>
          </div>
        ))}
      </div>

      <button className="mt-5 flex h-[48px] w-full items-center justify-center gap-3 rounded-[8px] border-2 border-dashed border-[#b8bdc8] bg-white text-base font-semibold">
        <span className="text-xl leading-none">+</span>
        Add Subject
      </button>
    </article>
  );
}

function CardTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <img src={icon} alt="" aria-hidden="true" className="size-9 shrink-0" />
      <h2 className="text-lg font-black">{title}</h2>
    </div>
  );
}

function FeatureItem({
  accent,
  icon,
  text,
  title,
}: {
  accent: string;
  icon: string;
  text: string;
  title: string;
}) {
  return (
    <article className="flex items-center gap-7">
      <img src={icon} alt="" aria-hidden="true" className="size-[68px] shrink-0" />
      <div>
        <h2 className="text-lg font-black">{title}</h2>
        <p className="mt-2 max-w-[260px] text-base leading-[1.45]">{text}</p>
        <span className={`mt-3 block h-[2px] w-[90px] ${accent}`} />
      </div>
    </article>
  );
}
