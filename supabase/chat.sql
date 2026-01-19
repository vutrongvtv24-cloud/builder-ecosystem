
-- Chat System Schema

-- 1. Conversations (Rooms)
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Participants (Join table)
create table public.max_participants (
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (conversation_id, user_id)
);

-- 3. Messages
create table public.direct_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_read boolean default false
);

-- Security (RLS)
alter table public.conversations enable row level security;
alter table public.max_participants enable row level security;
alter table public.direct_messages enable row level security;

-- Policies

-- Conversations: Users can see conversations they are part of
create policy "Users can view their conversations"
  on conversations for select
  using (
    exists (
      select 1 from public.max_participants
      where conversation_id = conversations.id
      and user_id = auth.uid()
    )
  );

-- Participants: Users can view participants of their conversations
create policy "Users can view participants"
  on max_participants for select
  using (
    exists (
      select 1 from public.max_participants as mp
      where mp.conversation_id = max_participants.conversation_id
      and mp.user_id = auth.uid()
    )
  );

-- Messages: Users can see messages in their conversations
create policy "Users can view messages"
  on direct_messages for select
  using (
    exists (
      select 1 from public.max_participants
      where conversation_id = direct_messages.conversation_id
      and user_id = auth.uid()
    )
  );

-- Messages: Users can insert messages if they are participants
create policy "Users can send messages"
  on direct_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.max_participants
      where conversation_id = direct_messages.conversation_id
      and user_id = auth.uid()
    )
  );

-- Helper Function: Get or Create Direct Conversation
create or replace function public.get_or_create_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  conv_id uuid;
begin
  -- Check if conversation exists between auth.uid() and other_user_id
  select c.id into conv_id
  from public.conversations c
  join public.max_participants p1 on c.id = p1.conversation_id
  join public.max_participants p2 on c.id = p2.conversation_id
  where p1.user_id = auth.uid()
  and p2.user_id = other_user_id
  limit 1;

  -- If not exists, create it
  if conv_id is null then
    insert into public.conversations (created_at) values (default) returning id into conv_id;
    
    insert into public.max_participants (conversation_id, user_id)
    values (conv_id, auth.uid()), (conv_id, other_user_id);
  end if;

  return conv_id;
end;
$$;
