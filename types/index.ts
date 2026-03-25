export interface Site {
  id: string;
  user_id: string;
  name: string;
  url: string;
  app_password: string;
  wp_username: string;
  seo_plugin: 'yoast' | 'rankmath' | 'none' | null;
  created_at: string;
}

export interface Change {
  id: string;
  site_id: string;
  user_id: string;
  type: 'page_edit' | 'blog_post';
  page_id?: number;
  field?: string;
  old_value?: string;
  new_value: string;
  title?: string;
  status: 'pending' | 'deployed' | 'rolled_back';
  deployed_at?: string;
  wp_post_id?: number;
  created_at: string;
}

export interface BlogPost {
  title: string;
  meta_description: string;
  content: string;
  faq: Array<{ question: string; answer: string }>;
  cta: string;
  tags: string[];
  target_keyword: string;
  slug: string;
}

export interface WPPage {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  slug: string;
  link: string;
  status: string;
}

export interface ProposedChange {
  page_id: number;
  page_title: string;
  field: string;
  old_value: string;
  new_value: string;
}

export interface ToolInvocation {
  toolName: string;
  toolCallId: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
  state: 'call' | 'result' | 'partial-call';
}
