import { type FormEvent, type ReactNode } from "react";
import { type Subject } from "../../entities/subject/types.ts";
import { type Task, type TaskStatus } from "../../entities/task/types.ts";
import {
  asTaskStatus,
  taskStatusOptions,
  type TaskFormErrors,
  type TaskFormState,
  useTasksPage,
} from "../../features/tasks/model/useTasksPage.ts";
import { formatOptionalDate, isOverdueDate } from "../../shared/lib/dateFormat.ts";
import { statusLabels } from "../../shared/lib/taskStatus.ts";
import { MetricCard } from "../../shared/ui/MetricCard.tsx";
import { Sidebar } from "../../shared/ui/navigation/Sidebar.tsx";
import { taskAssets, taskSidebarItems } from "./tasks.assets.ts";

const {
  avatarLogan,
  calendarInputIcon,
  chevronDown,
  dashedAddArea,
  dotsBlue,
  dotsGreen,
  dotsPurple,
  dotsYellow,
  emptyInbox,
  formStrip,
  heroTasks,
  iconCompleted,
  iconDeadline,
  iconInProgress,
  iconOpenTasks,
  iconStatus,
  iconSubject,
  iconTaskName,
  markerPurple,
  raysPurple,
  sparkleButton,
  tableHeaderBg,
} = taskAssets;

const inputClassName =
  "h-12 w-full rounded-[8px] border border-[#cfd7e4] bg-white px-4 text-base text-[#1a2740] shadow-[0_6px_18px_rgba(23,37,61,0.06)] outline-none transition placeholder:text-[#72809a] focus:border-[#6f2bd9] focus:ring-4 focus:ring-[#efe7ff] disabled:cursor-not-allowed disabled:bg-slate-100";

function formatCount(value: number | undefined) {
  return String(value ?? 0);
}

