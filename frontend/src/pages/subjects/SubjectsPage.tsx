import { type FormEvent } from "react";
import { getTasks } from "../../features/tasks/api/tasks-api.ts";
import { type Subject } from "../../entities/subject/types.ts";
import {
  type SubjectDraft,
  type SubjectFormErrors,
  type SubjectFormState,
  useSubjectsPage,
} from "../../features/subjects/model/useSubjectsPage.ts";
import { dateToDateInputValue, formatOptionalDate } from "../../shared/lib/dateFormat.ts";
import { MetricCard } from "../../shared/ui/MetricCard.tsx";
import { Sidebar } from "../../shared/ui/navigation/Sidebar.tsx";
import { subjectAssets, subjectSidebarItems } from "./subjects.assets.ts";

const {
  avatarLogan,
  chevronDown,
  dotsBlue,
  dotsGreen,
  dotsPurple,
  formStrip,
  heroSubjects,
  iconDeadline,
  iconExam,
  iconFlask,
  iconLecturer,
  iconSparkle,
  iconSubjects,
  iconTasks,
  markerPurple,
  raysPurple,
  subjectHeaderAccent,
  tinyExam,
  tinyLecturer,
  tinyName,
} = subjectAssets;

const inputClassName =
  "h-12 w-full rounded-[8px] border border-[#cfd7e4] bg-white px-4 text-base text-[#1a2740] shadow-[0_6px_18px_rgba(23,37,61,0.06)] outline-none transition placeholder:text-[#72809a] focus:border-[#6f2bd9] focus:ring-4 focus:ring-[#efe7ff] disabled:cursor-not-allowed disabled:bg-slate-100";

function formatCount(value: number | undefined) {
  return String(value ?? 0);
}

