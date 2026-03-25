-- Create support_messages table for support chat
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin_reply BOOLEAN NOT NULL DEFAULT false,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view their own messages"
ON public.support_messages
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Users can create messages (not admin replies)
CREATE POLICY "Users can create messages"
ON public.support_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_admin_reply = false);

-- Admins can create replies
CREATE POLICY "Admins can create replies"
ON public.support_messages
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') AND is_admin_reply = true);

-- Enable realtime for support messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;