export function TasksPage() {
  const page = useTasksPage();
  const {
    completedTasks,
    createTaskMutation,
    formErrors,
    handleCreateTask,
    handleStatusChange,
    hasSubmitted,
    ongoingTasks,
    openTasks,
    pendingStatusTaskId,
    selectedSubjectId,
    setTaskForm,
    setTouchedFields,
    statusUpdateErrors,
    subjectNames,
    subjects,
    subjectsQuery,
    taskForm,
    tasks,
    tasksQuery,
    touchedFields,
  } = page;

  return (
    <div className="min-h-screen bg-white text-[#08111f]">
      <div className="mx-auto grid min-h-[calc(100vh-92px)] w-full max-w-[1584px] lg:grid-cols-[250px_1fr]">
        <Sidebar
          items={taskSidebarItems}
          avatar={avatarLogan}
          chevron={chevronDown}
          footerMessage="Stay consistent, see progress."
        />

        <main className="relative mx-auto w-full max-w-[350px] overflow-hidden px-5 py-8 sm:max-w-none sm:px-8 lg:px-8 lg:py-12">
          <section className="relative grid gap-8 xl:grid-cols-[minmax(0,660px)_560px] xl:items-center xl:justify-between">
            <div className="relative">
              <img
                src={raysPurple}
                alt=""
                aria-hidden="true"
                className="absolute left-[-44px] top-0 hidden w-[58px] lg:block"
              />
              <h1 className="max-w-[560px] text-[clamp(3rem,13vw,4.1rem)] font-black leading-[1.03] tracking-[-0.01em]">
                <span className="block">Plan and track</span>
                <span className="relative inline-block px-3">
                  <img
                    src={markerPurple}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-x-0 top-1/2 -z-0 h-[0.75em] w-full -translate-y-1/2"
                  />
                  <span className="relative z-10">study work.</span>
                </span>
              </h1>

              <p className="mt-6 max-w-[330px] text-lg leading-[1.55] text-[#43516a] sm:max-w-[480px] sm:text-xl">
                Create study tasks, connect them to subjects, and keep deadlines visible.
              </p>
            </div>

            <div className="relative hidden min-h-[230px] xl:block">
              <img
                src={dotsPurple}
                alt=""
                aria-hidden="true"
                className="absolute right-[-16px] top-[-50px] w-[90px] opacity-75"
              />
              <img src={heroTasks} alt="" className="ml-auto w-[500px]" />
            </div>
          </section>

          <section className="mt-10 grid gap-7 lg:grid-cols-3">
            <MetricCard
              title="Open tasks"
              value={formatCount(openTasks.length)}
              caption="Need attention"
              icon={iconOpenTasks}
              dots={dotsBlue}
              border="border-[#8bb6ff]"
              className="min-h-[160px] p-6"
              iconClassName="size-13"
              titleClassName="text-xl font-black"
              valueClassName="mt-6 text-4xl font-black leading-none"
              captionClassName="mt-3 text-base font-medium text-[#43516a]"
            />
            <MetricCard
              title="In progress"
              value={formatCount(ongoingTasks.length)}
              caption="Currently active"
              icon={iconInProgress}
              dots={dotsYellow}
              border="border-[#f4bd46]"
              className="min-h-[160px] p-6"
              iconClassName="size-13"
              titleClassName="text-xl font-black"
              valueClassName="mt-6 text-4xl font-black leading-none"
              captionClassName="mt-3 text-base font-medium text-[#43516a]"
            />
            <MetricCard
              title="Completed"
              value={formatCount(completedTasks.length)}
              caption="Recently closed"
              icon={iconCompleted}
              dots={dotsGreen}
              border="border-[#79c98d]"
              className="min-h-[160px] p-6"
              iconClassName="size-13"
              titleClassName="text-xl font-black"
              valueClassName="mt-6 text-4xl font-black leading-none"
              captionClassName="mt-3 text-base font-medium text-[#43516a]"
            />
          </section>

          <section className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_430px]">
            <TaskBoard
              tasks={tasks}
              subjects={subjects}
              isLoading={tasksQuery.isLoading}
              error={tasksQuery.error}
              subjectNames={subjectNames}
              pendingStatusTaskId={pendingStatusTaskId}
              statusUpdateErrors={statusUpdateErrors}
              onStatusChange={handleStatusChange}
            />

            <CreateTaskPanel
              form={taskForm}
              subjects={subjects}
              selectedSubjectId={selectedSubjectId}
              subjectsLoading={subjectsQuery.isLoading}
              subjectsError={subjectsQuery.error}
              errors={formErrors}
              touched={touchedFields}
              hasSubmitted={hasSubmitted}
              isSubmitting={createTaskMutation.isPending}
              submitError={createTaskMutation.error}
              onSubmit={handleCreateTask}
              onChange={(field, value) =>
                setTaskForm((current) => ({ ...current, [field]: value }))
              }
              onTouch={(field) => setTouchedFields((current) => ({ ...current, [field]: true }))}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

function TaskBoard({
  error,
  isLoading,
  onStatusChange,
  pendingStatusTaskId,
  statusUpdateErrors,
  subjectNames,
  tasks,
}: {
  error: Error | null;
  isLoading: boolean;
  onStatusChange: (id: number, status: TaskStatus) => Promise<void>;
  pendingStatusTaskId: number | null;
  statusUpdateErrors: Record<number, string>;
  subjectNames: Map<number, string>;
  subjects: Subject[];
  tasks: Task[];
}) {
  return (
    <section className="relative">
      <img
        src={dotsGreen}
        alt=""
        aria-hidden="true"
        className="absolute left-[-110px] top-[140px] hidden w-[74px] opacity-65 xl:block"
      />
      <p className="text-sm font-black uppercase tracking-wide text-[#5d20d8]">Task board</p>
      <h2 className="mt-3 text-2xl font-black">All tasks</h2>
      <p className="mt-2 text-base text-[#43516a]">Live task rows from the Go backend.</p>

      <div className="mt-6 overflow-hidden rounded-[12px] border border-[#d7dfea] bg-white shadow-[0_18px_50px_rgba(28,40,65,0.04)]">
        <div className="relative grid grid-cols-[1fr_160px_170px_160px] gap-4 overflow-hidden px-7 py-4 text-sm font-black uppercase tracking-wide text-[#72809a]">
          <img
            src={tableHeaderBg}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <span className="relative z-10">Task</span>
          <span className="relative z-10">Subject</span>
          <span className="relative z-10">Deadline</span>
          <span className="relative z-10">Status</span>
        </div>

        <div className="min-h-[290px] divide-y divide-[#edf1f6]">
          {isLoading ? (
            <p className="px-7 py-6 text-base text-[#43516a]">Loading tasks...</p>
          ) : null}

          {error ? (
            <p className="m-6 rounded-[8px] border border-[#ffb3c4] bg-[#fff3f6] px-4 py-3 text-sm font-semibold text-[#c21646]">
              Failed to load tasks: {error.message}
            </p>
          ) : null}

          {!isLoading && !error && tasks.length === 0 ? <EmptyTasksState /> : null}

          {!isLoading && !error
            ? tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  subjectName={subjectNames.get(task.subject_id) ?? `Subject ${task.subject_id}`}
                  pending={pendingStatusTaskId === task.id}
                  error={statusUpdateErrors[task.id]}
                  onStatusChange={onStatusChange}
                />
              ))
            : null}
        </div>
      </div>
    </section>
  );
}