export function SubjectsPage() {
  const {
    createErrors,
    createForm,
    createSubjectMutation,
    createTouched,
    handleCreateSubject,
    handleUpdateSubject,
    hasSubmittedCreate,
    nextDeadlineTask,
    openTasks,
    pendingSubjectId,
    setCreateForm,
    setCreateTouched,
    subjectDrafts,
    subjectUpdateErrors,
    subjectUpdateSuccesses,
    subjects,
    subjectsQuery,
    tasks,
    updateSubjectDraft,
  } = useSubjectsPage();

  return (
    <div className="min-h-screen bg-white text-[#08111f]">
      <div className="mx-auto grid min-h-[calc(100vh-92px)] w-full max-w-[1584px] lg:grid-cols-[250px_1fr]">
        <Sidebar items={subjectSidebarItems} avatar={avatarLogan} chevron={chevronDown} />

        <main className="relative mx-auto w-full max-w-[350px] overflow-hidden px-5 py-8 sm:max-w-none sm:px-8 lg:px-8 lg:py-12">
          <section className="relative grid gap-8 xl:grid-cols-[minmax(0,660px)_520px] xl:items-center xl:justify-between">
            <div className="relative">
              <img
                src={raysPurple}
                alt=""
                aria-hidden="true"
                className="absolute left-[-44px] top-4 hidden w-[58px] lg:block"
              />
              <h1 className="max-w-[540px] text-[clamp(3rem,13vw,4.3rem)] font-black leading-[1.03] tracking-[-0.01em]">
                <span className="block">Organize work</span>
                <span className="block">
                  by{" "}
                  <span className="relative inline-block px-3">
                    <img
                      src={markerPurple}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-x-0 top-1/2 -z-0 h-[0.75em] w-full -translate-y-1/2"
                    />
                    <span className="relative z-10">subject.</span>
                  </span>
                </span>
              </h1>

              <p className="mt-6 max-w-[330px] text-lg leading-[1.55] text-[#43516a] sm:max-w-[470px] sm:text-xl">
                Subjects are the structure behind every task, deadline, and future study analytics
                view.
              </p>
            </div>

            <div className="relative hidden min-h-[210px] xl:block">
              <img
                src={dotsPurple}
                alt=""
                aria-hidden="true"
                className="absolute left-[-110px] top-6 w-[72px] opacity-75"
              />
              <img src={heroSubjects} alt="" className="ml-auto w-[470px]" />
            </div>
          </section>

          {subjectsQuery.error ? (
            <p className="mt-8 rounded-[8px] border border-[#ffb3c4] bg-[#fff3f6] px-5 py-4 text-sm font-semibold text-[#c21646]">
              Failed to load subjects: {subjectsQuery.error.message}
            </p>
          ) : null}

          <section className="mt-10 grid gap-7 lg:grid-cols-3">
            <MetricCard
              title="Subjects"
              value={formatCount(subjects.length)}
              caption="Loaded from backend"
              icon={iconSubjects}
              border="border-[#9a64ff]"
            />
            <MetricCard
              title="Open tasks"
              value={formatCount(openTasks.length)}
              caption="Across all subjects"
              icon={iconTasks}
              border="border-[#5b96ff]"
            />
            <MetricCard
              title="Next deadline"
              value={formatOptionalDate(nextDeadlineTask?.deadline ?? "", "-")}
              caption={nextDeadlineTask?.name ?? "No dated tasks yet"}
              icon={iconDeadline}
              border="border-[#f6b940]"
            />
          </section>

          <section className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(430px,0.95fr)]">
            <SubjectsOverview
              subjects={subjects}
              tasks={tasks}
              isLoading={subjectsQuery.isLoading}
              subjectDrafts={subjectDrafts}
              subjectUpdateErrors={subjectUpdateErrors}
              subjectUpdateSuccesses={subjectUpdateSuccesses}
              pendingSubjectId={pendingSubjectId}
              onUpdateDraft={updateSubjectDraft}
              onUpdateSubject={handleUpdateSubject}
            />

            <CreateSubjectPanel
              form={createForm}
              errors={createErrors}
              touched={createTouched}
              hasSubmitted={hasSubmittedCreate}
              submitError={createSubjectMutation.error}
              isSubmitting={createSubjectMutation.isPending}
              onSubmit={handleCreateSubject}
              onChange={(field, value) =>
                setCreateForm((current) => ({ ...current, [field]: value }))
              }
              onTouch={(field) => setCreateTouched((current) => ({ ...current, [field]: true }))}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

function SubjectsOverview({
  isLoading,
  onUpdateDraft,
  onUpdateSubject,
  pendingSubjectId,
  subjectDrafts,
  subjectUpdateErrors,
  subjectUpdateSuccesses,
  subjects,
  tasks,
}: {
  isLoading: boolean;
  onUpdateDraft: (id: number, field: keyof SubjectDraft, value: string) => void;
  onUpdateSubject: (
    event: FormEvent<HTMLFormElement>,
    id: number,
    currentSubject: SubjectFormState,
  ) => Promise<void>;
  pendingSubjectId: number | null;
  subjectDrafts: Record<number, SubjectDraft>;
  subjectUpdateErrors: Record<number, string>;
  subjectUpdateSuccesses: Record<number, string>;
  subjects: Subject[];
  tasks: ReturnType<typeof getTasks> extends Promise<infer Result> ? Result : never;
}) {
  return (
    <section className="relative overflow-hidden rounded-[12px] border border-[#d7dfea] bg-white p-6 shadow-[0_18px_50px_rgba(28,40,65,0.04)]">
      <img
        src={dotsPurple}
        alt=""
        aria-hidden="true"
        className="absolute left-[-70px] top-[200px] hidden w-[74px] opacity-65 xl:block"
      />
      <p className="text-sm font-black uppercase tracking-wide text-[#6f2bd9]">Subject overview</p>
      <h2 className="mt-3 text-2xl font-black">Current subjects</h2>
      <p className="mt-2 max-w-[560px] text-base leading-7 text-[#1a2740]">
        Subjects loaded from the backend and matched to task counts on the frontend.
      </p>

      {isLoading ? <p className="mt-6 text-base text-[#43516a]">Loading subjects...</p> : null}

      {!isLoading && subjects.length === 0 ? (
        <p className="mt-6 rounded-[8px] bg-[#f6f8fc] px-4 py-3 text-base font-semibold text-[#43516a]">
          No subjects yet. Create your first subject.
        </p>
      ) : null}

      <div className="mt-6 grid gap-5">
        {subjects.map((subject) => {
          const subjectTasks = tasks.filter((task) => task.subject_id === subject.id);
          const subjectOpenTasks = subjectTasks.filter((task) => task.status !== "completed");
          const nextTask = subjectTasks.find((task) => task.deadline);
          const updateError = subjectUpdateErrors[subject.id];
          const updateSuccess = subjectUpdateSuccesses[subject.id];
          const isSavingSubject = pendingSubjectId === subject.id;

          return (
            <SubjectCard
              key={subject.id}
              subject={subject}
              totalTasks={subjectTasks.length}
              openTasks={subjectOpenTasks.length}
              nextDeadline={formatOptionalDate(nextTask?.deadline ?? subject.exam_date, "-")}
              draft={subjectDrafts[subject.id]}
              updateError={updateError}
              updateSuccess={updateSuccess}
              isSaving={isSavingSubject}
              onUpdateDraft={onUpdateDraft}
              onUpdateSubject={onUpdateSubject}
            />
          );
        })}
      </div>
    </section>
  );
}

function SubjectCard({
  draft,
  isSaving,
  nextDeadline,
  onUpdateDraft,
  onUpdateSubject,
  openTasks,
  subject,
  totalTasks,
  updateError,
  updateSuccess,
}: {
  draft?: SubjectDraft;
  isSaving: boolean;
  nextDeadline: string;
  onUpdateDraft: (id: number, field: keyof SubjectDraft, value: string) => void;
  onUpdateSubject: (
    event: FormEvent<HTMLFormElement>,
    id: number,
    currentSubject: SubjectFormState,
  ) => Promise<void>;
  openTasks: number;
  subject: Subject;
  totalTasks: number;
  updateError?: string;
  updateSuccess?: string;
}) {
  const currentSubject = {
    name: subject.name,
    lecturer: subject.lecturer,
    exam_date: dateToDateInputValue(subject.exam_date),
  };

  return (
    <article className="overflow-hidden rounded-[10px] border border-[#e0d2ff] bg-white shadow-[0_14px_36px_rgba(79,48,143,0.08)]">
      <div className="relative flex items-start justify-between gap-4 bg-[#fbf7ff] p-5">
        <img
          src={subjectHeaderAccent}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="relative z-10 flex min-w-0 items-center gap-4">
          <img src={iconFlask} alt="" aria-hidden="true" className="size-11" />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black">{subject.name}</h3>
            <p className="mt-1 truncate text-sm font-semibold text-[#43516a]">
              {subject.lecturer || "No lecturer set"}
            </p>
          </div>
        </div>
        <span className="relative z-10 shrink-0 rounded-full bg-[#eadbff] px-4 py-1 text-sm font-black text-[#6f2bd9]">
          ID {subject.id}
        </span>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-[#e1e6ef] border-y border-[#e1e6ef]">
        <SubjectDatum label="Total tasks" value={String(totalTasks)} />
        <SubjectDatum label="Open tasks" value={String(openTasks)} />
        <SubjectDatum label="Next deadline" value={nextDeadline} highlight />
      </dl>

      <form
        className="p-5"
        onSubmit={(event) => onUpdateSubject(event, subject.id, currentSubject)}
      >
        <div className="grid gap-0 overflow-hidden rounded-[8px] border border-[#e1e6ef]">
          <InlineEditRow
            icon={tinyName}
            label="Name"
            value={draft?.name ?? subject.name}
            disabled={isSaving}
            onChange={(value) => onUpdateDraft(subject.id, "name", value)}
          />
          <InlineEditRow
            icon={tinyLecturer}
            label="Lecturer"
            value={draft?.lecturer ?? subject.lecturer}
            disabled={isSaving}
            onChange={(value) => onUpdateDraft(subject.id, "lecturer", value)}
          />
          <InlineEditRow
            icon={tinyExam}
            label="Exam date"
            type="date"
            value={draft?.exam_date ?? dateToDateInputValue(subject.exam_date)}
            disabled={isSaving}
            onChange={(value) => onUpdateDraft(subject.id, "exam_date", value)}
          />
        </div>

        {updateError ? (
          <p className="mt-3 rounded-[8px] border border-[#ffb3c4] bg-[#fff3f6] px-3 py-2 text-sm font-semibold text-[#c21646]">
            {updateError}
          </p>
        ) : null}

        {updateSuccess ? (
          <p className="mt-3 rounded-[8px] border border-[#b9ecc9] bg-[#f0fff4] px-3 py-2 text-sm font-semibold text-[#158c55]">
            {updateSuccess}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving || !draft}
          className="mt-4 h-11 w-full rounded-[8px] border border-[#b38cff] bg-white px-4 text-base font-black text-[#6f2bd9] transition hover:bg-[#f7f1ff] disabled:cursor-not-allowed disabled:border-[#d9dfea] disabled:text-[#9aa5b6]"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </article>
  );
}

function SubjectDatum({
  highlight = false,
  label,
  value,
}: {
  highlight?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="px-4 py-4">
      <dt className="text-sm font-medium text-[#43516a]">{label}</dt>
      <dd className={`mt-2 text-lg font-black ${highlight ? "text-[#6f2bd9]" : "text-black"}`}>
        {value}
      </dd>
    </div>
  );
}

function InlineEditRow({
  disabled,
  icon,
  label,
  onChange,
  type = "text",
  value,
}: {
  disabled: boolean;
  icon: string;
  label: string;
  onChange: (value: string) => void;
  type?: "date" | "text";
  value: string;
}) {
  return (
    <div className="grid grid-cols-[118px_minmax(0,1fr)] items-center border-b border-[#e1e6ef] last:border-b-0 sm:grid-cols-[138px_minmax(0,1fr)]">
      <span className="flex min-w-0 items-center gap-3 px-3 py-3 text-sm font-medium text-[#43516a] sm:px-4">
        <img src={icon} alt="" aria-hidden="true" className="size-4" />
        <span className="truncate">{label}</span>
      </span>
      <input
        aria-label={label}
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-0 border-l border-[#e1e6ef] bg-white px-3 text-sm font-semibold text-[#08111f] outline-none focus:bg-[#fbf7ff] sm:px-4"
      />
    </div>
  );
}

function CreateSubjectPanel({
  errors,
  form,
  hasSubmitted,
  isSubmitting,
  onChange,
  onSubmit,
  onTouch,
  submitError,
  touched,
}: {
  errors: SubjectFormErrors;
  form: SubjectFormState;
  hasSubmitted: boolean;
  isSubmitting: boolean;
  onChange: (field: keyof SubjectFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onTouch: (field: keyof SubjectFormState) => void;
  submitError: Error | null;
  touched: SubjectFormErrors;
}) {
  const showNameError = Boolean((hasSubmitted || touched.name) && errors.name);

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="relative overflow-hidden rounded-[12px] border border-[#d7dfea] bg-white p-6 shadow-[0_18px_50px_rgba(28,40,65,0.04)]"
    >
      <img
        src={formStrip}
        alt=""
        aria-hidden="true"
        className="absolute right-0 top-0 h-24 w-full object-cover opacity-25"
      />
      <img
        src={dotsBlue}
        alt=""
        aria-hidden="true"
        className="absolute right-[-80px] top-[110px] hidden w-[74px] opacity-65 xl:block"
      />
      <img
        src={dotsGreen}
        alt=""
        aria-hidden="true"
        className="absolute bottom-[-70px] right-4 hidden w-[74px] opacity-65 xl:block"
      />

      <div className="relative z-10">
        <h2 className="text-2xl font-black">Add subject</h2>
        <p className="mt-2 text-base text-[#1a2740]">
          Create a subject first, then connect study tasks to it.
        </p>

        <div className="mt-9 grid gap-7">
          <CreateField
            icon={iconSubjects}
            label="Subject name"
            value={form.name}
            placeholder="Databases"
            isInvalid={showNameError}
            onBlur={() => onTouch("name")}
            onChange={(value) => onChange("name", value)}
          />
          <CreateField
            icon={iconLecturer}
            label="Lecturer"
            value={form.lecturer}
            placeholder="Dr. Smith"
            onBlur={() => onTouch("lecturer")}
            onChange={(value) => onChange("lecturer", value)}
          />
          <CreateField
            icon={iconExam}
            label="Exam date"
            value={form.exam_date}
            placeholder="dd/mm/yyyy"
            onBlur={() => onTouch("exam_date")}
            onChange={(value) => onChange("exam_date", value)}
          />
        </div>

        {showNameError ? (
          <p className="mt-4 rounded-[8px] border border-[#ffb3c4] bg-[#fff3f6] px-3 py-2 text-sm font-semibold text-[#c21646]">
            {errors.name}
          </p>
        ) : null}

        {submitError ? (
          <p className="mt-4 rounded-[8px] border border-[#ffb3c4] bg-[#fff3f6] px-3 py-2 text-sm font-semibold text-[#c21646]">
            Failed to create subject: {submitError.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-9 flex h-12 w-full items-center justify-center gap-3 rounded-[8px] bg-[#1f63ef] px-5 text-base font-black text-white shadow-[0_14px_30px_rgba(31,99,239,0.28)] transition hover:bg-[#1855d6] disabled:cursor-not-allowed disabled:bg-[#9bb8f6]"
        >
          <img src={iconSparkle} alt="" aria-hidden="true" className="size-5" />
          {isSubmitting ? "Creating subject..." : "Create subject"}
        </button>
      </div>
    </form>
  );
}

function CreateField({
  icon,
  isInvalid = false,
  label,
  onBlur,
  onChange,
  placeholder,
  value,
}: {
  icon: string;
  isInvalid?: boolean;
  label: string;
  onBlur: () => void;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[56px_1fr] sm:items-end">
      <img src={icon} alt="" aria-hidden="true" className="size-13 rounded-[8px]" />
      <span>
        <span className="mb-2 block text-sm font-black text-[#1a2740]">{label}</span>
        <input
          aria-label={label}
          value={value}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={isInvalid}
          className={`${inputClassName} ${isInvalid ? "border-[#ff5b82] ring-4 ring-[#ffe7ee]" : ""}`}
        />
      </span>
    </div>
  );
}
