import { type TaskStatus } from '../../entities/task/types.ts'

export const statusLabels: Record<TaskStatus, string> = {
  not_completed: 'Not completed',
  in_progress: 'In progress',
  completed: 'Completed',
}

export const statusClasses: Record<TaskStatus, string> = {
  not_completed: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
}

export function getStatusLabel(status: string) {
  return statusLabels[status as TaskStatus] ?? status
}

export function getStatusClass(status: string) {
  return statusClasses[status as TaskStatus] ?? 'bg-slate-100 text-slate-700'
}