function EmptyTasksState() {
  return (
    <div className="grid min-h-[288px] place-items-center px-6 py-10">
      <div className="w-full max-w-[430px] text-center">
        <div className="mx-auto grid max-w-[330px] grid-cols-[130px_1fr] items-center gap-6 text-left">
          <img src={emptyInbox} alt="" className="w-[130px]" />
          <div>
            <h3 className="text-xl font-black">No tasks yet</h3>
            <p className="mt-3 text-base leading-6 text-[#43516a]">
              Create your first study task to get started.
            </p>
          </div>
        </div>
        <button className="relative mt-8 h-14 w-full max-w-[360px] overflow-hidden rounded-[8px] text-base font-black text-[#7c3df0]">
          <img
            src={dashedAddArea}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 size-full"
          />
          <span className="relative z-10 inline-flex items-center gap-3">
            <span className="text-3xl leading-none">+</span>
            Add your first task
          </span>
        </button>
      </div>
    </div>
  );
}

function TaskRow({
  error,
  onStatusChange,
  pending,
  subjectName,
  task,
}: {
  error?: string;
  onStatusChange: (id: number, status: TaskStatus) => Promise<void>;
  pending: boolean;
  subjectName: string;
  task: Task;
}) {
  const status = asTaskStatus(task.status);
  const isOverdue = status !== "completed" && isOverdueDate(task.deadline);

  return (
    <article
      className={`grid gap-4 px-7 py-4 text-base md:grid-cols-[1fr_160px_170px_160px] md:items-center ${
        isOverdue ? "bg-[#fff6f8]" : "bg-white"
      }`}
    >
      <div>
        <h3 className="font-black">{task.name}</h3>
        {task.description ? (
          <p className="mt-1 line-clamp-2 text-sm font-medium text-[#72809a]">
            {task.description}
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 rounded-[8px] border border-[#ffb3c4] bg-[#fff3f6] px-3 py-2 text-sm font-semibold text-[#c21646]">
            {error}
          </p>
        ) : null}
      </div>
      <p className="font-semibold text-[#43516a]">{subjectName}</p>
      <div>
        <p className={`font-semibold ${isOverdue ? "text-[#dd144d]" : "text-[#43516a]"}`}>
          {formatOptionalDate(task.deadline, "No deadline")}
        </p>
        {isOverdue ? (
          <span className="mt-1 inline-flex rounded-full bg-[#ffe4eb] px-2 py-0.5 text-xs font-black text-[#dd144d]">
            Overdue
          </span>
        ) : null}
      </div>
      <select
        aria-label={`Update status for ${task.name}`}
        value={status}
        disabled={pending}
        onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}
        className="h-10 rounded-[8px] border border-[#cfd7e4] bg-white px-3 text-sm font-black text-[#1a2740] outline-none focus:border-[#6f2bd9] focus:ring-4 focus:ring-[#efe7ff]"
      >
        {taskStatusOptions.map((option) => (
          <option key={option} value={option}>
            {statusLabels[option]}
          </option>
        ))}
      </select>
    </article>
  );
}

