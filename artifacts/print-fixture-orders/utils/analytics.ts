export type AnalyticsEventName =
  | 'app_opened'
  | 'home_viewed'
  | 'order_started'
  | 'tooling_selected'
  | 'order_step_completed'
  | 'draft_saved'
  | 'draft_restored'
  | 'order_opened'
  | 'order_repeated'
  | 'order_submitted'
  | 'attachment_added'
  | 'attachment_removed'
  | 'template_created'
  | 'template_used'
  | 'calculator_opened'
  | 'calculator_completed'
  | 'manager_contact_clicked'
  | 'notification_settings_changed';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

export function track(name: AnalyticsEventName, metadata?: AnalyticsEvent['metadata']) {
  const event: AnalyticsEvent = { name, timestamp: new Date().toISOString(), metadata };
  if (__DEV__) {
    // Local development hook; no customer data or attachment contents are included.
    void event;
  }
}
