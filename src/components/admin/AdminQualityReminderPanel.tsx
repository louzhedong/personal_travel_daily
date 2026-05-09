import type { AdminOverviewResponseDto } from '../../lib/api/types';
import { getAdminQualityReminder } from '../../modules/admin/adminPageModel';

interface AdminQualityReminderPanelProps {
  overview: AdminOverviewResponseDto;
}

export default function AdminQualityReminderPanel({ overview }: AdminQualityReminderPanelProps) {
  const reminder = getAdminQualityReminder(overview);

  return (
    <section className={`admin-quality-reminder admin-quality-reminder-${reminder.tone}`}>
      <span>提醒</span>
      <strong>{reminder.title}</strong>
      <p>{reminder.description}</p>
    </section>
  );
}