function CreateTaskPanel({
  errors,
  form,
  hasSubmitted,
  isSubmitting,
  onChange,
  onSubmit,
  onTouch,
  selectedSubjectId,
  subjects,
  subjectsError,
  subjectsLoading,
  submitError,
  touched,
}: {
  errors: TaskFormErrors;
  form: TaskFormState;
  hasSubmitted: boolean;
  isSubmitting: boolean;
  onChange: <Field extends keyof TaskFormState>(field: Field, value: TaskFormState[Field]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onTouch: (field: keyof TaskFormState) => void;
  selectedSubjectId: number;
  subjects: Subject[];
  subjectsError: Error | null;
  subjectsLoading: boolean;
  submitError: Error | null;
  touched: TaskFormErrors;
}) {
  const showError = (field: keyof TaskFormState) =>
    Boolean((hasSubmitted || touched[field]) && errors[field]);
  const hasSubjects = subjects.length > 0;

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
        src={dotsGreen}
        alt=""
        aria-hidden="true"
        className="absolute bottom-20 right-[-90px] hidden w-[74px] opacity-65 xl:block"
      />

      <div className="relative z-10">
        <p className="text-sm font-black uppercase tracking-wide text-[#5d20d8]">New task</p>
        <h2 className="mt-3 text-2xl font-black">Add study task</h2>
        <p className="mt-2 text-base leading-6 text-[#43516a]">
          Keep task details structured for the API shape you will connect later.
        </p>

        <div className="mt-8 grid gap-5">
          <TaskCreateField
            icon={iconTaskName}
            label="Task name"
            error={showError("name") ? errors.name : undefined}
          >
            <input
              aria-label="Task name"
              value={form.name}
              disabled={isSubmitting}
              onBlur={() => onTouch("name")}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder="e.g. Read chapter 4"
              className={`${inputClassName} ${showError("name") ? "border-[#ff5b82] ring-4 ring-[#ffe7ee]" : ""}`}
              />
          </TaskCreateField>

          <TaskCreateField
            icon={iconOpenTasks}
            label="Description"
            error={showError("description") ? errors.description : undefined}
          >
            <textarea
              aria-label="Description"
              value={form.description}
              disabled={isSubmitting}
              onBlur={() => onTouch("description")}
              onChange={(event) => onChange("description", event.target.value)}
              placeholder="Optional notes"
              className={`${inputClassName} min-h-24 py-3 ${showError("description") ? "border-[#ff5b82] ring-4 ring-[#ffe7ee]" : ""}`}
            />
          </TaskCreateField>

          <TaskCreateField
            icon={iconSubject}
            label="Subject"
            error={showError("subject_id") ? errors.subject_id : undefined}
          >
            <select
              aria-label="Subject"
              value={selectedSubjectId || ""}
              disabled={isSubmitting || subjectsLoading || !hasSubjects}
              onBlur={() => onTouch("subject_id")}
              onChange={(event) => onChange("subject_id", Number(event.target.value))}
              className={`${inputClassName} ${showError("subject_id") ? "border-[#ff5b82] ring-4 ring-[#ffe7ee]" : ""}`}
            >
              {subjectsLoading ? <option value="">Loading subjects...</option> : null}
              {!subjectsLoading && !hasSubjects ? (
                <option value="">No subjects available</option>
              ) : null}
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </TaskCreateField>

          <TaskCreateField
            icon={iconDeadline}
            label="Deadline"
            error={showError("deadline") ? errors.deadline : undefined}
          >
            <div className="relative">
              <input
                aria-label="Deadline"
                type="date"
                value={form.deadline}
                disabled={isSubmitting}
                onBlur={() => onTouch("deadline")}
                onChange={(event) => onChange("deadline", event.target.value)}
                className={`${inputClassName} pr-11 ${showError("deadline") ? "border-[#ff5b82] ring-4 ring-[#ffe7ee]" : ""}`}
              />
              <img
                src={calendarInputIcon}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2"
              />
            </div>
          </TaskCreateField>

          <TaskCreateField icon={iconStatus} label="Status">
            <select
              aria-label="Status"
              value={form.status}
              disabled={isSubmitting}
              onBlur={() => onTouch("status")}
              onChange={(event) => onChange("status", event.target.value as TaskStatus)}
              className={inputClassName}
            >
              {taskStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </TaskCreateField>
        </div>

        {subjectsError ? (
          <p className="mt-4 rounded-[8px] border border-[#ffb3c4] bg-[#fff3f6] px-3 py-2 text-sm font-semibold text-[#c21646]">
            Failed to load subjects: {subjectsError.message}
          </p>
        ) : null}

        {submitError ? (
          <p className="mt-4 rounded-[8px] border border-[#ffb3c4] bg-[#fff3f6] px-3 py-2 text-sm font-semibold text-[#c21646]">
            Failed to create task: {submitError.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-[8px] bg-[#6f2bd9] px-5 text-base font-black text-white shadow-[0_14px_30px_rgba(111,43,217,0.28)] transition hover:bg-[#5c20bd] disabled:cursor-not-allowed disabled:bg-[#b9a2e6]"
        >
          <img src={sparkleButton} alt="" aria-hidden="true" className="size-5" />
          {isSubmitting ? "Creating task..." : "Create task"}
        </button>
      </div>
    </form>
  );
}

function TaskCreateField({
  children,
  error,
  icon,
  label,
}: {
  children: ReactNode;
  error?: string;
  icon: string;
  label: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[56px_1fr] sm:items-end">
      <img src={icon} alt="" aria-hidden="true" className="size-13 rounded-[8px]" />
      <div>
        <span className="mb-2 block text-sm font-black text-[#1a2740]">{label}</span>
        {children}
        {error ? <p className="mt-2 text-sm font-semibold text-[#c21646]">{error}</p> : null}
      </div>
    </div>
  );
}
